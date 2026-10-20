/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Layers,
  Database,
  Radio,
  Cpu,
  Sparkles,
  Send,
  Check,
  Copy,
} from 'lucide-react';

interface ArchitectureDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDiagramModal: React.FC<ArchitectureDiagramModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'flow' | 'terraform' | 'cloudfunction' | 'bigquery'>('flow');

  if (!isOpen) return null;

  const handleCopy = (text: string, tabKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const terraformSnippet = `# Cloud Billing Budget linked to Pub/Sub Topic
resource "google_billing_budget" "production_budget" {
  billing_account = "0189BF-E4208A-98C334"
  display_name    = "Production-Workloads-Monthly-Budget"

  budget_filter {
    projects = ["projects/prod-analytics-lake-01", "projects/web-portal-frontend"]
    credit_types_treatment = "INCLUDE_ALL_CREDITS"
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "5000"
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.8
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }

  all_updates_rule {
    pubsub_topic                     = google_pubsub_topic.billing_alerts.id
    monitoring_notification_channels = [google_monitoring_notification_channel.slack.id]
  }
}

resource "google_pubsub_topic" "billing_alerts" {
  name = "gcp-billing-budget-alerts"
}`;

  const cloudFunctionSnippet = `import { CloudEvent } from '@google-cloud/functions-framework';
import { GoogleGenAI } from '@google/genai';

interface BudgetPubSubEvent {
  budgetDisplayName: string;
  costAmount: number;
  budgetAmount: number;
  alertThresholdExceeded: number;
  currencyCode: string;
}

export async function processBudgetAlert(event: CloudEvent<{ data: string }>) {
  // 1. Decode Pub/Sub message
  const rawJson = Buffer.from(event.data.data, 'base64').toString('utf-8');
  const payload: BudgetPubSubEvent = JSON.parse(rawJson);

  // 2. Initialize Gemini 3.8 Flash for instant root-cause analysis
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: \`Budget Alert: Spend reached \${payload.costAmount} \${payload.currencyCode} (\${payload.alertThresholdExceeded * 100}% of budget). Explain potential driver and remediation for Slack.\`,
  });

  // 3. Post to ChatOps (Slack Webhook)
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: \`🚨 GCP Budget Alert (\${payload.alertThresholdExceeded * 100}%): \${response.text}\`,
    }),
  });
}`;

  const bigquerySnippet = `-- BigQuery Standard SQL Billing Export Analysis Query
SELECT
  invoice.month AS invoice_month,
  service.description AS service_name,
  sku.description AS sku_name,
  location.region AS region,
  ROUND(SUM(cost), 2) AS total_cost_usd,
  ROUND(SUM(usage.amount), 2) AS total_usage_units,
  usage.unit AS usage_unit
FROM
  \`gcp_billing_export_v1_0189BF_E4208A\`
WHERE
  usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY
  invoice_month, service_name, sku_name, region, usage_unit
ORDER BY
  total_cost_usd DESC
LIMIT 50;`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl rounded-xl border border-[#21262D] bg-[#11161F] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#21262D] px-5 py-3.5 bg-[#0E131B]">
          <div className="flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-[#60A5FA]" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Google Cloud Production Architecture Reference
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Pipeline Specification & IaC
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#21262D] bg-[#0E131B] px-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('flow')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'flow'
                ? 'border-[#3B82F6] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Flow
          </button>
          <button
            onClick={() => setActiveTab('terraform')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'terraform'
                ? 'border-[#3B82F6] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Terraform IaC
          </button>
          <button
            onClick={() => setActiveTab('cloudfunction')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'cloudfunction'
                ? 'border-[#3B82F6] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Cloud Function
          </button>
          <button
            onClick={() => setActiveTab('bigquery')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'bigquery'
                ? 'border-[#3B82F6] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            BigQuery SQL
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-300 text-xs">
          
          {activeTab === 'flow' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-center text-xs">
                
                {/* Step 1 */}
                <div className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 flex flex-col items-center">
                  <Database className="h-4 w-4 text-[#60A5FA] mb-1.5" />
                  <span className="font-semibold text-white text-xs">Billing Export</span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Streams billing rows to BigQuery
                  </p>
                  <span className="mt-auto pt-2 text-[10px] text-slate-500 font-mono">
                    BigQuery
                  </span>
                </div>

                {/* Step 2 */}
                <div className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 flex flex-col items-center">
                  <Radio className="h-4 w-4 text-purple-400 mb-1.5" />
                  <span className="font-semibold text-white text-xs">Pub/Sub</span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Threshold notifications
                  </p>
                  <span className="mt-auto pt-2 text-[10px] text-slate-500 font-mono">
                    Budgets API
                  </span>
                </div>

                {/* Step 3 */}
                <div className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 flex flex-col items-center">
                  <Cpu className="h-4 w-4 text-amber-400 mb-1.5" />
                  <span className="font-semibold text-white text-xs">Cloud Function</span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Event handler
                  </p>
                  <span className="mt-auto pt-2 text-[10px] text-slate-500 font-mono">
                    Cloud Run / FaaS
                  </span>
                </div>

                {/* Step 4 */}
                <div className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 flex flex-col items-center">
                  <Sparkles className="h-4 w-4 text-[#60A5FA] mb-1.5" />
                  <span className="font-semibold text-white text-xs">Gemini AI</span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Root-cause analysis
                  </p>
                  <span className="mt-auto pt-2 text-[10px] text-slate-500 font-mono">
                    Vertex AI
                  </span>
                </div>

                {/* Step 5 */}
                <div className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 flex flex-col items-center">
                  <Send className="h-4 w-4 text-emerald-400 mb-1.5" />
                  <span className="font-semibold text-white text-xs">Alert Delivery</span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Slack / Email dispatch
                  </p>
                  <span className="mt-auto pt-2 text-[10px] text-slate-500 font-mono">
                    Webhooks
                  </span>
                </div>

              </div>

              {/* Architecture Details */}
              <div className="rounded-lg border border-[#21262D] bg-[#0E131B] p-4 space-y-2 text-xs">
                <h5 className="font-semibold text-white">
                  CloudGuard Architecture Integration:
                </h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>
                    <strong className="text-slate-300">Data Engine:</strong> BigQuery standard export schema matching Google Cloud Billing export format.
                  </li>
                  <li>
                    <strong className="text-slate-300">Threshold Rules:</strong> Standard GCP Cloud Billing Budgets API threshold evaluation and Pub/Sub payloads.
                  </li>
                  <li>
                    <strong className="text-slate-300">AI Intelligence:</strong> Server-side Gemini 3.8 Flash model with resilient fallback handling.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'terraform' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">
                  Terraform configuration for Cloud Billing Budgets API & Pub/Sub
                </span>
                <button
                  onClick={() => handleCopy(terraformSnippet, 'tf')}
                  className="flex items-center gap-1 text-xs text-[#60A5FA] hover:underline"
                >
                  {copiedTab === 'tf' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedTab === 'tf' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="rounded-lg border border-[#21262D] bg-[#0A0D13] p-4 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {terraformSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'cloudfunction' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">
                  Cloud Function Pub/Sub subscriber with Gemini 3.8 Flash
                </span>
                <button
                  onClick={() => handleCopy(cloudFunctionSnippet, 'cf')}
                  className="flex items-center gap-1 text-xs text-[#60A5FA] hover:underline"
                >
                  {copiedTab === 'cf' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedTab === 'cf' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="rounded-lg border border-[#21262D] bg-[#0A0D13] p-4 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {cloudFunctionSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'bigquery' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">
                  BigQuery Standard SQL query for 30-day continuous billing export
                </span>
                <button
                  onClick={() => handleCopy(bigquerySnippet, 'bq')}
                  className="flex items-center gap-1 text-xs text-[#60A5FA] hover:underline"
                >
                  {copiedTab === 'bq' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedTab === 'bq' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="rounded-lg border border-[#21262D] bg-[#0A0D13] p-4 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {bigquerySnippet}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#21262D] px-5 py-2.5 bg-[#0E131B] text-xs text-slate-500 font-mono">
          <span>Google Cloud Reference Pattern</span>
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
