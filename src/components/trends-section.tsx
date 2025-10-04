"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrendingUp } from "@tabler/icons-react";
import TrendingChart from "./trending-chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { RecentTrendWord } from "@/hooks/use-trends";

interface TrendsSectionProps {
  trends: RecentTrendWord[];
  chartData: Array<{ browser: string; visitors: number; fill: string }> | undefined;
  chartConfig: ChartConfig;
}

function MiniProgress({ value, accent }: { value: number; accent?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-2 w-full rounded-full bg-muted/60 overflow-hidden ${accent ? "ring-1 ring-primary/40" : ""}`}>
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TrendsSection({ trends, chartData, chartConfig }: TrendsSectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">Trendy</CardTitle>
        <CardDescription>Świeże słowa z ostatniego okna czasowego (tylko najnowsze)</CardDescription>
        <CardAction>
          <IconTrendingUp />
        </CardAction>
      </CardHeader>
      <CardContent className="">
        {trends.length ? (
          <div className="space-y-3">
            {trends.map((t, idx) => {
              const accent = idx === 0;
              return (
                <div key={t.word} className="group rounded-md border p-2 hover:bg-muted/40 transition cursor-pointer">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={accent ? "default" : "secondary"} className="text-xs">
                        {t.word}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {t.recentOccurrences} wystąp. • {t.ageMinutes < 1 ? "<1" : Math.round(t.ageMinutes)} min
                      </span>
                    </div>
                    <div className="flex items-end gap-4 text-right">
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Momentum</span>
                        <span className={`font-semibold tabular-nums text-sm ${accent ? "text-primary" : ""}`}>
                          {t.momentum.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <MiniProgress value={t.normalizedMomentum} accent={accent} />
                    <span className="text-[10px] w-11 text-right tabular-nums text-muted-foreground">
                      {Math.round(t.normalizedMomentum)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Brak świeżych słów w ostatnim oknie czasowym.</div>
        )}
      </CardContent>
    </>
  );
}
