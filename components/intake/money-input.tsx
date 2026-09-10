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
 * Input de valor monetário: mostra formatado em Real ("R$ 1.234,56") quando
 * não está focado, e um número editável (vírgula como separador decimal)
 * enquanto o usuário digita. O valor no react-hook-form (e no jsonb salvo)
 * é sempre `number`, nunca a string formatada.
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

  const displayValue = isFocused
    ? rawText
    : typeof value === "number" && !Number.isNaN(value)
      ? currencyFormatter.format(value)
      : "";

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onFocus={() => {
        setIsFocused(true);
        setRawText(
          typeof value === "number" && !Number.isNaN(value)
            ? String(value).replace(".", ",")
            : "",
        );
      }}
      onChange={(e) => setRawText(e.target.value)}
      onBlur={() => {
        setIsFocused(false);
        const normalized = rawText.replace(/\./g, "").replace(",", ".");
        const parsed = Number.parseFloat(normalized);
        onChange(Number.isFinite(parsed) ? parsed : undefined);
        onBlur();
      }}
      className={className}
    />
  );
}
