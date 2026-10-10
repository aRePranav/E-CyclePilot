// ============================================================================
// E-CyclePilot: AI-Powered E-Waste Recovery & Circularity Decision Engine
// Stage E & F: Repair Economics & Component Harvest Valuation
// ============================================================================

import {
  DeviceAssessmentRequest,
  EngineOptions,
  FinancialSummary,
  ModularComponentItem,
} from './types.js';

export interface EconomicEvaluation {
  financialSummary: FinancialSummary;
  costRatio: number | null;
  isRepairViable: boolean | null; // true if ratio <= threshold, false if > threshold, null if unconfirmed
  harvestManifest: ModularComponentItem[];
  allComponentPricesSupplied: boolean;
  missingEconomicData: boolean;
}

/**
 * Calculates deterministic financial metrics, 70% threshold ratio,
 * and harvests modular components without fabricating missing figures.
 */
export function evaluateEconomics(
  req: DeviceAssessmentRequest,
  options?: EngineOptions,
): EconomicEvaluation {
  const thresholdRatio = options?.repairCostThresholdRatio ?? 0.7;

  const rawMarketValue = req.economics?.estimatedMarketValue;
  const rawRepairCost = req.economics?.estimatedRepairCost;

  const hasMarketValue =
    rawMarketValue !== null &&
    rawMarketValue !== undefined &&
    typeof rawMarketValue === 'number' &&
    !isNaN(rawMarketValue);

  const hasRepairCost =
    rawRepairCost !== null &&
    rawRepairCost !== undefined &&
    typeof rawRepairCost === 'number' &&
    !isNaN(rawRepairCost);

  let costRatio: number | null = null;
  let costRatioPercent: number | null = null;
  let netRepairMargin: number | null = null;
  let isRepairViable: boolean | null = null;

  if (hasMarketValue && hasRepairCost) {
    const marketValue = rawMarketValue;
    const repairCost = rawRepairCost;

    if (marketValue > 0) {
      costRatio = repairCost / marketValue;
      // Round to 1 decimal place (e.g. 30.4%)
      costRatioPercent = Math.round(costRatio * 1000) / 10;
      // Net margin rounded to 2 decimal places
      netRepairMargin = Math.round((marketValue - repairCost) * 100) / 100;
      isRepairViable = costRatio <= thresholdRatio;
    } else {
      // Market value is 0 (scrap or carcass)
      costRatio = null;
      costRatioPercent = null;
      netRepairMargin = Math.round(-repairCost * 100) / 100;
      isRepairViable = false;
    }
  }

  // Evaluate Modular Components
  const rawComponents = req.modularComponents ?? [];
  const harvestManifest: ModularComponentItem[] = rawComponents
    .filter((item) => item.functional === true)
    .map((item) => ({
      name: item.name,
      functional: item.functional,
      salvageValue: item.salvageValue ?? null,
    }));

  let salvageYieldTotal: number | null = null;
  let allComponentPricesSupplied = false;

  if (harvestManifest.length > 0) {
    allComponentPricesSupplied = harvestManifest.every(
      (item) =>
        item.salvageValue !== null &&
        item.salvageValue !== undefined &&
        typeof item.salvageValue === 'number' &&
        !isNaN(item.salvageValue),
    );

    if (allComponentPricesSupplied) {
      salvageYieldTotal =
        Math.round(harvestManifest.reduce((acc, c) => acc + (c.salvageValue ?? 0), 0) * 100) / 100;
    } else {
      salvageYieldTotal = null;
    }
  }

  // Determine overall financial status
  const missingEconomicData =
    !hasMarketValue && !hasRepairCost && !req.economics?.estimatedComponentSalvageValue;

  const isFinancialCalculated =
    (hasMarketValue && hasRepairCost) || (harvestManifest.length > 0 && allComponentPricesSupplied);

  const status = isFinancialCalculated ? 'CALCULATED' : 'DATA_UNAVAILABLE';

  const notes =
    status === 'CALCULATED'
      ? `Repair feasibility computed against configurable project threshold of ${(thresholdRatio * 100).toFixed(1)}%.`
      : 'One or more economic metrics omitted; monetary margins and yields remain uncalculated to prevent data fabrication.';

  const financialSummary: FinancialSummary = {
    status,
    currency: 'USD',
    estimatedMarketValue: hasMarketValue ? rawMarketValue : null,
    estimatedRepairCost: hasRepairCost ? rawRepairCost : null,
    costRatioPercent,
    netRepairMargin,
    salvageYieldTotal,
    notes,
  };

  return {
    financialSummary,
    costRatio,
    isRepairViable,
    harvestManifest,
    allComponentPricesSupplied,
    missingEconomicData,
  };
}
