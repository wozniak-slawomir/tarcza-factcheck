"use client";

import { Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function TrendingChart({
  chartData,
  chartConfig,
}: {
  chartData?: Array<{ browser: string; visitors: number; fill?: string }>;
  chartConfig?: ChartConfig;
}) {
  const effectiveConfig: ChartConfig = chartConfig ?? { visitors: { label: "Wystąpienia" } };

  return (
    <ChartContainer config={effectiveConfig} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={chartData}
          dataKey="visitors"
          nameKey="browser"
          innerRadius={60}
          strokeWidth={5}
          activeIndex={0}
          activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
            <Sector {...props} outerRadius={outerRadius + 10} />
          )}
        />
      </PieChart>
    </ChartContainer>
  );
}
