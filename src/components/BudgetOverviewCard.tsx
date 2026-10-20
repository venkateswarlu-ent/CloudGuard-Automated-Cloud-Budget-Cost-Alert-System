/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Check, 
  AlertTriangle, 
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { ForecastMetrics, BudgetConfig } from '../types/billing';

interface BudgetOverviewCardProps {
  forecast: ForecastMetrics;
  budgetConfig: BudgetConfig;
  onUpdateBudgetAmount: (amount: number) => void;
  topService: string;
}

export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({
  forecast,
  budgetConfig,
  onUpdateBudgetAmount,
  topService,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAmount, setTempAmount] = useState(budgetConfig.amount.toString());

  const handleSave = () => {
    const val = parseFloat(tempAmount);
    if (!isNaN(val) && val > 0) {
      onUpdateBudgetAmount(val);
      setIsEditing(false);
    }
  };

  const percentUsed = forecast.percentUsed;
  const isOverBudget = percentUsed >= 100;
  const remainingBudget = Math.max(0, forecast.budgetLimit - forecast.monthToDateSpend);

  const getProgressColor = () => {
    if (percentUsed >= 100) return 'bg-rose-500';
    if (percentUsed >= 85) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div id="card-budget-overview" className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all">
      {/* Top Header: Title & Budget Quick Edit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262D] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Budget & Run-Rate Summary
            </h2>
            {isOverBudget ? (
              <span className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-rose-950/40 text-rose-400 border border-rose-900/40">
                <AlertTriangle className="h-3 w-3" />
                Exceeded ({percentUsed}%)
              </span>
            ) : percentUsed >= 85 ? (
              <span className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-amber-950/40 text-amber-400 border border-amber-900/40">
                <AlertTriangle className="h-3 w-3" />
                Approaching Cap ({percentUsed}%)
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                <CheckCircle2 className="h-3 w-3" />
                On Track ({percentUsed}%)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Billing Account: <span className="font-mono text-slate-300">0189BF-E4208A</span> • Top Driver: <span className="text-slate-200">{topService}</span>
          </p>
        </div>

        {/* Budget Setting */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute inset-y-0 left-2.5 flex items-center text-xs text-slate-500 font-mono">$</span>
                <input
                  id="input-budget-amount-quick"
                  type="number"
                  value={tempAmount}
                  onChange={(e) => setTempAmount(e.target.value)}
                  className="w-28 rounded-md border border-[#3B82F6] bg-[#171D27] py-1 pl-6 pr-2 text-xs font-mono text-white focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                id="btn-save-budget-quick"
                onClick={handleSave}
                className="flex h-7 items-center gap-1 rounded-md bg-[#2563EB] px-2.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
              >
                <Check className="h-3 w-3" />
                <span>Set</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-edit-budget-amount"
              onClick={() => {
                setTempAmount(budgetConfig.amount.toString());
                setIsEditing(true);
              }}
              className="flex items-center gap-2 rounded-md border border-[#262C36] bg-[#171D27] px-3 py-1 text-xs text-slate-300 hover:border-slate-600 transition-colors"
            >
              <span className="text-slate-400 text-[11px]">Monthly Cap:</span>
              <span className="font-mono font-semibold text-white">
                ${budgetConfig.amount.toLocaleString()}
              </span>
              <Edit2 className="h-2.5 w-2.5 text-slate-500 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Minimal Metric Columns */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1 */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            MTD Spend
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              ${forecast.monthToDateSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400 font-mono">
            Burn: ${forecast.dailyBurnRate.toFixed(2)}/day
          </span>
        </div>

        {/* Metric 2 */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Budget Used
            </span>
            <span className="text-xs font-mono font-medium text-slate-300">
              {percentUsed}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#1F2633] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
          <span className="mt-2 block text-[11px] text-slate-400 font-mono">
            ${forecast.monthToDateSpend.toFixed(0)} of ${forecast.budgetLimit.toLocaleString()}
          </span>
        </div>

        {/* Metric 3 */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Projected Total
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              ${forecast.forecastedSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className={`text-[11px] font-medium ${isOverBudget ? 'text-rose-400' : 'text-slate-400'}`}>
              {isOverBudget ? 'Over Budget' : 'Within Cap'}
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400 font-mono">
            Day {forecast.daysElapsed} of {forecast.daysInMonth}
          </span>
        </div>

        {/* Metric 4 */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Available Buffer
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight font-mono ${remainingBudget === 0 ? 'text-rose-400' : 'text-white'}`}>
              ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400 font-mono">
            {forecast.daysInMonth - forecast.daysElapsed} days remaining
          </span>
        </div>

      </div>

      {/* Minimal Threshold Bar */}
      <div className="mt-5 border-t border-[#21262D] pt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Threshold Alerts:</span>
          <div className="flex items-center gap-1.5">
            {budgetConfig.thresholds.map((t) => {
              const pct = Math.round(t * 100);
              const reached = percentUsed >= pct;
              return (
                <span
                  key={t}
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    reached 
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-900/50' 
                      : 'bg-[#171D27] text-slate-400 border border-[#262C36]'
                  }`}
                >
                  {pct}%
                </span>
              );
            })}
          </div>
        </div>
        <span className="text-[11px] text-slate-500">
          Target Cap: ${budgetConfig.amount.toLocaleString()} USD
        </span>
      </div>

    </div>
  );
};
