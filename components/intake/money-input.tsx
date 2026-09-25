"use client";

import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Único componente/utilitário de input monetário em BRL do projeto — todos
 * os campos em R$ dos 4 formulários que têm valores financeiros passam por
 * aqui (DEF-02). Mostra formatado ("R$ 1.234,56") quando não está focado, e
 * um número editável (vírgula como separador decimal) enquanto o usuário
 * digita. O valor no react-hook-form (e no jsonb salvo) é sempre `number`,
 * nunca a string formatada.
 */
export function MoneyInput<TFieldValues extends FieldValues>({
  control,
  name,
  className,
  ...props
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  className?: string;
} & Omit<
  React.ComponentProps<"input">,
  "name" | "value" | "onChange" | "onBlur" | "type" | "className"
>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <MoneyInputField
          value={field.value as number | undefined}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          className={className}
          {...props}
        />
      )}
    />
  );
}

/**
 * Só aceita dígitos, ponto, vírgula e um sinal de menos no início — qualquer
 * outro caractere (letras, símbolos) já reprova antes mesmo de tentar
 * converter para número.
 */
const CARACTERES_VALIDOS = /^-?[\d.,]*$/;

function normalizarEValidar(textoBruto: string): { valor: number | undefined; valido: boolean } {
  const texto = textoBruto.trim();

  if (texto === "") {
    return { valor: undefined, valido: true };
  }

  if (!CARACTERES_VALIDOS.test(texto) || texto === "-") {
    return { valor: undefined, valido: false };
  }

  const normalizado = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number.parseFloat(normalizado);

  return Number.isFinite(numero)
    ? { valor: numero, valido: true }
    : { valor: undefined, valido: false };
}

function MoneyInputField({
  value,
  onChange,
  onBlur,
  inputRef,
  className,
  ...props
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  inputRef: React.Ref<HTMLInputElement>;
  className?: string;
} & Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "onBlur" | "ref" | "type"
>) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawText, setRawText] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  // Enquanto há um erro pendente, continua mostrando exatamente o que o
  // usuário digitou (mesmo sem foco) — não descarta silenciosamente o valor
  // anterior nem troca de volta para ele sem avisar (DEF-02).
  const mostraTextoBruto = isFocused || erro !== null;
  const displayValue = mostraTextoBruto
    ? rawText
    : typeof value === "number" && !Number.isNaN(value)
      ? currencyFormatter.format(value)
      : "";

  return (
    <div className="flex flex-col gap-1">
      <input
        {...props}
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        aria-invalid={erro !== null || undefined}
        onFocus={() => {
          setIsFocused(true);
          if (erro === null) {
            setRawText(
              typeof value === "number" && !Number.isNaN(value)
                ? String(value).replace(".", ",")
                : "",
            );
          }
          // Se já havia erro, mantém o texto bruto atual (o que o usuário
          // digitou) em vez de sobrescrever com o último valor válido — é
          // isso que o usuário está tentando corrigir.
        }}
        onChange={(e) => setRawText(e.target.value)}
        onBlur={() => {
          setIsFocused(false);
          const resultado = normalizarEValidar(rawText);

          if (!resultado.valido) {
            setErro("Digite um valor numérico, por exemplo 1.234,56.");
            // NÃO chama onChange aqui: o valor anterior (o que já estava
            // salvo) permanece intacto até o usuário corrigir o texto.
          } else {
            setErro(null);
            onChange(resultado.valor);
          }

          onBlur();
        }}
        className={className}
      />
      {erro && (
        <span className="text-xs text-red-600" role="alert">
          {erro}
        </span>
      )}
    </div>
  );
}
