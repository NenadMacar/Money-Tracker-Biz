import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";

interface DonutSlice {
  category: string;
  amount: number;
  icon: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  type: "income" | "expense";
}

const INCOME_COLORS  = ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#86efac"];
const EXPENSE_COLORS = ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#fca5a5"];

export default function DonutChart({ data, type }: DonutChartProps) {
  const colors = useColors();
  const { formatAmount } = useFinance();
  const total   = data.reduce((s, d) => s + d.amount, 0);
  const palette = type === "income" ? INCOME_COLORS : EXPENSE_COLORS;

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Nema podataka za ovaj period
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.map((item, i) => {
        const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0";
        return (
          <View key={i} style={styles.row}>
            <View style={[styles.colorBar, { backgroundColor: palette[i % palette.length] }]} />
            <View style={styles.labelGroup}>
              <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>
                {item.category}
              </Text>
              <Text style={[styles.pct, { color: colors.mutedForeground }]}>{pct}%</Text>
            </View>
            <Text style={[styles.amount, { color: colors.foreground }]}>
              {formatAmount(item.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row:        { flexDirection: "row", alignItems: "center", gap: 10 },
  colorBar:   { width: 4, height: 36, borderRadius: 2 },
  labelGroup: { flex: 1, gap: 2 },
  catName:    { fontSize: 14, fontFamily: "Inter_500Medium" },
  pct:        { fontSize: 12, fontFamily: "Inter_400Regular" },
  amount:     { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty:      { alignItems: "center", paddingVertical: 24 },
  emptyText:  { fontSize: 14, fontFamily: "Inter_400Regular" },
});
