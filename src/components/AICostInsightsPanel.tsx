/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  Send,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import {
  AICostAnalysisResponse,
  CostAnomaly,
  ChatMessage,
  ForecastMetrics,
} from '../types/billing';

interface AICostInsightsPanelProps {
  insights: AICostAnalysisResponse | null;
  anomalies: CostAnomaly[];
  isLoadingInsights: boolean;
  onRefreshInsights: () => void;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (msg: string) => void;
  onExplainAnomaly: (anomaly: CostAnomaly) => void;
  anomalyExplanation: { id: string; text: string } | null;
  forecast: ForecastMetrics;
}

export const AICostInsightsPanel: React.FC<AICostInsightsPanelProps> = ({
  insights,
  anomalies,
  isLoadingInsights,
  onRefreshInsights,
  chatMessages,
  isChatLoading,
  onSendMessage,
  onExplainAnomaly,
  anomalyExplanation,
}) => {
  const [chatInput, setChatInput] = useState('');

  const quickQuestions = [
    'Why did compute spend increase?',
    'Top 3 ways to reduce GCP costs',
    'How can Committed Use Discounts help?',
    'BigQuery slot pricing vs on-demand',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Gemini Analysis Card */}
      <div className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262D] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#60A5FA]" />
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Executive FinOps Assessment
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Evaluated using Gemini 3.8 Flash grounded in live BigQuery billing export
            </p>
          </div>

          <button
            id="btn-refresh-ai-insights"
            onClick={onRefreshInsights}
            disabled={isLoadingInsights}
            className="flex items-center gap-1.5 rounded-md border border-[#262C36] bg-[#0E131B] px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingInsights ? 'animate-spin text-[#60A5FA]' : ''}`} />
            <span>{isLoadingInsights ? 'Analyzing...' : 'Re-analyze'}</span>
          </button>
        </div>

        {/* Executive Summary Body */}
        <div className="mt-4">
          {isLoadingInsights ? (
            <div className="flex items-center gap-2.5 py-6 text-xs text-slate-400 font-mono">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#60A5FA]" />
              <span>Synthesizing 30-day GCP consumption telemetry and computing cost variance...</span>
            </div>
          ) : insights ? (
            <div className="space-y-3.5">
              <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                {insights.executiveSummary}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
                {insights.topCostDriver && (
                  <span className="rounded-md border border-[#262C36] bg-[#0E131B] px-2.5 py-1 text-slate-300">
                    Primary Driver: <strong className="text-white">{insights.topCostDriver}</strong>
                  </span>
                )}
                {insights.forecastAssessment && (
                  <span className="rounded-md border border-[#262C36] bg-[#0E131B] px-2.5 py-1 text-slate-400">
                    Forecast: <span className="text-slate-200">{insights.forecastAssessment}</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-2">Click 'Re-analyze' to generate fresh FinOps recommendations.</p>
          )}
        </div>
      </div>

      {/* 2-Column: Anomalies & Actionable Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Workload Anomalies */}
        <div className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#21262D] pb-3.5">
              <h4 className="text-sm font-semibold tracking-tight text-white">
                Detected Variance & Anomalies
              </h4>
              <span className="text-xs font-mono text-slate-400">
                {anomalies.length} Flagged
              </span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {anomalies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500/50 mb-2" />
                  <p className="text-xs font-medium text-slate-300">No Cost Anomalies Detected</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                    Workload consumption is within the 2.0 std-dev baseline.
                  </p>
                </div>
              ) : (
                anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {anom.service}
                        </span>
                        <span className="rounded bg-rose-950/40 border border-rose-900/50 px-1.5 py-0.2 text-[10px] font-mono text-rose-300">
                          +{anom.deviationPercent}%
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {anom.date}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span>Actual: <strong className="text-rose-300">${anom.actualCost.toFixed(2)}</strong></span>
                      <span className="text-slate-500">Expected: ${anom.expectedCost.toFixed(2)}</span>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                      {anom.suspectedCause}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[#1A2230] pt-1.5 text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px] truncate max-w-[200px]">
                        {anom.skuAffected}
                      </span>
                      <button
                        onClick={() => onExplainAnomaly(anom)}
                        className="flex items-center gap-1 font-medium text-[#60A5FA] hover:underline"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Diagnose</span>
                      </button>
                    </div>

                    {anomalyExplanation?.id === anom.id && (
                      <div className="mt-2.5 rounded-md border border-[#26354A] bg-[#141B26] p-3 text-xs text-slate-200 font-sans leading-relaxed">
                        <div className="flex items-center gap-1 font-semibold text-[#60A5FA] mb-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Gemini Diagnosis:</span>
                        </div>
                        <p className="whitespace-pre-wrap">{anomalyExplanation.text}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#21262D] pb-3.5">
              <h4 className="text-sm font-semibold tracking-tight text-white">
                FinOps Optimization Opportunities
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Actionable
              </span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {insights?.recommendations && insights.recommendations.length > 0 ? (
                insights.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#21262D] bg-[#0E131B] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">
                        {rec.title}
                      </span>
                      <span className="rounded bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300">
                        {rec.estimatedSavings}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                      {rec.action}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-[#1A2230] pt-1.5">
                      <span>Service: <strong className="text-slate-300">{rec.service}</strong></span>
                      <span className="text-slate-400 flex items-center gap-0.5">
                        <span>GCP Practice</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 font-mono">
                  No pending recommendations.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Interactive FinOps Assistant */}
      <div className="rounded-xl border border-[#21262D] bg-[#11161F] p-5 sm:p-6 transition-all">
        <div className="flex items-center justify-between border-b border-[#21262D] pb-3.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold tracking-tight text-white">
              FinOps Assistant
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-mono text-[11px]">
            Grounded in active telemetry
          </span>
        </div>

        {/* Suggestion Chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(q)}
              className="rounded-md border border-[#262C36] bg-[#0E131B] px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="mt-3.5 max-h-[300px] min-h-[140px] overflow-y-auto space-y-2.5 rounded-lg border border-[#21262D] bg-[#0E131B] p-4 text-xs">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 text-xs">
              <Sparkles className="h-5 w-5 text-slate-500 mb-1.5" />
              <span>Ask any question about your GCP expenditure, quotas, or CUD strategies.</span>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2 leading-relaxed text-xs sm:text-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#151C26] text-slate-200 border border-[#21262D] whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}

          {isChatLoading && (
            <div className="flex items-center gap-2 text-xs text-[#60A5FA] py-1 font-mono">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>CloudGuard AI is formulating response...</span>
            </div>
          )}
        </div>

        {/* Query Input */}
        <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
          <input
            id="input-ai-chat"
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question about your Google Cloud costs..."
            disabled={isChatLoading}
            className="flex-1 rounded-md border border-[#262C36] bg-[#0E131B] px-3.5 py-2 text-xs sm:text-sm text-white focus:border-[#3B82F6] focus:outline-none disabled:opacity-50"
          />
          <button
            id="btn-send-ai-chat"
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="rounded-md bg-[#2563EB] hover:bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>

    </div>
  );
};
