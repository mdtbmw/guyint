
'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const data = [
  { name: 'Jan', pnl: 4000, staked: 2400 },
  { name: 'Feb', pnl: 3000, staked: 1398 },
  { name: 'Mar', pnl: 2000, staked: 9800 },
  { name: 'Apr', pnl: 2780, staked: 3908 },
  { name: 'May', pnl: 1890, staked: 4800 },
  { name: 'Jun', pnl: 2390, staked: 3800 },
  { name: 'Jul', pnl: 3490, staked: 4300 },
];

export function PnlChart() {
  return (
    <Card className="glass-panel rounded-[2.5rem] w-full h-full">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Your profit and loss over the last 7 months.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10, right: 30, left: 0, bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{
                  color: 'hsl(var(--foreground))'
              }}
            />
            <Area type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" fill="url(#colorPnl)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
