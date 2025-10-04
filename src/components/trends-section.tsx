"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrendingUp } from "@tabler/icons-react";
import TrendingChart from "./trending-chart";
import type { ChartConfig } from "@/components/ui/chart";

interface TrendsSectionProps {
  topWords: Array<{ word: string; count: number }>;
  chartData: Array<{ browser: string; visitors: number; fill: string }> | undefined;
  chartConfig: ChartConfig;
}

export function TrendsSection({ topWords, chartData, chartConfig }: TrendsSectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          Trendy
        </CardTitle>
        <CardDescription>Najczęsciej występujące słowa (z oznaczonych postów)</CardDescription>
        <CardAction>
          <IconTrendingUp />
        </CardAction>
      </CardHeader>
      <CardContent className="">
        {topWords.length ? (
          <div className="flex gap-2">
            {topWords.map((t) => (
              <Badge key={t.word}>
                {t.word} ({t.count})
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Brak nieoznaczonych postów lub brak znaczących słów.
          </div>
        )}
        <TrendingChart chartData={chartData} chartConfig={chartConfig} />
      </CardContent>
    </>
  );
}