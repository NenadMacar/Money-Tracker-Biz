import React from "react";
import { Text, TextStyle } from "react-native";

interface CurrencyTextProps {
  amount: number;
  style?: TextStyle;
  colored?: boolean;
  type?: "income" | "expense" | "balance";
}

const INCOME_COLOR = "#22c55e";
const EXPENSE_COLOR = "#ef4444";
const BALANCE_POSITIVE = "#1e40af";
const BALANCE_NEGATIVE = "#ef4444";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("bs-BA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " KM";
}

export default function CurrencyText({
  amount,
  style,
  colored = false,
  type,
}: CurrencyTextProps) {
  let color: string | undefined;
  if (colored) {
    if (type === "income") color = INCOME_COLOR;
    else if (type === "expense") color = EXPENSE_COLOR;
    else if (type === "balance") color = amount >= 0 ? BALANCE_POSITIVE : BALANCE_NEGATIVE;
  }

  return (
    <Text style={[style, color ? { color } : undefined]}>
      {type === "expense" && amount > 0 ? "-" : ""}
      {formatCurrency(amount)}
    </Text>
  );
}
