"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveIntakeData } from "@/app/(app)/intake/actions";
import { uploadDocumento } from "@/lib/intake/upload-documento";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { useConfirm } from "@/components/confirm-dialog";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { IntakeNavButtons } from "@/components/intake/intake-nav-buttons";
import { CategoriaDocumentoCard } from "@/components/intake/categoria-documento-card";
import type { UploadEmAndamento } from "@/components/intake/documento-upload-progress";
import {
  BUCKET_DOCUMENTOS,
  CATEGORIAS_DOCUMENTO,
  calcularHashArquivo,
  encontrarDuplicata,
  parseDocumentosData,
  sanitizeFileName,
  validarArquivo,
  type CategoriaDocumento,
  type DocumentoArquivo,
} from "@/lib/intake/schema-documentos";
import type { AutosaveStatus } from "@/lib/hooks/useAutosave";

/**
 * Diferente das outras etapas: não usa useAutosave (não há debounce de
 * digitação aqui, é evento de upload/remoção). Chama saveIntakeData
 * diretamente — o mesmo mecanismo de salvamento das outras etapas — logo
 * depois de cada upload/remoção bem-sucedida.
 *
 * Cada uma das 6 categorias fixas (RG-35) tem seu próprio card com seu
 * próprio upload — a categoria é definida no momento do envio (qual card o
 * cliente usou), não escolhida depois num seletor por arquivo.
 */
export function DocumentosForm({
  processoId,
  dadosIniciais,
}: {
  processoId: string;
  dadosIniciais: Record<string, unknown>;
}) {
  const [arquivos, setArquivos] = useState<DocumentoArquivo[]>(
    () => parseDocumentosData(dadosIniciais).arquivos,
  );
  const arquivosRef = useRef(arquivos);
  arquivosRef.current = arquivos;

  // Corrige o usuário voltar pra esta página pelo botão Voltar/Avançar do
  // navegador com uma lista desatualizada em cache (ver
  // lib/hooks/useFreshDadosIniciais.ts).
  useFreshDadosIniciais(processoId, "documentos", (dados) => {
    const frescos = parseDocumentosData(dados).arquivos;
    setArquivos(frescos);
    arquivosRef.current = frescos;
  });

  const [uploads, setUploads] = useState<UploadEmAndamento[]>([]);
  const [removendoPath, setRemovendoPath] = useState<string | null>(null);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  // Serializa os saves: cada upload/remoção só grava no banco depois que o
  // anterior terminou, senão duas respostas de rede fora de ordem podem
  // sobrescrever uma lista mais nova com uma mais antiga.
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  function persistir(novaLista: DocumentoArquivo[]) {
    setArquivos(novaLista);
    arquivosRef.current = novaLista;

    saveQueueRef.current = saveQueueRef.current.then(async () => {
      setStatus("salvando");
      const result = await saveIntakeData(processoId, "documentos", {
        arquivos: novaLista,
      });
      setStatus(result.success ? "salvo" : "erro");
    });

    return saveQueueRef.current;
  }

  async function handleFiles(fileList: FileList | null, categoria: CategoriaDocumento) {
    if (!fileList || fileList.length === 0) return;
    setErroGeral(null);

    // Snapshot ANTES de qualquer `await`: o <input> reseta `value = ""` logo
    // depois de chamar esta função (no handler onChange, para permitir
    // selecionar o mesmo arquivo de novo), e o Chromium limpa a MESMA
    // FileList em memória quando isso acontece — se ainda estivéssemos
    // iterando `fileList` depois do primeiro `await` abaixo, ela já teria
    // sido esvaziada e o upload nunca rodaria (sem erro nenhum, silencioso).
    const files = Array.from(fileList);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setErroGeral("Sessão expirada. Faça login novamente.");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    for (const file of files) {
      const erroValidacao = validarArquivo(file);
      const uploadId = crypto.randomUUID();

      if (erroValidacao) {
        setUploads((prev) => [
          ...prev,
          { id: uploadId, nome: file.name, progresso: 0, status: "erro", erro: erroValidacao, categoria },
        ]);
        continue;
      }

      setUploads((prev) => [
        ...prev,
        { id: uploadId, nome: file.name, progresso: 0, status: "enviando", categoria },
      ]);

      const path = `${processoId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

      try {
        await uploadDocumento({
          supabaseUrl,
          anonKey,
          accessToken: session.access_token,
          bucket: BUCKET_DOCUMENTOS,
          path,
          file,
          onProgress: (percent) => {
            setUploads((prev) =>
              prev.map((u) => (u.id === uploadId ? { ...u, progresso: percent } : u)),
            );
          },
        });

        // Hash de conteúdo (RG-36/1.4): a categoria já é conhecida no momento
        // do upload (é o card em que o cliente clicou), então a checagem de
        // duplicidade acontece aqui mesmo, antes de persistir — não precisa
        // mais esperar uma escolha de categoria posterior.
        const hash =
          typeof crypto !== "undefined" && crypto.subtle
            ? await calcularHashArquivo(file).catch(() => undefined)
            : undefined;

        if (hash) {
          const duplicata = encontrarDuplicata(arquivosRef.current, { hash, categoria });

          if (duplicata) {
            // Sem um terceiro botão disponível no diálogo de confirmação, a
            // escolha de 3 vias (substituir / manter complementar / cancelar)
            // é feita em duas perguntas sequenciais, cada uma com só 2 opções.
            const manterOsDois = await confirm({
              titulo: "Documento duplicado nesta categoria",
              mensagem: `"${duplicata.nome}" já está nesta categoria e parece ser o mesmo arquivo. Manter os dois como complementares? (não conta como duas categorias diferentes na Prontidão)`,
              confirmarLabel: "Manter os dois",
            });

            if (!manterOsDois) {
              const substituir = await confirm({
                titulo: "Substituir documento existente?",
                mensagem: `Deseja substituir "${duplicata.nome}" por este novo documento?`,
                confirmarLabel: "Substituir",
              });

              if (!substituir) {
                // Cancelar: descarta o arquivo recém-enviado (já está no
                // Storage, mas nunca foi persistido no jsonb) para não deixar
                // um objeto órfão.
                await supabase.storage.from(BUCKET_DOCUMENTOS).remove([path]);
                setUploads((prev) => prev.filter((u) => u.id !== uploadId));
                continue;
              }

              setRemovendoPath(duplicata.path);
              await supabase.storage.from(BUCKET_DOCUMENTOS).remove([duplicata.path]);
              setRemovendoPath(null);

              const semODuplicado = arquivosRef.current.filter((a) => a.path !== duplicata.path);
              const novoDocumento: DocumentoArquivo = {
                nome: file.name,
                path,
                tamanho: file.size,
                tipo: file.type,
                enviadoEm: new Date().toISOString(),
                hash,
                categoria,
              };
              await persistir([...semODuplicado, novoDocumento]);
              setUploads((prev) => prev.filter((u) => u.id !== uploadId));
              continue;
            }
            // "Manter os dois": segue para persistir normalmente.
          }
        }

        const novoDocumento: DocumentoArquivo = {
          nome: file.name,
          path,
          tamanho: file.size,
          tipo: file.type,
          enviadoEm: new Date().toISOString(),
          hash,
          categoria,
        };

        await persistir([...arquivosRef.current, novoDocumento]);

        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? {
                  ...u,
                  status: "erro",
                  erro: err instanceof Error ? err.message : "Falha no upload.",
                }
              : u,
          ),
        );
      }
    }
  }

  async function handlePeriodoChange(documento: DocumentoArquivo, periodoReferencia: string) {
    await persistir(
      arquivosRef.current.map((a) =>
        a.path === documento.path ? { ...a, periodoReferencia: periodoReferencia || undefined } : a,
      ),
    );
  }

  async function handleRemover(documento: DocumentoArquivo) {
    const confirmado = await confirm(
      `Remover "${documento.nome}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    setErroGeral(null);
    setRemovendoPath(documento.path);

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(BUCKET_DOCUMENTOS)
      .remove([documento.path]);

    setRemovendoPath(null);

    if (error) {
      setErroGeral(`Não foi possível remover o arquivo: ${error.message}`);
      return;
    }

    const novaLista = arquivosRef.current.filter((a) => a.path !== documento.path);
    await persistir(novaLista);
  }

  return (
    <div className="flex flex-col gap-8">
      {dialog}

      {erroGeral && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {erroGeral}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-semibold text-ink dark:text-zinc-50">
            Categorias documentais
          </h2>
          <AjudaPopover campoId="documentos" />
        </div>
        <p className="text-xs text-zinc-500">
          PDF, DOC/DOCX, XLS/XLSX, JPG ou PNG — até 20 MB por arquivo. Anexe
          direto na categoria correta.
        </p>

        <div id="documentos.arquivos" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIAS_DOCUMENTO.map((categoria) => (
            <CategoriaDocumentoCard
              key={categoria}
              categoria={categoria}
              arquivos={arquivos.filter((a) => a.categoria === categoria)}
              uploads={uploads.filter((u) => u.categoria === categoria)}
              removendoPath={removendoPath}
              onFiles={(fileList) => handleFiles(fileList, categoria)}
              onRemover={handleRemover}
              onPeriodoChange={handlePeriodoChange}
              onDispensarUpload={(uploadId) =>
                setUploads((prev) => prev.filter((u) => u.id !== uploadId))
              }
            />
          ))}
        </div>
      </div>

      <AutosaveStatusIndicator status={status} />
      {/* Documentos não tem campos mínimos (RG-43) e é a última etapa — o
          botão "Próximo" vira "Ir para o Resultado". */}
      <IntakeNavButtons
        processoId={processoId}
        faseAtual="documentos"
        status={status}
        podeAvancar
      />
    </div>
  );
}
