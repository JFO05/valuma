"use client";

import { useEffect, useRef, useState } from "react";
import { saveIntakeData } from "@/app/intake/actions";
import type { FaseIntake } from "@/lib/intake/fases";

export type AutosaveStatus = "idle" | "salvando" | "salvo" | "erro";

const DEBOUNCE_MS = 1500;

/**
 * Autosave genérico para as etapas do intake. Observa o objeto `dados` e,
 * 1.5s depois da última mudança, faz upsert em intake_data via Server Action
 * (processo_id + fase definem a linha; ver app/intake/actions.ts).
 *
 * NÃO salva no primeiro render (evita reescrever o banco com os dados que
 * acabaram de ser carregados dele mesmo).
 *
 * Como plugar num formulário react-hook-form:
 *
 * ```tsx
 * "use client";
 * import { useForm } from "react-hook-form";
 * import { zodResolver } from "@hookform/resolvers/zod";
 * import { z } from "zod";
 * import { useAutosave } from "@/lib/hooks/useAutosave";
 *
 * const schema = z.object({ setor: z.string().min(1) });
 * type FormValues = z.infer<typeof schema>;
 *
 * export function PerfilForm({
 *   processoId,
 *   dadosIniciais,
 * }: {
 *   processoId: string;
 *   dadosIniciais: Partial<FormValues>;
 * }) {
 *   const { register, watch } = useForm<FormValues>({
 *     resolver: zodResolver(schema),
 *     defaultValues: dadosIniciais,
 *   });
 *
 *   // watch() sem argumentos retorna um objeto novo a cada mudança de campo —
 *   // é exatamente o gatilho que o hook espera em `dados`.
 *   const dados = watch();
 *   const { status } = useAutosave(processoId, "perfil", dados);
 *
 *   return (
 *     <form>
 *       <input {...register("setor")} />
 *       <p>{status}</p>
 *     </form>
 *   );
 * }
 * ```
 *
 * O hook não valida nem formata `dados` — cada etapa decide o que colocar
 * ali (o objeto cru do watch(), ou só os campos já validados pelo zod).
 */
export function useAutosave(
  processoId: string,
  fase: FaseIntake,
  dados: Record<string, unknown>,
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const isFirstRender = useRef(true);

  // Dependência por CONTEÚDO (string), não por referência do objeto: watch()
  // devolve um objeto novo a cada render — inclusive nos renders causados
  // pelo próprio setStatus abaixo. Usar `dados` direto no array de
  // dependências reagendava um novo save toda vez que o status mudava
  // (salvando -> re-render -> "dados" novo -> agenda de novo -> ...),
  // criando um loop infinito que nunca parava de salvar. Com a versão
  // serializada, o efeito só dispara quando o conteúdo realmente muda.
  const dadosSerializados = JSON.stringify(dados);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(async () => {
      setStatus("salvando");
      const result = await saveIntakeData(processoId, fase, dados);
      setStatus(result.success ? "salvo" : "erro");
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosSerializados, processoId, fase]);

  return { status };
}
