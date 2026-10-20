/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, ArrowRight, X } from 'lucide-react';
import { AlertEvent } from '../types/billing';

interface NotificationBannerProps {
  latestAlert: AlertEvent | null;
  onDismiss: () => void;
  onViewDetails: (alert: AlertEvent) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  latestAlert,
  onDismiss,
  onViewDetails,
}) => {
  if (!latestAlert) return null;

  const isCritical = latestAlert.threshold >= 1.0;

  return (
    <div
      id="simulated-alert-banner"
      role="alert"
      className={`border-b px-4 py-2 text-xs transition-colors ${
        isCritical 
          ? 'border-rose-900/40 bg-rose-950/20 text-rose-200' 
          : 'border-amber-900/40 bg-amber-950/20 text-amber-200'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Bell className={`h-3.5 w-3.5 shrink-0 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
          <span className="font-mono text-[11px] opacity-75 shrink-0">
            {latestAlert.percentage}% Threshold:
          </span>
          <p className="truncate text-slate-200">
            {latestAlert.message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-inspect-pubsub-banner"
            onClick={() => onViewDetails(latestAlert)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white underline underline-offset-2 transition-colors"
          >
            <span>Payload</span>
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            id="btn-dismiss-alert-banner"
            onClick={onDismiss}
            aria-label="Dismiss alert banner"
            className="rounded p-0.5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
