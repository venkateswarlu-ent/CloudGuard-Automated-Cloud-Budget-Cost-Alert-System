/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle 
} from 'lucide-react';
import { ServiceCostSummary, CostAnomaly } from '../types/billing';

interface ServiceBreakdownProps {
  services: ServiceCostSummary[];
  totalSpend: number;
  anomalies: CostAnomaly[];
}

export const ServiceBreakdown: React.FC<ServiceBreakdownProps> = ({
  services,
  totalSpend,
  anomalies,
}) => {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const toggleExpand = (serviceName: string) => {
    setExpandedService(expandedService === serviceName ? null : serviceName);
  };

  const serviceHasAnomaly = (serviceName: string) => {
    return anomalies.some((a) => a.service === serviceName);
  };

  return (
    <div id="card-service-breakdown" className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21262D] pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">
            Cost by Google Cloud Service
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Resource-level consumption from BigQuery export
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Total: <strong className="text-white">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </span>
      </div>

      {/* Services List */}
      <div className="mt-3 divide-y divide-[#1A2230]">
        {services.map((item) => {
          const isExpanded = expandedService === item.service;
          const hasAnomaly = serviceHasAnomaly(item.service);
          const isIncreasing = item.percentageChange > 0;

          return (
            <div key={item.service} className="py-3 first:pt-2 last:pb-0">
              <div
                onClick={() => toggleExpand(item.service)}
                className="group flex cursor-pointer items-center justify-between gap-4 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[#161D27]"
              >
                {/* Left: Indicator dot & Service Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || '#3B82F6' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                        {item.service}
                      </span>
                      {hasAnomaly && (
                        <span className="flex items-center gap-1 rounded bg-rose-950/40 border border-rose-900/50 px-1.5 py-0.2 text-[10px] text-rose-300">
                          <AlertCircle className="h-2.5 w-2.5" />
                          Spike
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {item.serviceId}
                    </span>
                  </div>
                </div>

                {/* Center: Share bar */}
                <div className="hidden md:flex items-center gap-3 w-44">
                  <div className="h-1.5 w-full rounded-full bg-[#1F2633] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.shareOfTotal}%`,
                        backgroundColor: hasAnomaly ? '#F43F5E' : (item.color || '#3B82F6'),
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400 w-9 text-right shrink-0">
                    {item.shareOfTotal}%
                  </span>
                </div>

                {/* Right: Trend & Cost */}
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-white block">
                      ${item.currentCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`flex items-center justify-end gap-0.5 text-[10px] font-mono ${
                      isIncreasing ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isIncreasing ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      {Math.abs(item.percentageChange)}% (7d)
                    </span>
                  </div>

                  <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible SKU Details */}
              {isExpanded && (
                <div className="mt-2 ml-5 rounded-lg border border-[#21262D] bg-[#0E131B] p-3 text-xs">
                  <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-[#1A2230] pb-1.5 mb-2">
                    <span>SKU Description</span>
                    <span>Cost & Quantity</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {item.topSkus.map((sku, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 text-slate-400">
                        <span className="truncate max-w-md text-slate-300">
                          {sku.sku}
                        </span>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-semibold text-white">${sku.cost.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">
                            ({sku.usage.toLocaleString()} {sku.unit})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
