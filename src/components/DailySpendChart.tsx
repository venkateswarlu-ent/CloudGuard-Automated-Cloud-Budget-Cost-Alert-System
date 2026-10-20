/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { DailySpendRecord, CostAnomaly } from '../types/billing';
import { GCP_SERVICES } from '../data/mockBillingData';

interface DailySpendChartProps {
  data: DailySpendRecord[];
  anomalies: CostAnomaly[];
  budgetLimit: number;
}

export const DailySpendChart: React.FC<DailySpendChartProps> = ({
  data,
  anomalies,
  budgetLimit,
}) => {
  const [chartMode, setChartMode] = useState<'stacked' | 'line'>('stacked');

  const anomalyDates = new Set(anomalies.map((a) => a.date));
  const dailyBudgetGuideline = Number((budgetLimit / 30).toFixed(2));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const rowData: DailySpendRecord = payload[0].payload;
    const hasAnomaly = anomalyDates.has(rowData.date);
    const dayAnomaly = anomalies.find((a) => a.date === rowData.date);

    return (
      <div className="rounded-lg border border-[#2B3545] bg-[#0E131B] p-3 text-xs shadow-xl min-w-[200px]">
        <div className="flex items-center justify-between border-b border-[#21262D] pb-1.5 font-mono">
          <span className="text-slate-300">{rowData.dayLabel}</span>
          <span className="font-bold text-white">${rowData.total.toFixed(2)}</span>
        </div>

        {hasAnomaly && dayAnomaly && (
          <div className="my-1.5 rounded bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 text-[10px] text-rose-300">
            {dayAnomaly.service}: +{dayAnomaly.deviationPercent}% Surge
          </div>
        )}

        <div className="mt-2 space-y-1 font-mono text-[11px]">
          {GCP_SERVICES.map((s) => {
            const val = (rowData as any)[s.description.replace(/\s+/g, '')] || 0;
            if (val <= 0) return null;
            return (
              <div key={s.id} className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.description}</span>
                </div>
                <span className="text-slate-200">${val.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="card-daily-spend-chart" className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">
            Daily Cost Velocity
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            30-day BigQuery export telemetry • Target: ~${dailyBudgetGuideline}/day
          </p>
        </div>

        {/* Minimal segmented toggle */}
        <div className="inline-flex rounded-md border border-[#262C36] bg-[#0E131B] p-0.5 self-start sm:self-auto">
          <button
            id="btn-chart-stacked"
            onClick={() => setChartMode('stacked')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              chartMode === 'stacked'
                ? 'bg-[#1C2331] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stacked Breakdown
          </button>
          <button
            id="btn-chart-line"
            onClick={() => setChartMode('line')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              chartMode === 'line'
                ? 'bg-[#1C2331] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Total Trend
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'stacked' ? (
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2230" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                fontFamily="JetBrains Mono, monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={dailyBudgetGuideline}
                stroke="#3B82F6"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
              {GCP_SERVICES.map((service) => (
                <Bar
                  key={service.id}
                  dataKey={service.description.replace(/\s+/g, '')}
                  name={service.description}
                  stackId="gcp"
                  fill={service.color}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2230" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                fontFamily="JetBrains Mono, monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={dailyBudgetGuideline}
                stroke="#3B82F6"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#60A5FA', stroke: '#0E131B', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Minimal Legend Strip */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400 font-mono">
        {GCP_SERVICES.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.description}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-blue-400 ml-2">
          <span className="h-0.5 w-3 border-t border-dashed border-blue-400" />
          <span>Guideline (${dailyBudgetGuideline}/d)</span>
        </div>
      </div>

    </div>
  );
};
