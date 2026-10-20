/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Radio, Copy, Check } from 'lucide-react';
import { GCPBudgetPubSubPayload } from '../types/billing';

interface PubSubPayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: GCPBudgetPubSubPayload | null;
  title?: string;
}

export const PubSubPayloadModal: React.FC<PubSubPayloadModalProps> = ({
  isOpen,
  onClose,
  payload,
  title = 'GCP Billing Budgets Pub/Sub Message Payload',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !payload) return null;

  const fullPubSubEnvelope = {
    message: {
      data: Buffer.from(JSON.stringify(payload)).toString('base64'),
      messageId: `gcp-msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      publishTime: new Date().toISOString(),
      attributes: {
        billingAccountId: '0189BF-E4208A-98C334',
        budgetId: 'prod-monthly-gcp-budget-01',
        schemaVersion: '1.0',
      },
    },
    subscription: 'projects/prod-analytics-lake-01/subscriptions/budget-alerts-cloudfunction-sub',
    decodedBillingPayload: payload,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fullPubSubEnvelope, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-[#21262D] bg-[#11161F] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#21262D] px-5 py-3.5 bg-[#0E131B]">
          <div className="flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-[#60A5FA]" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Topic: <code className="text-slate-300">gcp-billing-budget-alerts</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Base64 Decoded JSON Representation
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-[#262C36] bg-[#0E131B] px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          <pre className="rounded-lg border border-[#21262D] bg-[#0A0D13] p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
            {JSON.stringify(fullPubSubEnvelope, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="border-t border-[#21262D] bg-[#0E131B] px-5 py-3 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Schema v1.0 • GCP Budgets API format</span>
          <button
            onClick={onClose}
            className="rounded-md border border-[#262C36] bg-[#141A23] px-3 py-1 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
