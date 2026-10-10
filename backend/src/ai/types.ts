// ============================================================================
// E-CyclePilot: AI Assessment Explanation Types & Contracts
// ============================================================================

import type {
  CircularityPathway,
  ComplianceFlags,
  FinancialSummary,
  SafetyAlert,
} from '../engine/types.js';

export interface ExplainAssessmentRequest {
  primaryPathway: CircularityPathway;
  primaryRationale: string;
  safetyAlert: SafetyAlert;
  complianceFlags: ComplianceFlags;
  actionChecklist?: string[];
  reasonCodes?: string[];
  financialSummary?: FinancialSummary;
  assessmentId?: string;
  deviceInfo?: {
    category?: string;
    brand?: string;
    model?: string;
    ageYears?: number;
  };
}

export interface ExplainAssessmentSuccessResponse {
  success: true;
  explanation: string;
}

export interface ExplainAssessmentErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
}

export type ExplainAssessmentResponse =
  ExplainAssessmentSuccessResponse | ExplainAssessmentErrorResponse;
