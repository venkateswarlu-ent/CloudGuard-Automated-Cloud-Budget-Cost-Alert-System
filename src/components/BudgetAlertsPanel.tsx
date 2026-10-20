/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Radio,
  Mail,
  MessageSquare,
  FileCode,
  Check,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { BudgetConfig, AlertEvent, GCPBudgetPubSubPayload } from '../types/billing';

interface BudgetAlertsPanelProps {
  config: BudgetConfig;
  alerts: AlertEvent[];
  onUpdateConfig: (newConfig: BudgetConfig) => void;
  onInspectPayload: (payload: GCPBudgetPubSubPayload, title: string) => void;
  onTriggerSimulatedAlert: () => void;
}

export const BudgetAlertsPanel: React.FC<BudgetAlertsPanelProps> = ({
  config,
  alerts,
  onUpdateConfig,
  onInspectPayload,
  onTriggerSimulatedAlert,
}) => {
  const [budgetInput, setBudgetInput] = useState(config.amount.toString());
  const [newThresholdPercent, setNewThresholdPercent] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  const budgetPresets = [2500, 5000, 7500, 10000];

  const handleApplyBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      onUpdateConfig({
        ...config,
        amount: val,
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 1500);
    }
  };

  const handleAddThreshold = () => {
    const val = parseFloat(newThresholdPercent);
    if (!isNaN(val) && val > 0 && val <= 300) {
      const decimalVal = val / 100;
      if (!config.thresholds.includes(decimalVal)) {
        const updated = [...config.thresholds, decimalVal].sort((a, b) => a - b);
        onUpdateConfig({
          ...config,
          thresholds: updated,
        });
        setNewThresholdPercent('');
      }
    }
  };

  const handleRemoveThreshold = (t: number) => {
    onUpdateConfig({
      ...config,
      thresholds: config.thresholds.filter((item) => item !== t),
    });
  };

  const handleToggleChannel = (channel: keyof BudgetConfig['notificationChannels']) => {
    onUpdateConfig({
      ...config,
      notificationChannels: {
        ...config.notificationChannels,
        [channel]: !config.notificationChannels[channel],
      },
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 2-Column Minimal Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Left Column: Budget & Alert Threshold Config */}
        <div className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-[#21262D] pb-3.5">
              <Sliders className="h-4 w-4 text-[#3B82F6]" />
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Threshold & Budget Rules
              </h3>
            </div>

            {/* Monthly Budget Input */}
            <div>
              <label htmlFor="input-monthly-budget" className="block text-xs font-medium text-slate-400 mb-1.5">
                Monthly Target ($ USD)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-500 font-mono">
                    $
                  </span>
                  <input
                    id="input-monthly-budget"
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-full rounded-md border border-[#262C36] bg-[#0E131B] py-1.5 pl-7 pr-3 text-xs font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                    placeholder="5000"
                  />
                </div>
                <button
                  id="btn-apply-budget"
                  onClick={handleApplyBudget}
                  className="rounded-md bg-[#2563EB] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors"
                >
                  {saveFeedback ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      <span>Saved</span>
                    </span>
                  ) : (
                    <span>Update</span>
                  )}
                </button>
              </div>

              {/* Presets */}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono">
                <span className="text-slate-500">Presets:</span>
                {budgetPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setBudgetInput(preset.toString());
                      onUpdateConfig({ ...config, amount: preset });
                    }}
                    className={`rounded px-2 py-0.5 transition-colors ${
                      config.amount === preset
                        ? 'bg-[#1E293B] text-[#60A5FA] border border-[#3B82F6]/40 font-semibold'
                        : 'bg-[#0E131B] text-slate-400 border border-[#262C36] hover:text-white'
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Configured Thresholds */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Alert Trigger Thresholds (% of Budget)
              </label>
              
              <div className="flex flex-wrap gap-1.5">
                {config.thresholds.map((thresh) => {
                  const percent = Math.round(thresh * 100);
                  const dollarVal = Math.round(config.amount * thresh);
                  const isBreached = alerts.some((a) => a.threshold === thresh);

                  return (
                    <div
                      key={thresh}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-mono ${
                        isBreached
                          ? 'border-rose-900/50 bg-rose-950/20 text-rose-300'
                          : 'border-[#262C36] bg-[#0E131B] text-slate-300'
                      }`}
                    >
                      <span>{percent}%</span>
                      <span className="text-[10px] text-slate-500">(${dollarVal.toLocaleString()})</span>
                      <button
                        onClick={() => handleRemoveThreshold(thresh)}
                        className="text-slate-500 hover:text-rose-400 transition-colors ml-0.5"
                        title="Remove threshold"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add rule */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  id="input-custom-threshold"
                  type="number"
                  value={newThresholdPercent}
                  onChange={(e) => setNewThresholdPercent(e.target.value)}
                  placeholder="e.g. 75"
                  className="w-20 rounded-md border border-[#262C36] bg-[#0E131B] px-2 py-1 text-xs font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-mono">%</span>
                <button
                  id="btn-add-threshold"
                  onClick={handleAddThreshold}
                  className="flex items-center gap-1 rounded-md border border-[#262C36] bg-[#0E131B] px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Delivery Channels */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Notification Delivery Channels
              </label>
              
              <div className="space-y-2 text-xs">
                {/* Slack */}
                <label className="flex items-center justify-between rounded-lg border border-[#21262D] bg-[#0E131B] px-3 py-2 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-200">Slack Webhook (#cloud-ops-alerts)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.notificationChannels.slackWebhook}
                    onChange={() => handleToggleChannel('slackWebhook')}
                    className="h-3.5 w-3.5 rounded border-[#262C36] text-[#3B82F6] focus:ring-0"
                  />
                </label>

                {/* Email */}
                <label className="flex items-center justify-between rounded-lg border border-[#21262D] bg-[#0E131B] px-3 py-2 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-200">Email (pandi0701venkateswarlu@gmail.com)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.notificationChannels.email}
                    onChange={() => handleToggleChannel('email')}
                    className="h-3.5 w-3.5 rounded border-[#262C36] text-[#3B82F6] focus:ring-0"
                  />
                </label>

                {/* Pub/Sub */}
                <label className="flex items-center justify-between rounded-lg border border-[#21262D] bg-[#0E131B] px-3 py-2 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Radio className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-200">Cloud Pub/Sub ({config.pubsubTopicName})</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.notificationChannels.pubsubTopic}
                    onChange={() => handleToggleChannel('pubsubTopic')}
                    className="h-3.5 w-3.5 rounded border-[#262C36] text-[#3B82F6] focus:ring-0"
                  />
                </label>
              </div>
            </div>

          </div>

          {/* Test Trigger */}
          <div className="mt-6 pt-4 border-t border-[#21262D]">
            <button
              id="btn-simulate-test-alert"
              onClick={onTriggerSimulatedAlert}
              className="w-full flex items-center justify-center gap-1.5 rounded-md border border-[#262C36] bg-[#0E131B] py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Simulate Test Threshold Alert</span>
            </button>
          </div>

        </div>

        {/* Right Column: Alert History Log */}
        <div className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#21262D] pb-3.5">
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Alert Event Audit Log
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {alerts.length} Events
              </span>
            </div>

            {/* List */}
            <div className="mt-4 space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShieldCheck className="h-8 w-8 text-emerald-500/40 mb-2" />
                  <p className="text-xs font-medium text-slate-300">No Alert Events Triggered</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                    Expenditure is tracking within baseline thresholds.
                  </p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const isSevere = alert.threshold >= 1.0;
                  return (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-medium ${
                              isSevere
                                ? 'bg-rose-950/50 text-rose-300 border border-rose-900/50'
                                : 'bg-blue-950/50 text-blue-300 border border-blue-900/50'
                            }`}
                          >
                            {alert.percentage}% Threshold
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            ${alert.currentSpend.toLocaleString()} Spend
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {alert.timestamp}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                        {alert.message}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between border-t border-[#1A2230] pt-1.5 text-[11px] font-mono">
                        <span className="text-slate-500">
                          Channel: <span className="text-slate-300">{alert.channel}</span>
                        </span>
                        <button
                          onClick={() =>
                            onInspectPayload(
                              alert.pubsubMessagePayload,
                              `GCP Budget Alert Pub/Sub Payload (${alert.percentage}%)`
                            )
                          }
                          className="flex items-center gap-1 text-[#60A5FA] hover:underline"
                        >
                          <FileCode className="h-3 w-3" />
                          <span>Payload</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#21262D] text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Pub/Sub Topic: {config.pubsubTopicName}</span>
            <span className="text-emerald-400">Connected</span>
          </div>
        </div>

      </div>

    </div>
  );
};
