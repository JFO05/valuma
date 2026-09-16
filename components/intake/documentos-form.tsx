"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveIntakeData } from "@/app/intake/actions";
import { uploadDocumento } from "@/lib/intake/upload-documento";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { DocumentoListItem } from "@/components/intake/documento-list-item";
import {
  DocumentoUploadProgress,
  type UploadEmAndamento,
} from "@/components/intake/documento-upload-progress";
import {
  BUCKET_DOCUMENTOS,
  parseDocumentosData,
  sanitizeFileName,
  validarArquivo,
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
      window.alert("Sessão expirada. Faça login novamente.");
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

        const novoDocumento: DocumentoArquivo = {
          nome: file.name,
          path,
          tamanho: file.size,
          tipo: file.type,
          enviadoEm: new Date().toISOString(),
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

  async function handleRemover(documento: DocumentoArquivo) {
    setRemovendoPath(documento.path);

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(BUCKET_DOCUMENTOS)
      .remove([documento.path]);

    setRemovendoPath(null);

    if (error) {
      window.alert(`Não foi possível remover o arquivo: ${error.message}`);
      return;
    }

    const novaLista = arquivosRef.current.filter((a) => a.path !== documento.path);
    await persistir(novaLista);
  }

  return (
    <div className="flex flex-col gap-4">
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
            />
          ))}
        </ul>
      )}

      <AutosaveStatusIndicator status={status} />
    </div>
  );
}
