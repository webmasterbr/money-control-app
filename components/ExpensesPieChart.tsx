"use client";

import { categoryLabelByValue } from "@/components/ExpenseFormFields";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#06b6d4",
  "#f43f5e"
];

export type ExpensesPieDatum = {
  category: string;
  total: number;
};

type Props = {
  data: ExpensesPieDatum[];
};

export function ExpensesPieChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="card flex h-64 items-center justify-center text-sm text-slate-600 dark:text-slate-400">
        Nenhuma despesa registrada neste mês.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    categoryLabel: categoryLabelByValue[item.category] ?? item.category
  }));

  return (
    <div className="card h-64 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        Despesas por categoria
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="categoryLabel"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg)",
              border: "1px solid var(--tooltip-border)",
              borderRadius: "0.5rem"
            }}
            labelStyle={{ color: "var(--tooltip-fg)" }}
            itemStyle={{ color: "var(--tooltip-fg)" }}
            formatter={(value) =>
              Number(value ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

