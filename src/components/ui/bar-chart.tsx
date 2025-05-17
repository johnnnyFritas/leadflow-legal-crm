
import * as React from "react";
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip,
  TooltipProps, 
  XAxis, 
  YAxis 
} from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "./chart";

interface BarChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  colors?: string[];
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  tooltipProps?: any;
  className?: string;
}

export const BarChart = ({
  data,
  xAxisKey,
  yAxisKey,
  colors = ["hsl(var(--primary))"],
  height = "100%",
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  tooltipProps,
  className,
}: BarChartProps) => {
  const chartConfig: ChartConfig = {
    [yAxisKey]: {
      color: colors[0],
    },
  };

  return (
    <ChartContainer config={chartConfig} className={className}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
        />
        {showGrid && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
        {showTooltip && (
          <Tooltip
            content={(props: any) => {
              if (!props.active || !props.payload) {
                return null;
              }
              return (
                <ChartTooltipContent
                  active={props.active}
                  payload={props.payload}
                  label={props.label}
                  {...tooltipProps}
                />
              );
            }}
          />
        )}
        {showLegend && <Legend />}
        <Bar
          dataKey={yAxisKey}
          fill={`var(--color-${yAxisKey}, ${colors[0]})`}
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </RechartsBarChart>
    </ChartContainer>
  );
};

interface BarChartHorizontalProps extends BarChartProps {}

export const BarChartHorizontal = ({
  data,
  xAxisKey,
  yAxisKey,
  colors = ["hsl(var(--primary))"],
  height = "100%",
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  tooltipProps,
  className,
}: BarChartHorizontalProps) => {
  const chartConfig: ChartConfig = {
    [xAxisKey]: {
      color: colors[0],
    },
  };

  return (
    <ChartContainer config={chartConfig} className={className}>
      <RechartsBarChart 
        data={data} 
        layout="vertical"
        margin={{ top: 10, right: 10, left: 80, bottom: 20 }}
      >
        <XAxis 
          type="number" 
          tickLine={false} 
          axisLine={false} 
          tick={{ fontSize: 12 }} 
          tickMargin={8}
        />
        <YAxis
          type="category"
          dataKey={yAxisKey}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          width={70}
        />
        {showGrid && <CartesianGrid horizontal={false} strokeDasharray="3 3" />}
        {showTooltip && (
          <Tooltip
            content={(props: any) => {
              if (!props.active || !props.payload) {
                return null;
              }
              return (
                <ChartTooltipContent
                  active={props.active}
                  payload={props.payload}
                  label={props.label}
                  {...tooltipProps}
                />
              );
            }}
          />
        )}
        {showLegend && <Legend />}
        <Bar
          dataKey={xAxisKey}
          fill={`var(--color-${xAxisKey}, ${colors[0]})`}
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </RechartsBarChart>
    </ChartContainer>
  );
};
