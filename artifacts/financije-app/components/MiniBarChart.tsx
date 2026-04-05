import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BarData {
  month: string;
  income: number;
  expenses: number;
}

interface MiniBarChartProps {
  data: BarData[];
}

export default function MiniBarChart({ data }: MiniBarChartProps) {
  const colors = useColors();
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expenses)), 1);

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {data.map((d, i) => (
          <View key={i} style={styles.barGroup}>
            <View style={styles.barPair}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max((d.income / maxVal) * 80, 4),
                    backgroundColor: colors.income,
                    borderRadius: 4,
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max((d.expenses / maxVal) * 80, 4),
                    backgroundColor: colors.expense,
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {d.month}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Prihodi</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Rashodi</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 90,
  },
  barGroup: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  barPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    flex: 1,
  },
  bar: {
    width: 8,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
