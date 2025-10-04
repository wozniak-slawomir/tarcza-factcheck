"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "An interactive area chart";

const chartData = [
  { date: "2024-04-01", ocenione: 150 },
  { date: "2024-04-02", ocenione: 180 },
  { date: "2024-04-03", ocenione: 120 },
  { date: "2024-04-04", ocenione: 260 },
  { date: "2024-04-05", ocenione: 290 },
  { date: "2024-04-06", ocenione: 340 },
  { date: "2024-04-07", ocenione: 180 },
  { date: "2024-04-08", ocenione: 320 },
  { date: "2024-04-09", ocenione: 110 },
  { date: "2024-04-10", ocenione: 190 },
  { date: "2024-04-11", ocenione: 350 },
  { date: "2024-04-12", ocenione: 210 },
  { date: "2024-04-13", ocenione: 380 },
  { date: "2024-04-14", ocenione: 220 },
  { date: "2024-04-15", ocenione: 170 },
  { date: "2024-04-16", ocenione: 190 },
  { date: "2024-04-17", ocenione: 360 },
  { date: "2024-04-18", ocenione: 410 },
  { date: "2024-04-19", ocenione: 180 },
  { date: "2024-04-20", ocenione: 150 },
  { date: "2024-04-21", ocenione: 200 },
  { date: "2024-04-22", ocenione: 170 },
  { date: "2024-04-23", ocenione: 230 },
  { date: "2024-04-24", ocenione: 290 },
  { date: "2024-04-25", ocenione: 250 },
  { date: "2024-04-26", ocenione: 130 },
  { date: "2024-04-27", ocenione: 420 },
  { date: "2024-04-28", ocenione: 180 },
  { date: "2024-04-29", ocenione: 240 },
  { date: "2024-04-30", ocenione: 380 },
  { date: "2024-05-01", ocenione: 220 },
  { date: "2024-05-02", ocenione: 310 },
  { date: "2024-05-03", ocenione: 190 },
  { date: "2024-05-04", ocenione: 420 },
  { date: "2024-05-05", ocenione: 390 },
  { date: "2024-05-06", ocenione: 520 },
  { date: "2024-05-07", ocenione: 300 },
  { date: "2024-05-08", ocenione: 210 },
  { date: "2024-05-09", ocenione: 180 },
  { date: "2024-05-10", ocenione: 330 },
  { date: "2024-05-11", ocenione: 270 },
  { date: "2024-05-12", ocenione: 240 },
  { date: "2024-05-13", ocenione: 160 },
  { date: "2024-05-14", ocenione: 490 },
  { date: "2024-05-15", ocenione: 380 },
  { date: "2024-05-16", ocenione: 400 },
  { date: "2024-05-17", ocenione: 420 },
  { date: "2024-05-18", ocenione: 350 },
  { date: "2024-05-19", ocenione: 180 },
  { date: "2024-05-20", ocenione: 230 },
  { date: "2024-05-21", ocenione: 140 },
  { date: "2024-05-22", ocenione: 120 },
  { date: "2024-05-23", ocenione: 290 },
  { date: "2024-05-24", ocenione: 220 },
  { date: "2024-05-25", ocenione: 250 },
  { date: "2024-05-26", ocenione: 170 },
  { date: "2024-05-27", ocenione: 460 },
  { date: "2024-05-28", ocenione: 190 },
  { date: "2024-05-29", ocenione: 130 },
  { date: "2024-05-30", ocenione: 280 },
  { date: "2024-05-31", ocenione: 230 },
  { date: "2024-06-01", ocenione: 200 },
  { date: "2024-06-02", ocenione: 410 },
  { date: "2024-06-03", ocenione: 160 },
  { date: "2024-06-04", ocenione: 380 },
  { date: "2024-06-05", ocenione: 140 },
  { date: "2024-06-06", ocenione: 250 },
  { date: "2024-06-07", ocenione: 370 },
  { date: "2024-06-08", ocenione: 320 },
  { date: "2024-06-09", ocenione: 480 },
  { date: "2024-06-10", ocenione: 200 },
  { date: "2024-06-11", ocenione: 150 },
  { date: "2024-06-12", ocenione: 420 },
  { date: "2024-06-13", ocenione: 130 },
  { date: "2024-06-14", ocenione: 380 },
  { date: "2024-06-15", ocenione: 350 },
  { date: "2024-06-16", ocenione: 310 },
  { date: "2024-06-17", ocenione: 520 },
  { date: "2024-06-18", ocenione: 170 },
  { date: "2024-06-19", ocenione: 290 },
  { date: "2024-06-20", ocenione: 450 },
  { date: "2024-06-21", ocenione: 210 },
  { date: "2024-06-22", ocenione: 270 },
  { date: "2024-06-23", ocenione: 530 },
  { date: "2024-06-24", ocenione: 180 },
  { date: "2024-06-25", ocenione: 190 },
  { date: "2024-06-26", ocenione: 380 },
  { date: "2024-06-27", ocenione: 490 },
  { date: "2024-06-28", ocenione: 200 },
  { date: "2024-06-29", ocenione: 160 },
  { date: "2024-06-30", ocenione: 400 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  ocenione: {
    label: "Ocenione",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Total for the last 3 months</span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="ocenione" type="natural" fill="url(#fillMobile)" stroke="var(--color-mobile)" stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
