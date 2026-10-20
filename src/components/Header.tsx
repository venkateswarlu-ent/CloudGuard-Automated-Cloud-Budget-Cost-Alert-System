/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  RotateCw, 
  Bell, 
  Layers, 
  Database,
  ChevronDown
} from 'lucide-react';
import { SpendingPattern } from '../types/billing';

interface HeaderProps {
  currentPattern: SpendingPattern;
  onPatternChange: (pattern: SpendingPattern) => void;
  onRegenerateData: () => void;
  selectedProject: string;
  onSelectProject: (projId: string) => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenArchitecture: () => void;
  onOpenRawData: () => void;
  isAiLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPattern,
  onPatternChange,
  onRegenerateData,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenArchitecture,
  onOpenRawData,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#21262D] bg-[#0E131B]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          
          {/* Left: Minimal Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563EB] text-white font-bold text-xs shadow-sm">
              <span className="tracking-tighter">CG</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                CloudGuard
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500">
                / FinOps
              </span>
            </div>
          </div>

          {/* Right: Clean, Quiet Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Scenario Selector */}
            <div className="relative">
              <select
                id="spending-pattern-select"
                aria-label="Simulation scenario"
                value={currentPattern}
                onChange={(e) => onPatternChange(e.target.value as SpendingPattern)}
                className="h-8 cursor-pointer appearance-none rounded-md border border-[#262C36] bg-[#141A23] pl-2.5 pr-7 text-xs text-slate-300 transition-colors hover:border-slate-600 focus:border-[#3B82F6] focus:outline-none"
              >
                <option value="normal">Scenario: Normal Baseline</option>
                <option value="compute_spike">Scenario: Compute Spike</option>
                <option value="gradual_growth">Scenario: Storage Growth</option>
                <option value="optimized">Scenario: CUD Optimized</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            </div>

            {/* Refresh */}
            <button
              id="btn-regenerate-data"
              onClick={onRegenerateData}
              title="Refresh simulated billing telemetry"
              className="flex h-8 items-center gap-1.5 rounded-md border border-[#262C36] bg-[#141A23] px-2.5 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
            >
              <RotateCw className="h-3 w-3" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Pipeline info */}
            <button
              id="btn-open-arch-modal"
              onClick={onOpenArchitecture}
              title="GCP Pipeline Architecture"
              className="flex h-8 items-center gap-1.5 rounded-md border border-[#262C36] bg-[#141A23] px-2.5 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
            >
              <Layers className="h-3 w-3" />
              <span className="hidden md:inline">Architecture</span>
            </button>

            {/* BigQuery Raw Data */}
            <button
              id="btn-open-raw-data"
              onClick={onOpenRawData}
              title="Raw BigQuery billing export records"
              className="flex h-8 items-center gap-1.5 rounded-md border border-[#262C36] bg-[#141A23] px-2.5 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
            >
              <Database className="h-3 w-3" />
              <span className="hidden md:inline">Export</span>
            </button>

            <div className="h-4 w-px bg-[#262C36] mx-0.5 hidden sm:block"></div>

            {/* Alert Notifications Button */}
            <button
              id="btn-notifications-bell"
              onClick={onOpenAlerts}
              className="relative flex h-8 w-8 items-center justify-center rounded-md border border-[#262C36] bg-[#141A23] text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
              title="Budget Alert Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white shadow-sm">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* User Pill */}
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#262C36] bg-[#141A23] text-[11px] font-semibold text-slate-300"
              title="pandi0701venkateswarlu@gmail.com"
            >
              PV
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
