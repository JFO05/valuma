"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveIntakeData } from "@/app/(app)/intake/actions";
import { uploadDocumento } from "@/lib/intake/upload-documento";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { useConfirm } from "@/components/confirm-dialog";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { VoltarDashboardButton } from "@/components/intake/voltar-dashboard-button";
import { DocumentoListItem } from "@/components/intake/documento-list-item";
import {
  DocumentoUploadProgress,
  type UploadEmAndamento,
} from "@/components/intake/documento-upload-progress";
import {
  BUCKET_DOCUMENTOS,
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

  async function handleFiles(fileList: FileList | null) {
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
          { id: uploadId, nome: file.name, progresso: 0, status: "erro", erro: erroValidacao },
        ]);
        continue;
      }

      setUploads((prev) => [
        ...prev,
        { id: uploadId, nome: file.name, progresso: 0, status: "enviando" },
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

        // Hash de conteúdo (RG-36/1.4): usado só para detectar duplicidade ao
        // categorizar o documento (ver handleCategoriaChange abaixo). Melhor
        // esforço — crypto.subtle exige contexto seguro (https/localhost);
        // sem ele, o documento simplesmente não participa da checagem.
        const hash =
          typeof crypto !== "undefined" && crypto.subtle
            ? await calcularHashArquivo(file).catch(() => undefined)
            : undefined;

        const novoDocumento: DocumentoArquivo = {
          nome: file.name,
          path,
          tamanho: file.size,
          tipo: file.type,
          enviadoEm: new Date().toISOString(),
          hash,
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

  async function handleCategoriaChange(documento: DocumentoArquivo, categoria: CategoriaDocumento) {
    // RG-36: duplicidade é avaliada por hash + categoria — só faz sentido
    // checar no momento em que a categoria é escolhida (é quando o par
    // hash+categoria passa a existir de fato).
    if (documento.hash) {
      const outros = arquivosRef.current.filter((a) => a.path !== documento.path);
      const duplicata = encontrarDuplicata(outros, { hash: documento.hash, categoria });

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

          if (!substituir) return; // cancelar: não atribui a categoria

          setRemovendoPath(duplicata.path);
          const supabase = createClient();
          await supabase.storage.from(BUCKET_DOCUMENTOS).remove([duplicata.path]);
          setRemovendoPath(null);

          const semODuplicado = arquivosRef.current.filter((a) => a.path !== duplicata.path);
          await persistir(
            semODuplicado.map((a) => (a.path === documento.path ? { ...a, categoria } : a)),
          );
          return;
        }
        // "Manter os dois": segue para atribuir a categoria normalmente.
      }
    }

    await persistir(
      arquivosRef.current.map((a) => (a.path === documento.path ? { ...a, categoria } : a)),
    );
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
    <div className="flex flex-col gap-4">
      {dialog}

      {erroGeral && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {erroGeral}
        </p>
      )}

      <div id="documentos.arquivos" className="flex items-start gap-1">
        <label className="flex w-fit cursor-pointer flex-col gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-sm dark:border-zinc-700">
          <span className="font-medium">Clique para anexar arquivos</span>
          <span className="text-xs text-zinc-500">
            PDF, DOC/DOCX, XLS/XLSX, JPG ou PNG — até 20 MB por arquivo
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <AjudaPopover campoId="documentos" />
      </div>

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2">
          {uploads.map((upload) => (
            <DocumentoUploadProgress
              key={upload.id}
              upload={upload}
              onDispensar={() =>
                setUploads((prev) => prev.filter((u) => u.id !== upload.id))
              }
            />
          ))}
        </ul>
      )}

      {arquivos.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum arquivo enviado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {arquivos.map((documento) => (
            <DocumentoListItem
              key={documento.path}
              documento={documento}
              removendo={removendoPath === documento.path}
              onRemover={() => handleRemover(documento)}
              onCategoriaChange={(categoria) => handleCategoriaChange(documento, categoria)}
              onPeriodoChange={(periodo) => handlePeriodoChange(documento, periodo)}
            />
          ))}
        </ul>
      )}

      <AutosaveStatusIndicator status={status} />
      <VoltarDashboardButton status={status} />
    </div>
  );
}
