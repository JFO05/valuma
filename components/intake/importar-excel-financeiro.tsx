"use client";

import { useRef, useState } from "react";
import { importarPlanilhaFinanceiro } from "@/app/(app)/intake/financeiro-excel-actions";
import type { ValoresImportadosFinanceiro } from "@/lib/intake/excel-financeiro";

type EstadoImportacao =
  | { tipo: "idle" }
  | { tipo: "lendo" }
  | { tipo: "erro"; mensagem: string }
  | {
      tipo: "revisao";
      anosEncontrados: number[];
      camposEncontrados: string[];
      camposNaoEncontrados: string[];
      totalCamposReconhecidos: number;
      totalCamposPossiveis: number;
      valores: ValoresImportadosFinanceiro;
    };

/**
 * Atalho de preenchimento da etapa Financeiro a partir de uma planilha Excel
 * que a empresa já tenha pronta — não é um documento da etapa Documentos
 * (RG-35): o arquivo nunca é salvo, só é lido para preencher os campos
 * abaixo. Qualquer valor não encontrado na planilha fica de fora da
 * importação — o formulário mantém o que já estava lá (nunca zera/inventa).
 * O usuário sempre revisa o que foi encontrado antes de aplicar ao
 * formulário (e pode cancelar sem nenhum campo ser alterado).
 */
export function ImportarExcelFinanceiro({
  onAplicar,
}: {
  onAplicar: (valores: ValoresImportadosFinanceiro) => void;
}) {
  const [estado, setEstado] = useState<EstadoImportacao>({ tipo: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoSelecionarArquivo(file: File | undefined) {
    if (!file) return;
    setEstado({ tipo: "lendo" });

    const formData = new FormData();
    formData.set("arquivo", file);

    const resultado = await importarPlanilhaFinanceiro(formData);

    if (!resultado.sucesso) {
      setEstado({ tipo: "erro", mensagem: resultado.erro ?? "Falha ao ler o arquivo." });
      return;
    }

    setEstado({
      tipo: "revisao",
      anosEncontrados: resultado.anosEncontrados,
      camposEncontrados: resultado.camposEncontrados,
      camposNaoEncontrados: resultado.camposNaoEncontrados,
      totalCamposReconhecidos: resultado.totalCamposReconhecidos,
      totalCamposPossiveis: resultado.totalCamposPossiveis,
      valores: resultado.valores,
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="text-sm font-semibold text-ink dark:text-zinc-50">
          Já tem esses dados numa planilha?
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Baixe o modelo, preencha e importe de volta para preencher os campos
          abaixo automaticamente. O arquivo não é salvo — só os valores lidos
          dele são usados.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/api/intake/financeiro/template"
          download
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600"
        >
          Baixar modelo (.xlsx)
        </a>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={estado.tipo === "lendo"}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {estado.tipo === "lendo" ? "Lendo planilha..." : "Importar planilha preenchida"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            void aoSelecionarArquivo(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {estado.tipo === "erro" && (
        <p className="text-xs text-red-600">{estado.mensagem}</p>
      )}

      {estado.tipo === "revisao" && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-ink dark:text-zinc-50">
            Encontramos: {estado.anosEncontrados.length} ano(s)
            {estado.anosEncontrados.length > 0 && ` (${estado.anosEncontrados.join(", ")})`},{" "}
            {estado.totalCamposReconhecidos} de {estado.totalCamposPossiveis} campos
            reconhecidos.
          </p>
          {estado.camposNaoEncontrados.length > 0 && (
            <p className="text-xs text-zinc-500">
              {estado.camposNaoEncontrados.length} campo(s) não encontrado(s) continuarão
              como estão no formulário — nada é zerado ou inventado.
            </p>
          )}

          {estado.camposEncontrados.length > 0 && (
            <details className="text-xs text-zinc-600 dark:text-zinc-400">
              <summary className="cursor-pointer font-medium">Ver campos encontrados</summary>
              <ul className="mt-1 flex flex-col gap-0.5 pl-1">
                {estado.camposEncontrados.map((campo) => (
                  <li key={campo} className="flex items-center gap-1.5">
                    <span aria-hidden className="text-emerald-600">✓</span> {campo}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {estado.camposNaoEncontrados.length > 0 && (
            <details className="text-xs text-zinc-600 dark:text-zinc-400">
              <summary className="cursor-pointer font-medium">Ver campos não encontrados</summary>
              <ul className="mt-1 flex flex-col gap-0.5 pl-1">
                {estado.camposNaoEncontrados.map((campo) => (
                  <li key={campo} className="flex items-center gap-1.5">
                    <span aria-hidden className="text-amber-600">⚠</span> {campo}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onAplicar(estado.valores);
                setEstado({ tipo: "idle" });
              }}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Aplicar ao formulário
            </button>
            <button
              type="button"
              onClick={() => setEstado({ tipo: "idle" })}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-ink dark:border-zinc-700 dark:text-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
