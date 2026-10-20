/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CloudGuard Type Definitions
 * Modeled after actual Google Cloud BigQuery Billing Export & Cloud Billing Budgets API schema.
 */

export interface GCPBillingRow {
  billing_account_id: string;
  service: {
    id: string;
    description: string;
  };
  sku: {
    id: string;
    description: string;
  };
  usage_start_time: string; // ISO 8601
  usage_end_time: string;
  project: {
    id: string;
    name: string;
    number: string;
  };
  labels: Record<string, string>;
  location: {
    location: string;
    country: string;
    region: string;
    zone?: string;
  };
  cost: number;
  currency: string;
  usage: {
    amount: number;
    unit: string;
    pricing_unit: string;
  };
  credits: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
  invoice: {
    month: string; // YYYYMM
  };
  cost_type: 'regular' | 'tax' | 'adjustment';
}

export type SpendingPattern = 'normal' | 'compute_spike' | 'gradual_growth' | 'optimized';

export interface BudgetConfig {
  amount: number;
  currency: string;
  period: 'MONTHLY';
  thresholds: number[]; // e.g. [0.5, 0.8, 0.9, 1.0, 1.2]
  notificationChannels: {
    email: boolean;
    slackWebhook: boolean;
    pubsubTopic: boolean;
  };
  emailRecipient: string;
  slackChannel: string;
  pubsubTopicName: string;
}

export interface AlertEvent {
  id: string;
  timestamp: string;
  threshold: number; // e.g., 0.9 for 90%
  currentSpend: number;
  budgetAmount: number;
  percentage: number;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  channel: string;
  topContributingService: string;
  message: string;
  pubsubMessagePayload: GCPBudgetPubSubPayload;
  acknowledged?: boolean;
}

/**
 * GCP Cloud Billing Budgets API Pub/Sub Notification Payload format:
 * When a budget notification is published to a Pub/Sub topic, this is the exact JSON body.
 */
export interface GCPBudgetPubSubPayload {
  budgetDisplayName: string;
  costAmount: number;
  costIntervalStart: string;
  budgetAmount: number;
  budgetAmountType: 'SPECIFIED_AMOUNT' | 'LAST_MONTH_COST';
  alertThresholdExceeded: number;
  currencyCode: string;
}

export interface ServiceCostSummary {
  service: string;
  serviceId: string;
  color: string;
  currentCost: number;
  previousCost: number;
  percentageChange: number;
  dailyAverage: number;
  shareOfTotal: number;
  topSkus: Array<{
    sku: string;
    cost: number;
    usage: number;
    unit: string;
  }>;
}

export interface CostAnomaly {
  id: string;
  service: string;
  date: string;
  actualCost: number;
  expectedCost: number;
  deviationPercent: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  suspectedCause: string;
  skuAffected: string;
  region: string;
  zScore: number;
}

export interface ForecastMetrics {
  monthToDateSpend: number;
  daysElapsed: number;
  daysInMonth: number;
  dailyBurnRate: number; // calculated from recent trend
  forecastedSpend: number;
  forecastedDeltaVsBudget: number;
  budgetLimit: number;
  percentUsed: number;
  forecastPercentUsed: number;
  status: 'SAFE' | 'WARNING' | 'BREACHED';
}

export interface DailySpendRecord {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  total: number;
  ComputeEngine: number;
  CloudStorage: number;
  BigQuery: number;
  CloudSQL: number;
  CloudRun: number;
  Networking: number;
  budgetLimitPerDayCumulative?: number;
  hasAnomaly?: boolean;
}

export interface AICostAnalysisResponse {
  executiveSummary: string;
  topCostDriver: string;
  anomaliesDetected: CostAnomaly[];
  recommendations: Array<{
    title: string;
    estimatedSavings: string;
    service: string;
    action: string;
  }>;
  forecastAssessment: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  suggestedFollowUps?: string[];
}
