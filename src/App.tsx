/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart2, 
  Bell, 
  Sparkles, 
} from 'lucide-react';
import {
  SpendingPattern,
  BudgetConfig,
  GCPBudgetPubSubPayload,
  AICostAnalysisResponse,
  ChatMessage,
  CostAnomaly,
} from './types/billing';
import { generateGCPBillingRows, GCP_PROJECTS } from './data/mockBillingData';
import {
  aggregateDailySpend,
  calculateServiceBreakdowns,
  calculateForecast,
  detectCostAnomalies,
  evaluateAlertRules,
} from './engine/alertEngine';

// Components
import { Header } from './components/Header';
import { NotificationBanner } from './components/NotificationBanner';
import { BudgetOverviewCard } from './components/BudgetOverviewCard';
import { DailySpendChart } from './components/DailySpendChart';
import { ServiceBreakdown } from './components/ServiceBreakdown';
import { BudgetAlertsPanel } from './components/BudgetAlertsPanel';
import { AICostInsightsPanel } from './components/AICostInsightsPanel';
import { ArchitectureDiagramModal } from './components/ArchitectureDiagramModal';
import { RawDataViewerModal } from './components/RawDataViewerModal';
import { PubSubPayloadModal } from './components/PubSubPayloadModal';

export default function App() {
  // Scenario & Simulation State
  const [currentPattern, setCurrentPattern] = useState<SpendingPattern>('normal');
  const [seed, setSeed] = useState<number>(42);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'ai_insights'>('overview');

  // Budget Configuration State
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({
    amount: 5000,
    currency: 'USD',
    period: 'MONTHLY',
    thresholds: [0.5, 0.8, 0.9, 1.0, 1.2],
    notificationChannels: {
      email: true,
      slackWebhook: true,
      pubsubTopic: true,
    },
    emailRecipient: 'pandi0701venkateswarlu@gmail.com',
    slackChannel: '#cloud-ops-alerts',
    pubsubTopicName: 'projects/prod-analytics-lake-01/topics/billing-budget-alerts',
  });

  // Modal states
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isRawDataModalOpen, setIsRawDataModalOpen] = useState(false);
  const [pubSubModal, setPubSubModal] = useState<{
    isOpen: boolean;
    payload: GCPBudgetPubSubPayload | null;
    title: string;
  }>({
    isOpen: false,
    payload: null,
    title: '',
  });

  // Banner state
  const [dismissedBannerId, setDismissedBannerId] = useState<string | null>(null);

  // AI Insights State
  const [insights, setInsights] = useState<AICostAnalysisResponse | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [anomalyExplanation, setAnomalyExplanation] = useState<{ id: string; text: string } | null>(null);

  // 1. Generate Raw Billing Rows
  const allBillingRows = useMemo(() => {
    return generateGCPBillingRows(currentPattern, seed);
  }, [currentPattern, seed]);

  // Filter by project if specified
  const filteredBillingRows = useMemo(() => {
    if (selectedProject === 'all') return allBillingRows;
    return allBillingRows.filter((r) => r.project.id === selectedProject);
  }, [allBillingRows, selectedProject]);

  // 2. Alert Engine Computations
  const dailySpend = useMemo(() => {
    return aggregateDailySpend(filteredBillingRows, budgetConfig.amount);
  }, [filteredBillingRows, budgetConfig.amount]);

  const { totalSpend, services, topService } = useMemo(() => {
    return calculateServiceBreakdowns(filteredBillingRows);
  }, [filteredBillingRows]);

  const forecast = useMemo(() => {
    return calculateForecast(totalSpend, dailySpend, budgetConfig.amount);
  }, [totalSpend, dailySpend, budgetConfig.amount]);

  const anomalies = useMemo(() => {
    return detectCostAnomalies(filteredBillingRows);
  }, [filteredBillingRows]);

  const alerts = useMemo(() => {
    return evaluateAlertRules(totalSpend, budgetConfig, topService);
  }, [totalSpend, budgetConfig, topService]);

  // Latest Alert for Banner
  const latestAlert = alerts.length > 0 ? alerts[0] : null;
  const showBanner = latestAlert && latestAlert.id !== dismissedBannerId;

  // 3. Fetch Gemini AI Insights when dataset or pattern changes
  const fetchAiInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthToDateSpend: totalSpend,
          budgetAmount: budgetConfig.amount,
          burnRate: forecast.dailyBurnRate,
          forecastedSpend: forecast.forecastedSpend,
          serviceBreakdown: services.map((s) => ({
            service: s.service,
            cost: s.currentCost,
            shareOfTotal: s.shareOfTotal,
            change: s.percentageChange,
          })),
          anomalies,
          spendingPattern: currentPattern,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [totalSpend, budgetConfig.amount, forecast, services, anomalies, currentPattern]);

  // Initial and reactive AI insights fetch
  useEffect(() => {
    fetchAiInsights();
  }, [currentPattern, seed, budgetConfig.amount]);

  // Handle AI Chat Message
  const handleSendMessage = async (userMessage: string) => {
    const userMsgObj: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      text: userMessage,
    };

    setChatMessages((prev) => [...prev, userMsgObj]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          billingContext: {
            monthToDateSpend: totalSpend,
            budgetAmount: budgetConfig.amount,
            burnRate: forecast.dailyBurnRate,
            forecastedSpend: forecast.forecastedSpend,
            serviceBreakdown: services.map((s) => ({
              service: s.service,
              currentCost: s.currentCost,
              share: s.shareOfTotal,
              trend: s.percentageChange,
            })),
            anomalies,
          },
        }),
      });

      const data = await response.json();
      const assistantMsgObj: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        text: data.reply || 'No answer received.',
        suggestedFollowUps: data.suggestedFollowUps,
      };

      setChatMessages((prev) => [...prev, assistantMsgObj]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString(),
          text: 'Unable to communicate with Gemini API. Please check your network or try again.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Anomaly Root Cause Explanation
  const handleExplainAnomaly = async (anomaly: CostAnomaly) => {
    setAnomalyExplanation({ id: anomaly.id, text: 'Querying Gemini 3.8 Flash for root-cause diagnosis...' });
    try {
      const response = await fetch('/api/ai/anomaly-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomaly }),
      });
      const data = await response.json();
      setAnomalyExplanation({ id: anomaly.id, text: data.explanation || 'No explanation generated.' });
    } catch (err) {
      setAnomalyExplanation({
        id: anomaly.id,
        text: 'Failed to generate explanation. Check server logs.',
      });
    }
  };

  // Immediate Alert Test Trigger
  const handleTriggerSimulatedAlert = () => {
    const testPayload: GCPBudgetPubSubPayload = {
      budgetDisplayName: 'Production-Workloads-Monthly-Budget',
      costAmount: totalSpend,
      costIntervalStart: new Date().toISOString().slice(0, 7) + '-01T00:00:00Z',
      budgetAmount: budgetConfig.amount,
      budgetAmountType: 'SPECIFIED_AMOUNT',
      alertThresholdExceeded: 1.0,
      currencyCode: budgetConfig.currency,
    };

    setPubSubModal({
      isOpen: true,
      payload: testPayload,
      title: 'Manual Test Event: GCP Billing Budget 100% Threshold Dispatched',
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans selection:bg-[#58A6FF]/30 selection:text-white">
      
      {/* App Header (Geometric Balance) */}
      <Header
        currentPattern={currentPattern}
        onPatternChange={(pattern) => {
          setCurrentPattern(pattern);
          setDismissedBannerId(null);
        }}
        onRegenerateData={() => {
          setSeed((prev) => prev + 1);
          setDismissedBannerId(null);
        }}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        unreadAlertsCount={alerts.length}
        onOpenAlerts={() => setActiveTab('alerts')}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
        onOpenRawData={() => setIsRawDataModalOpen(true)}
        isAiLoading={isLoadingInsights}
      />

      {/* Simulated Notification Banner (In-app Stand-in for Slack/Email) */}
      {showBanner && (
        <NotificationBanner
          latestAlert={latestAlert}
          onDismiss={() => setDismissedBannerId(latestAlert.id)}
          onViewDetails={(alert) => {
            setPubSubModal({
              isOpen: true,
              payload: alert.pubsubMessagePayload,
              title: `GCP Budget Alert Payload (${alert.percentage}%)`,
            });
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262D] pb-3">
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#1C2331] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <button
              id="tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-[#1C2331] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Budget & Alerts</span>
              {alerts.length > 0 && (
                <span className="rounded-full bg-rose-500/20 text-rose-400 px-1.5 py-0.2 text-[10px] font-mono">
                  {alerts.length}
                </span>
              )}
            </button>

            <button
              id="tab-ai-insights"
              onClick={() => setActiveTab('ai_insights')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'ai_insights'
                  ? 'bg-[#1C2331] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#60A5FA]" />
              <span>AI Insights</span>
              {anomalies.length > 0 && (
                <span className="rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.2 text-[10px] font-mono">
                  {anomalies.length}
                </span>
              )}
            </button>
          </nav>

          {/* Project Filter Pill */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono self-end sm:self-auto">
            <span>Project:</span>
            <select
              aria-label="Filter by Google Cloud project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="rounded-md border border-[#262C36] bg-[#11161F] px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="all">All Workloads (3 Projects)</option>
              {GCP_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top KPI: Budget Overview & Forecast */}
            <BudgetOverviewCard
              forecast={forecast}
              budgetConfig={budgetConfig}
              onUpdateBudgetAmount={(newAmt) =>
                setBudgetConfig((prev) => ({ ...prev, amount: newAmt }))
              }
              topService={topService}
            />

            {/* 30-Day Daily Spend Trend Chart */}
            <DailySpendChart
              data={dailySpend}
              anomalies={anomalies}
              budgetLimit={budgetConfig.amount}
            />

            {/* Service-by-Service Breakdown */}
            <ServiceBreakdown
              services={services}
              totalSpend={totalSpend}
              anomalies={anomalies}
            />

          </div>
        )}

        {/* Tab 2: Budget & Alerts */}
        {activeTab === 'alerts' && (
          <BudgetAlertsPanel
            config={budgetConfig}
            alerts={alerts}
            onUpdateConfig={setBudgetConfig}
            onInspectPayload={(payload, title) => {
              setPubSubModal({
                isOpen: true,
                payload,
                title,
              });
            }}
            onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
          />
        )}

        {/* Tab 3: AI Cost Insights (Gemini) */}
        {activeTab === 'ai_insights' && (
          <AICostInsightsPanel
            insights={insights}
            anomalies={anomalies}
            isLoadingInsights={isLoadingInsights}
            onRefreshInsights={fetchAiInsights}
            chatMessages={chatMessages}
            isChatLoading={isChatLoading}
            onSendMessage={handleSendMessage}
            onExplainAnomaly={handleExplainAnomaly}
            anomalyExplanation={anomalyExplanation}
            forecast={forecast}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#21262D] bg-[#0A0D13] py-4 text-center text-xs text-slate-500 font-mono">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CloudGuard • Automated Cloud Budget & Cost Alert System
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="hover:text-[#60A5FA] transition-colors"
            >
              GCP Pipeline Architecture
            </button>
            <span>•</span>
            <button
              onClick={() => setIsRawDataModalOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              BigQuery Billing Export
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ArchitectureDiagramModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      <RawDataViewerModal
        isOpen={isRawDataModalOpen}
        onClose={() => setIsRawDataModalOpen(false)}
        rows={filteredBillingRows}
      />

      <PubSubPayloadModal
        isOpen={pubSubModal.isOpen}
        onClose={() => setPubSubModal({ isOpen: false, payload: null, title: '' })}
        payload={pubSubModal.payload}
        title={pubSubModal.title}
      />

    </div>
  );
}
