"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FaseIntake } from "@/lib/intake/fases";

/**
 * Corrige um efeito colateral do Client Cache do App Router: ao voltar para
 * esta página pelo botão Voltar/Avançar do navegador (não o stepper), o
 * React reaproveita a MESMA instância do componente de formulário em vez de
 * remontar — e react-hook-form só aplica `defaultValues` uma vez, na
 * primeira montagem. Resultado: mesmo a prop `dadosIniciais` chegando
 * correta nessa navegação, o formulário continua mostrando o que estava lá
 * na primeira vez que a página foi visitada (geralmente vazio).
 *
 * A correção: buscar o valor mais recente direto no Supabase (fora do
 * pipeline de cache do Next — é uma chamada client-side comum) e chamar
 * `reset()` incondicionalmente com o que vier do banco, tanto na montagem
 * quanto em todo evento `popstate` (disparado pelo gesto de
 * Voltar/Avançar, independente de o componente ter remontado ou não).
 */
export function useFreshDadosIniciais(
  processoId: string,
  fase: FaseIntake,
  onDadosFrescos: (dados: Record<string, unknown>) => void,
) {
  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      const supabase = createClient();
      const { data } = await supabase
        .from("intake_data")
        .select("dados")
        .eq("processo_id", processoId)
        .eq("fase", fase)
        .maybeSingle();

      if (cancelado || !data?.dados) return;

      onDadosFrescos(data.dados as Record<string, unknown>);
    }

    buscar();
    window.addEventListener("popstate", buscar);

    return () => {
      cancelado = true;
      window.removeEventListener("popstate", buscar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoId, fase]);
}
