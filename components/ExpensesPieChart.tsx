"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6"
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
      <div className="card flex h-64 items-center justify-center text-sm text-slate-400">
        Nenhuma despesa registrada neste mês.
      </div>
    );
  }

  return (
    <div className="card h-64 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-200">
        Despesas por categoria
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString("pt-BR", {
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

