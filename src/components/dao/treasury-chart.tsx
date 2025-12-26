"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { DaoTreasuryHistoryPoint } from '@/lib/types';
import { useTheme } from '@/components/theme/theme-provider';

interface TreasuryChartProps {
  data: DaoTreasuryHistoryPoint[];
}

function formatNumber(num: number) {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(0) + 'K';
  }
  return num.toString();
}

export default function TreasuryChart({ data }: TreasuryChartProps) {
  const { theme } = useTheme();

  const chartColors = {
    light: {
      text: "hsl(0 0% 5%)",
      grid: "hsl(0 0% 90%)",
      tooltip: "hsl(0 0% 100%)",
      stroke: "hsl(130 90% 45%)",
      fill: "hsl(130 90% 45%)",
    },
    dark: {
      text: "hsl(0 0% 98%)",
      grid: "hsl(0 0% 18%)",
      tooltip: "hsl(0 0% 5%)",
      stroke: "hsl(130 90% 45%)",
      fill: "hsl(130 90% 45%)",
    }
  }

  const colors = theme === 'light' ? chartColors.light : chartColors.dark;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treasury History</CardTitle>
        <CardDescription>6-Month Balance Overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.fill} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors.fill} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke={colors.text}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={colors.text}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${formatNumber(value as number)}`}
              />
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <Tooltip
                contentStyle={{
                    backgroundColor: colors.tooltip,
                    borderColor: colors.grid,
                    borderRadius: '0.5rem',
                    color: colors.text
                }}
                formatter={(value: number) => [new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value), 'STX']}
              />
              <Area type="monotone" dataKey="balance" stroke={colors.stroke} strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
