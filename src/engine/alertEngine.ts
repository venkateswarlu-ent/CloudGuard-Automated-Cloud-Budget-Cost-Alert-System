/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CloudGuard Alert Engine & Cost Analytics
 * 
 * ARCHITECTURAL NOTE FOR GCP PRODUCTION DEPLOYMENT:
 * In Google Cloud, this threshold logic is handled by:
 * 1. Cloud Billing Budgets API:
 *    A budget is created with `thresholdRules` (e.g. 50%, 90%, 100% of budget).
 * 2. Cloud Pub/Sub:
 *    The budget is linked to a Pub/Sub topic (e.g. `projects/my-proj/topics/billing-budget-alerts`).
 *    When a threshold is exceeded, GCP publishes a JSON payload to this topic.
 * 3. Cloud Functions / Cloud Run:
 *    A serverless function triggers on Pub/Sub messages, formats alert notifications,
 *    sends Slack/Email webhooks, and calls Vertex AI / Gemini for root-cause diagnosis.
 * 
 * In this module, we implement that exact threshold evaluation, burn-rate forecasting,
 * and statistical anomaly detection algorithms.
 */

import {
  GCPBillingRow,
  BudgetConfig,
  AlertEvent,
  DailySpendRecord,
  ServiceCostSummary,
  CostAnomaly,
  ForecastMetrics,
  GCPBudgetPubSubPayload,
} from '../types/billing';
import { GCP_SERVICES } from '../data/mockBillingData';

/**
 * Aggregates raw billing rows by date and by service
 */
export function aggregateDailySpend(rows: GCPBillingRow[], budgetLimit?: number): DailySpendRecord[] {
  const dailyMap: Record<string, DailySpendRecord> = {};

  // Sort rows chronologically
  const sortedRows = [...rows].sort((a, b) => a.usage_start_time.localeCompare(b.usage_start_time));

  for (const row of sortedRows) {
    const dateStr = row.usage_start_time.split('T')[0];
    if (!dailyMap[dateStr]) {
      const dateObj = new Date(dateStr + 'T12:00:00Z');
      const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = {
        date: dateStr,
        dayLabel,
        total: 0,
        ComputeEngine: 0,
        CloudStorage: 0,
        BigQuery: 0,
        CloudSQL: 0,
        CloudRun: 0,
        Networking: 0,
      };
    }

    const cost = Math.max(0, row.cost);
    dailyMap[dateStr].total = Number((dailyMap[dateStr].total + cost).toFixed(2));

    switch (row.service.description) {
      case 'Compute Engine':
        dailyMap[dateStr].ComputeEngine = Number((dailyMap[dateStr].ComputeEngine + cost).toFixed(2));
        break;
      case 'Cloud Storage':
        dailyMap[dateStr].CloudStorage = Number((dailyMap[dateStr].CloudStorage + cost).toFixed(2));
        break;
      case 'BigQuery':
        dailyMap[dateStr].BigQuery = Number((dailyMap[dateStr].BigQuery + cost).toFixed(2));
        break;
      case 'Cloud SQL':
        dailyMap[dateStr].CloudSQL = Number((dailyMap[dateStr].CloudSQL + cost).toFixed(2));
        break;
      case 'Cloud Run':
        dailyMap[dateStr].CloudRun = Number((dailyMap[dateStr].CloudRun + cost).toFixed(2));
        break;
      case 'Networking':
        dailyMap[dateStr].Networking = Number((dailyMap[dateStr].Networking + cost).toFixed(2));
        break;
    }
  }

  const result = Object.values(dailyMap);

  // Optional daily cumulative budget trajectory guideline
  if (budgetLimit && result.length > 0) {
    const dailyTarget = budgetLimit / 30;
    result.forEach((day, index) => {
      day.budgetLimitPerDayCumulative = Number((dailyTarget * (index + 1)).toFixed(2));
    });
  }

  return result;
}

/**
 * Calculates current month-to-date total spend and breakdown by service
 */
export function calculateServiceBreakdowns(rows: GCPBillingRow[]): {
  totalSpend: number;
  services: ServiceCostSummary[];
  topService: string;
} {
  const serviceStats: Record<string, {
    currentCost: number;
    recent7DayCost: number;
    prev7DayCost: number;
    color: string;
    skus: Record<string, { cost: number; usage: number; unit: string }>;
  }> = {};

  // Initialize all known GCP services
  for (const s of GCP_SERVICES) {
    serviceStats[s.description] = {
      currentCost: 0,
      recent7DayCost: 0,
      prev7DayCost: 0,
      color: s.color,
      skus: {},
    };
  }

  // Find the date range to compare last 7 days vs prior 7 days
  const dates = Array.from(new Set(rows.map(r => r.usage_start_time.split('T')[0]))).sort();
  const last7Dates = new Set(dates.slice(-7));
  const prior7Dates = new Set(dates.slice(-14, -7));

  let grandTotal = 0;

  for (const row of rows) {
    const cost = Math.max(0, row.cost);
    grandTotal += cost;

    const sName = row.service.description;
    if (!serviceStats[sName]) {
      serviceStats[sName] = {
        currentCost: 0,
        recent7DayCost: 0,
        prev7DayCost: 0,
        color: '#64748B',
        skus: {},
      };
    }

    serviceStats[sName].currentCost += cost;

    const rowDate = row.usage_start_time.split('T')[0];
    if (last7Dates.has(rowDate)) {
      serviceStats[sName].recent7DayCost += cost;
    } else if (prior7Dates.has(rowDate)) {
      serviceStats[sName].prev7DayCost += cost;
    }

    // SKU aggregation
    const skuName = row.sku.description;
    if (!serviceStats[sName].skus[skuName]) {
      serviceStats[sName].skus[skuName] = { cost: 0, usage: 0, unit: row.usage.unit };
    }
    serviceStats[sName].skus[skuName].cost += cost;
    serviceStats[sName].skus[skuName].usage += row.usage.amount;
  }

  grandTotal = Number(grandTotal.toFixed(2));

  const serviceSummaries: ServiceCostSummary[] = Object.entries(serviceStats).map(([name, data]) => {
    const currentCost = Number(data.currentCost.toFixed(2));
    const previousCost = Number(data.prev7DayCost.toFixed(2));
    const recentCost = Number(data.recent7DayCost.toFixed(2));
    
    // Percentage change in recent 7 days vs previous 7 days
    let percentageChange = 0;
    if (previousCost > 0) {
      percentageChange = Number((((recentCost - previousCost) / previousCost) * 100).toFixed(1));
    } else if (recentCost > 0) {
      percentageChange = 100;
    }

    const shareOfTotal = grandTotal > 0 ? Number(((currentCost / grandTotal) * 100).toFixed(1)) : 0;
    const dailyAverage = Number((currentCost / (dates.length || 30)).toFixed(2));

    const topSkus = Object.entries(data.skus)
      .map(([sku, info]) => ({
        sku,
        cost: Number(info.cost.toFixed(2)),
        usage: Number(info.usage.toFixed(1)),
        unit: info.unit,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 3);

    const sMeta = GCP_SERVICES.find(s => s.description === name);

    return {
      service: name,
      serviceId: sMeta?.id || 'unknown',
      color: data.color,
      currentCost,
      previousCost,
      percentageChange,
      dailyAverage,
      shareOfTotal,
      topSkus,
    };
  }).sort((a, b) => b.currentCost - a.currentCost);

  const topService = serviceSummaries.length > 0 ? serviceSummaries[0].service : 'Compute Engine';

  return {
    totalSpend: grandTotal,
    services: serviceSummaries,
    topService,
  };
}

/**
 * Forecast end-of-month spend based on current burn rate
 */
export function calculateForecast(
  monthToDateSpend: number,
  dailyRecords: DailySpendRecord[],
  budgetLimit: number,
): ForecastMetrics {
  const daysInMonth = 30;
  const daysElapsed = Math.min(daysInMonth, dailyRecords.length || 20);
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  // Calculate daily burn rate using the weighted average of the last 7 days
  const recentDays = dailyRecords.slice(-7);
  const recentTotal = recentDays.reduce((acc, d) => acc + d.total, 0);
  const dailyBurnRate = recentDays.length > 0 ? Number((recentTotal / recentDays.length).toFixed(2)) : 0;

  // Forecasted end-of-month spend = current MTD + (burn rate * remaining days)
  const forecastedSpend = Number((monthToDateSpend + (dailyBurnRate * daysRemaining)).toFixed(2));
  const forecastedDeltaVsBudget = Number((forecastedSpend - budgetLimit).toFixed(2));
  const percentUsed = Number(((monthToDateSpend / budgetLimit) * 100).toFixed(1));
  const forecastPercentUsed = Number(((forecastedSpend / budgetLimit) * 100).toFixed(1));

  let status: ForecastMetrics['status'] = 'SAFE';
  if (percentUsed >= 100 || forecastPercentUsed >= 110) {
    status = 'BREACHED';
  } else if (percentUsed >= 80 || forecastPercentUsed >= 95) {
    status = 'WARNING';
  }

  return {
    monthToDateSpend,
    daysElapsed,
    daysInMonth,
    dailyBurnRate,
    forecastedSpend,
    forecastedDeltaVsBudget,
    budgetLimit,
    percentUsed,
    forecastPercentUsed,
    status,
  };
}

/**
 * Anomaly Detection Algorithm:
 * Evaluates each service's recent daily spend against its 7-day rolling window mean + 2 std deviations
 */
export function detectCostAnomalies(rows: GCPBillingRow[]): CostAnomaly[] {
  const anomalies: CostAnomaly[] = [];
  const dailyByService: Record<string, Record<string, number>> = {};
  const skuUsageByServiceDay: Record<string, { sku: string; cost: number; region: string }> = {};

  // Group costs by date and service
  for (const row of rows) {
    const dateStr = row.usage_start_time.split('T')[0];
    const sName = row.service.description;

    if (!dailyByService[sName]) dailyByService[sName] = {};
    dailyByService[sName][dateStr] = (dailyByService[sName][dateStr] || 0) + row.cost;

    const key = `${sName}___${dateStr}`;
    if (!skuUsageByServiceDay[key] || row.cost > skuUsageByServiceDay[key].cost) {
      skuUsageByServiceDay[key] = {
        sku: row.sku.description,
        cost: row.cost,
        region: row.location.region,
      };
    }
  }

  // Evaluate the last 3 days for spikes
  for (const [service, dayMap] of Object.entries(dailyByService)) {
    const sortedDates = Object.keys(dayMap).sort();
    if (sortedDates.length < 8) continue;

    // Last 3 days to test
    const testDates = sortedDates.slice(-3);
    // Baseline is prior 10 days before these 3
    const baselineDates = sortedDates.slice(0, -3).slice(-10);

    const baselineValues = baselineDates.map(d => dayMap[d] || 0);
    const mean = baselineValues.reduce((a, b) => a + b, 0) / (baselineValues.length || 1);
    const variance = baselineValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (baselineValues.length || 1);
    const stdDev = Math.sqrt(variance) || 1;

    for (const testDate of testDates) {
      const actualCost = dayMap[testDate] || 0;
      const zScore = (actualCost - mean) / stdDev;
      const deviationPercent = mean > 0 ? ((actualCost - mean) / mean) * 100 : 0;

      // Anomaly threshold: cost higher than expected by > 40% and zScore > 1.8
      if (deviationPercent >= 40 && zScore >= 1.8 && actualCost > 30) {
        const topSkuInfo = skuUsageByServiceDay[`${service}___${testDate}`];
        
        let severity: CostAnomaly['severity'] = 'INFO';
        if (deviationPercent > 120 || zScore > 3.0) {
          severity = 'CRITICAL';
        } else if (deviationPercent > 60 || zScore > 2.0) {
          severity = 'WARNING';
        }

        let cause = `Sudden surge in ${service} daily workload (+${deviationPercent.toFixed(0)}% vs baseline).`;
        if (topSkuInfo?.sku.includes('GPU')) {
          cause = `Heavy compute spike caused by Nvidia A100 GPU accelerator allocation in ${topSkuInfo.region}.`;
        } else if (topSkuInfo?.sku.includes('Analysis')) {
          cause = `Unoptimized BigQuery slot-ms consumption from high-cardinality interactive queries.`;
        } else if (topSkuInfo?.sku.includes('Storage')) {
          cause = `Unpruned snapshot/multi-region storage ingestion exceeding expected backup quota.`;
        } else if (topSkuInfo?.sku.includes('Egress')) {
          cause = `Unexpected network egress burst across regions or public internet transfer.`;
        }

        anomalies.push({
          id: `anom-${service.toLowerCase().replace(/\s+/g, '-')}-${testDate}`,
          service,
          date: testDate,
          actualCost: Number(actualCost.toFixed(2)),
          expectedCost: Number(mean.toFixed(2)),
          deviationPercent: Number(deviationPercent.toFixed(1)),
          severity,
          suspectedCause: cause,
          skuAffected: topSkuInfo?.sku || 'Multiple compute instances',
          region: topSkuInfo?.region || 'us-central1',
          zScore: Number(zScore.toFixed(2)),
        });
      }
    }
  }

  // Sort by severity and date desc
  return anomalies.sort((a, b) => b.deviationPercent - a.deviationPercent);
}

/**
 * Budget & Alert Threshold Evaluator:
 * Checks current spend against configured threshold rules (50%, 80%, 90%, 100%, 120%)
 * and generates realistic Pub/Sub simulated alert events.
 */
export function evaluateAlertRules(
  currentSpend: number,
  config: BudgetConfig,
  topContributingService: string,
): AlertEvent[] {
  const alerts: AlertEvent[] = [];
  const percent = currentSpend / config.amount;

  // Sort thresholds ascending
  const sortedThresholds = [...config.thresholds].sort((a, b) => a - b);

  for (const thresh of sortedThresholds) {
    if (percent >= thresh) {
      const percentageDisplay = Math.round(thresh * 100);
      const spendAtThreshold = Number((config.amount * thresh).toFixed(2));

      let severity: AlertEvent['severity'] = 'info';
      if (thresh >= 1.2) severity = 'emergency';
      else if (thresh >= 1.0) severity = 'critical';
      else if (thresh >= 0.85) severity = 'warning';

      // Construct GCP Cloud Billing Budgets Pub/Sub simulated payload
      const pubsubPayload: GCPBudgetPubSubPayload = {
        budgetDisplayName: `Monthly-Production-GCP-Budget`,
        costAmount: currentSpend,
        costIntervalStart: new Date().toISOString().slice(0, 7) + '-01T00:00:00Z',
        budgetAmount: config.amount,
        budgetAmountType: 'SPECIFIED_AMOUNT',
        alertThresholdExceeded: thresh,
        currencyCode: config.currency,
      };

      let channel = 'In-App Webhook';
      if (config.notificationChannels.slackWebhook && config.notificationChannels.email) {
        channel = 'Slack (#cloud-ops) + SendGrid Email';
      } else if (config.notificationChannels.slackWebhook) {
        channel = `Slack (${config.slackChannel})`;
      } else if (config.notificationChannels.email) {
        channel = `Email (${config.emailRecipient})`;
      }

      alerts.push({
        id: `alert-${percentageDisplay}-${Math.round(currentSpend)}`,
        timestamp: new Date(Date.now() - (1 - thresh / percent) * 86400000 * 3).toLocaleTimeString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        threshold: thresh,
        currentSpend,
        budgetAmount: config.amount,
        percentage: percentageDisplay,
        severity,
        channel,
        topContributingService,
        message: `Budget threshold rule ${percentageDisplay}% breached: current spend $${currentSpend.toLocaleString()} has reached ${(percent * 100).toFixed(1)}% of $${config.amount.toLocaleString()} limit. Top driver: ${topContributingService}.`,
        pubsubMessagePayload: pubsubPayload,
      });
    }
  }

  return alerts.reverse(); // Most critical / latest first
}
