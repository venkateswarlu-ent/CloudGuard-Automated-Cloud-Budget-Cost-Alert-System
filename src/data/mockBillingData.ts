/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CloudGuard Mock Data Layer: GCP BigQuery Billing Export Simulator
 * 
 * ARCHITECTURAL NOTE FOR GCP PRODUCTION DEPLOYMENT:
 * In a production Google Cloud deployment, billing data flows automatically:
 * 1. GCP Cloud Billing Console -> Export to BigQuery enabled (creates table: `gcp_billing_export_v1_XXXXXX`)
 * 2. This module would be replaced by an authenticated BigQuery query client:
 *    ```typescript
 *    import { BigQuery } from '@google-cloud/bigquery';
 *    const bigquery = new BigQuery();
 *    const query = `
 *      SELECT 
 *        billing_account_id,
 *        service.description AS service_name,
 *        sku.description AS sku_description,
 *        DATE(usage_start_time) AS usage_date,
 *        project.id AS project_id,
 *        location.region AS region,
 *        SUM(cost) AS total_cost
 *      FROM \`my-gcp-project.billing_dataset.gcp_billing_export_v1_01ABCD_2345EF_6789GH\`
 *      WHERE usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
 *      GROUP BY 1,2,3,4,5,6
 *      ORDER BY usage_date DESC
 *    `;
 *    const [rows] = await bigquery.query({ query });
 *    ```
 * 
 * For this application, we generate realistic, structured GCP BigQuery billing rows
 * with dynamic spending patterns (Normal, Sudden Spike, Gradual Growth, Cost Optimized).
 */

import { GCPBillingRow, SpendingPattern } from '../types/billing';

export const GCP_SERVICES = [
  { id: '6F81-5844-456A', description: 'Compute Engine', color: '#4285F4' }, // Google Blue
  { id: '95FF-2EF5-5EA1', description: 'Cloud Storage', color: '#34A853' }, // Google Green
  { id: '24E5-CBE4-21CE', description: 'BigQuery', color: '#FBBC04' },      // Google Yellow
  { id: '9662-BC68-777B', description: 'Cloud SQL', color: '#EA4335' },     // Google Red
  { id: 'C967-B9C0-52EE', description: 'Cloud Run', color: '#A142F4' },     // Purple
  { id: 'A09D-A3DC-7497', description: 'Networking', color: '#24C1E0' },    // Cyan
] as const;

export const GCP_PROJECTS = [
  { id: 'prod-analytics-lake-01', name: 'Production Analytics Lake', number: '884910294123' },
  { id: 'web-portal-frontend', name: 'Web Portal Frontend & API', number: '884910294124' },
  { id: 'ml-training-pipeline', name: 'ML Pipeline & Training', number: '884910294125' },
];

export const GCP_REGIONS = [
  { region: 'us-central1', zone: 'us-central1-a', country: 'United States' },
  { region: 'us-east4', zone: 'us-east4-b', country: 'United States' },
  { region: 'europe-west1', zone: 'europe-west1-c', country: 'Belgium' },
];

interface SkuDefinition {
  id: string;
  description: string;
  serviceId: string;
  serviceDesc: string;
  baseDailyCost: number;
  unit: string;
  pricingUnit: string;
}

export const GCP_SKUS: SkuDefinition[] = [
  // Compute Engine
  {
    id: 'D037-3363-25A1',
    description: 'N2 Instance Core running in Americas',
    serviceId: '6F81-5844-456A',
    serviceDesc: 'Compute Engine',
    baseDailyCost: 65.0,
    unit: 'hours',
    pricingUnit: 'core-hours',
  },
  {
    id: '1540-3942-88E0',
    description: 'N2 Instance Ram running in Americas',
    serviceId: '6F81-5844-456A',
    serviceDesc: 'Compute Engine',
    baseDailyCost: 35.0,
    unit: 'gibibyte-hours',
    pricingUnit: 'gb-hours',
  },
  {
    id: 'F361-9721-BC20',
    description: 'SSD backed Persistent Disk in us-central1',
    serviceId: '6F81-5844-456A',
    serviceDesc: 'Compute Engine',
    baseDailyCost: 18.5,
    unit: 'gibibyte-months',
    pricingUnit: 'gb-mo',
  },
  {
    id: '9E04-A118-B582',
    description: 'Nvidia A100 GPU 40GB Accelerator',
    serviceId: '6F81-5844-456A',
    serviceDesc: 'Compute Engine',
    baseDailyCost: 22.0, // baseline low, surges during spikes!
    unit: 'hours',
    pricingUnit: 'gpu-hours',
  },

  // Cloud Storage
  {
    id: 'A9E2-7D77-31FB',
    description: 'Standard Storage US-Multi-Region',
    serviceId: '95FF-2EF5-5EA1',
    serviceDesc: 'Cloud Storage',
    baseDailyCost: 24.0,
    unit: 'gibibyte-months',
    pricingUnit: 'gb-mo',
  },
  {
    id: '4F5E-323A-93B4',
    description: 'Nearline Storage us-central1',
    serviceId: '95FF-2EF5-5EA1',
    serviceDesc: 'Cloud Storage',
    baseDailyCost: 12.0,
    unit: 'gibibyte-months',
    pricingUnit: 'gb-mo',
  },

  // BigQuery
  {
    id: '01BC-45FF-9912',
    description: 'Analysis (Query Slot-ms on-demand)',
    serviceId: '24E5-CBE4-21CE',
    serviceDesc: 'BigQuery',
    baseDailyCost: 40.0,
    unit: 'terabytes',
    pricingUnit: 'tb-scanned',
  },
  {
    id: '45BB-8239-C10A',
    description: 'Active Logical Storage in US',
    serviceId: '24E5-CBE4-21CE',
    serviceDesc: 'BigQuery',
    baseDailyCost: 15.0,
    unit: 'gibibyte-months',
    pricingUnit: 'gb-mo',
  },

  // Cloud SQL
  {
    id: '8C73-F29D-6701',
    description: 'Cloud SQL for PostgreSQL: db-custom-4-16384',
    serviceId: '9662-BC68-777B',
    serviceDesc: 'Cloud SQL',
    baseDailyCost: 28.0,
    unit: 'hours',
    pricingUnit: 'instance-hours',
  },
  {
    id: '298F-212D-9812',
    description: 'Cloud SQL High Availability SSD Storage',
    serviceId: '9662-BC68-777B',
    serviceDesc: 'Cloud SQL',
    baseDailyCost: 8.5,
    unit: 'gibibyte-months',
    pricingUnit: 'gb-mo',
  },

  // Cloud Run
  {
    id: '54A2-98F1-420E',
    description: 'CPU Allocation Time (us-central1)',
    serviceId: 'C967-B9C0-52EE',
    serviceDesc: 'Cloud Run',
    baseDailyCost: 16.0,
    unit: 'vCPU-seconds',
    pricingUnit: 'vcpu-s',
  },
  {
    id: '78AE-9001-23CF',
    description: 'Memory Allocation Time (us-central1)',
    serviceId: 'C967-B9C0-52EE',
    serviceDesc: 'Cloud Run',
    baseDailyCost: 8.0,
    unit: 'gibibyte-seconds',
    pricingUnit: 'gb-s',
  },

  // Networking
  {
    id: 'B001-C99A-12E4',
    description: 'Premium Tier Internet Egress from Americas',
    serviceId: 'A09D-A3DC-7497',
    serviceDesc: 'Networking',
    baseDailyCost: 14.5,
    unit: 'gibibytes',
    pricingUnit: 'gb-transfer',
  },
  {
    id: '6F32-8231-EE54',
    description: 'Cloud NAT Gateway data processing',
    serviceId: 'A09D-A3DC-7497',
    serviceDesc: 'Networking',
    baseDailyCost: 6.5,
    unit: 'gibibytes',
    pricingUnit: 'gb-processed',
  },
];

/**
 * Generate 30 days of realistic GCP BigQuery billing export records
 */
export function generateGCPBillingRows(pattern: SpendingPattern = 'normal', seed: number = 42): GCPBillingRow[] {
  const rows: GCPBillingRow[] = [];
  const billingAccountId = '0189BF-E4208A-98C334';
  const today = new Date();

  // Pseudo-random deterministic helper based on seed
  let pseudoRandomState = seed;
  const nextRandom = () => {
    pseudoRandomState = (pseudoRandomState * 9301 + 49297) % 233280;
    return pseudoRandomState / 233280;
  };

  // Generate for the last 30 days (day 29 ago to today)
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - daysAgo);
    const dateStr = targetDate.toISOString().split('T')[0];
    const invoiceMonth = `${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    // Pattern multipliers
    // dayIndex from 0 (29 days ago) to 29 (today)
    const dayIndex = 29 - daysAgo;

    for (const sku of GCP_SKUS) {
      let multiplier = 0.92 + nextRandom() * 0.16; // natural +/- 8% daily noise

      // Apply pattern logic
      if (pattern === 'compute_spike') {
        // Sudden spike in the last 4-6 days for Compute Engine and BigQuery
        if (dayIndex >= 24) {
          if (sku.serviceDesc === 'Compute Engine') {
            multiplier *= sku.description.includes('GPU') ? 6.5 : 2.4;
          } else if (sku.serviceDesc === 'BigQuery') {
            multiplier *= sku.description.includes('Analysis') ? 3.8 : 1.5;
          } else if (sku.serviceDesc === 'Networking') {
            multiplier *= 2.1;
          }
        }
      } else if (pattern === 'gradual_growth') {
        // Linear increase from day 0 (1.0x) to day 29 (2.3x) representing resource leak/scale
        const growthFactor = 1.0 + (dayIndex / 29) * 1.35;
        multiplier *= growthFactor;
        if (sku.serviceDesc === 'Cloud Storage' && sku.description.includes('Standard')) {
          // Unpruned backup snapshots multiplying
          multiplier *= 1.0 + (dayIndex / 29) * 1.8;
        }
      } else if (pattern === 'optimized') {
        // High spend in early days, then drop dramatically after day 18 when optimization occurred
        if (dayIndex >= 18) {
          multiplier *= 0.52; // 48% drop due to committed use discounts and right-sizing
        } else {
          multiplier *= 1.25;
        }
      }

      // Weekend slight dip for business workloads
      const dayOfWeek = targetDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier *= 0.85;
      }

      const dailyCost = Number((sku.baseDailyCost * multiplier).toFixed(2));
      const regionObj = GCP_REGIONS[Math.floor(nextRandom() * GCP_REGIONS.length)];
      const projectObj = GCP_PROJECTS[Math.floor(nextRandom() * GCP_PROJECTS.length)];

      rows.push({
        billing_account_id: billingAccountId,
        service: {
          id: sku.serviceId,
          description: sku.serviceDesc,
        },
        sku: {
          id: sku.id,
          description: sku.description,
        },
        usage_start_time: `${dateStr}T00:00:00Z`,
        usage_end_time: `${dateStr}T23:59:59Z`,
        project: {
          id: projectObj.id,
          name: projectObj.name,
          number: projectObj.number,
        },
        labels: {
          environment: projectObj.id.includes('prod') ? 'production' : 'staging',
          managed_by: 'terraform',
          cost_center: 'engineering',
        },
        location: {
          location: regionObj.region,
          country: regionObj.country,
          region: regionObj.region,
          zone: regionObj.zone,
        },
        cost: dailyCost,
        currency: 'USD',
        usage: {
          amount: Number((dailyCost * 2.8).toFixed(2)),
          unit: sku.unit,
          pricing_unit: sku.pricingUnit,
        },
        credits: dayIndex % 7 === 0 ? [{
          name: 'Sustained Use Discount',
          amount: Number((dailyCost * -0.15).toFixed(2)),
          type: 'SUSTAINED_USAGE_DISCOUNT',
        }] : [],
        invoice: {
          month: invoiceMonth,
        },
        cost_type: 'regular',
      });
    }
  }

  return rows;
}
