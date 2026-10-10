import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { App } from '../App';
import type { DeviceAssessmentResponse } from '../types/assessment';

const MOCK_HEALTH_OK = { status: 'ok', application: 'E-CyclePilot', version: '0.1.0' };

const MOCK_REUSE_RESPONSE: DeviceAssessmentResponse = {
  success: true,
  statusCode: 200,
  assessmentId: 'ECP-TEST-001',
  timestamp: '2026-10-10T00:00:00.000Z',
  primaryPathway: 'REUSE',
  primaryRationale:
    'Device is fully functional, structurally sound, and within the modern secondary deployment window. Immediate reuse affirmed.',
  safetyAlert: {
    active: false,
    hazardLevel: 'NONE',
    hazardsIdentified: [],
    mandatoryContainmentInstructions: [],
  },
  complianceFlags: {
    dataSanitizationRequired: false,
    hazardousTransportRestricted: false,
  },
  eligiblePathways: ['REUSE', 'REFURBISHMENT'],
  disqualifiedPathways: ['SPECIAL_HANDLING'],
  pathwayComparison: [
    {
      pathway: 'SPECIAL_HANDLING',
      status: 'DISQUALIFIED',
      score: 0,
      rationale: 'No active hazardous materials detected.',
    },
    {
      pathway: 'REUSE',
      status: 'RECOMMENDED',
      score: 95,
      rationale: 'Primary recommended pathway: Pristine device.',
    },
    {
      pathway: 'REPAIR',
      status: 'DISQUALIFIED',
      score: 0,
      rationale: 'No repair needed.',
    },
    {
      pathway: 'REFURBISHMENT',
      status: 'ELIGIBLE',
      score: 75,
      rationale: 'Viable secondary alternative.',
    },
    {
      pathway: 'COMPONENT_RECOVERY',
      status: 'DISQUALIFIED',
      score: 0,
      rationale: 'Host board fully functional.',
    },
    {
      pathway: 'FORMAL_RECYCLING',
      status: 'DISQUALIFIED',
      score: 0,
      rationale: 'Device in active circular lifecycle.',
    },
  ],
  reasonCodes: ['RULE_USE_001_FULLY_FUNCTIONAL_PRISTINE'],
  actionChecklist: ['Clean external surfaces and prepare unit for direct redeployment'],
  harvestManifest: [],
  financialSummary: {
    status: 'CALCULATED',
    currency: 'USD',
    estimatedMarketValue: 450.0,
    estimatedRepairCost: 0.0,
    costRatioPercent: 0.0,
    netRepairMargin: 450.0,
    salvageYieldTotal: null,
    notes: 'Cost ratio 0.0% is within economic ceiling.',
  },
  uncertaintyWarnings: [],
};

const MOCK_HAZARD_RESPONSE: DeviceAssessmentResponse = {
  success: true,
  statusCode: 200,
  assessmentId: 'ECP-TEST-HAZARD',
  timestamp: '2026-10-10T00:00:00.000Z',
  primaryPathway: 'SPECIAL_HANDLING',
  primaryRationale:
    'Hazardous condition detected. Device requires fire suppression or hazmat containment.',
  safetyAlert: {
    active: true,
    hazardLevel: 'CRITICAL',
    hazardsIdentified: [
      'Lithium-ion battery confirmed bulging / mechanical distortion',
      'Active thermal overheating reported',
    ],
    mandatoryContainmentInstructions: [
      'Quarantine unit immediately in a fire-rated LiPo safety container',
      'Do NOT connect AC power, charger, or peripherals',
      'Restricted under UN 3480 hazardous freight regulations',
    ],
  },
  complianceFlags: {
    dataSanitizationRequired: false,
    hazardousTransportRestricted: true,
  },
  eligiblePathways: ['SPECIAL_HANDLING'],
  disqualifiedPathways: [
    'REUSE',
    'REPAIR',
    'REFURBISHMENT',
    'COMPONENT_RECOVERY',
    'FORMAL_RECYCLING',
  ],
  pathwayComparison: [
    {
      pathway: 'SPECIAL_HANDLING',
      status: 'RECOMMENDED',
      score: 95,
      rationale: 'Mandatory hazardous containment.',
    },
  ],
  reasonCodes: ['RULE_SAF_001_BATTERY_SWELLING_CONFIRMED', 'COMMERCIAL_VALUE_OVERRIDDEN_BY_SAFETY'],
  actionChecklist: ['Quarantine unit immediately in a fire-rated container'],
  harvestManifest: [],
  financialSummary: {
    status: 'CALCULATED',
    currency: 'USD',
    estimatedMarketValue: 950.0,
    estimatedRepairCost: 80.0,
    costRatioPercent: 8.4,
    netRepairMargin: 870.0,
    salvageYieldTotal: null,
    notes: 'Safety dominance overrides economic valuation.',
  },
  uncertaintyWarnings: [],
};

const MOCK_REPAIR_RESPONSE: DeviceAssessmentResponse = {
  ...MOCK_REUSE_RESPONSE,
  assessmentId: 'ECP-TEST-REPAIR',
  primaryPathway: 'REPAIR',
  primaryRationale: 'Isolated display defect is economically viable to restore.',
  reasonCodes: ['RULE_REP_001_ISOLATED_DEFECT_ECONOMICALLY_VIABLE'],
  financialSummary: {
    status: 'CALCULATED',
    currency: 'USD',
    estimatedMarketValue: 280.0,
    estimatedRepairCost: 85.0,
    costRatioPercent: 30.4,
    netRepairMargin: 195.0,
    salvageYieldTotal: null,
    notes: 'Cost ratio 30.4% is within 70% economic ceiling.',
  },
};

const MOCK_DATA_UNAVAILABLE_RESPONSE: DeviceAssessmentResponse = {
  ...MOCK_REUSE_RESPONSE,
  assessmentId: 'ECP-TEST-UNPRICED',
  primaryPathway: 'COMPONENT_RECOVERY',
  primaryRationale:
    'Mainboard is unbootable, but verified working modular components can be salvaged.',
  harvestManifest: [
    { name: '16GB DDR4 ECC RAM', functional: true, salvageValue: null },
    { name: '500W Modular PSU', functional: true, salvageValue: null },
  ],
  financialSummary: {
    status: 'DATA_UNAVAILABLE',
    currency: 'USD',
    estimatedMarketValue: null,
    estimatedRepairCost: null,
    costRatioPercent: null,
    netRepairMargin: null,
    salvageYieldTotal: null,
    notes: 'Economic data missing; financial feasibility undetermined.',
  },
  uncertaintyWarnings: ['Component salvage pricing unconfirmed'],
};

describe('E-CyclePilot Complete Frontend Application Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Product Title and Introduction
  // --------------------------------------------------------------------------
  it('renders product title, tagline, and introduction correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_HEALTH_OK,
    } as Response);

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'E-CyclePilot' })).toBeInTheDocument();
    expect(
      screen.getByText('AI-Powered E-Waste Recovery & Circularity Decision Engine'),
    ).toBeInTheDocument();
    expect(screen.getByText('Give Every Device a Smarter Second Life.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });
  });

  // --------------------------------------------------------------------------
  // 2. All Required Form Sections
  // --------------------------------------------------------------------------
  it('renders all required assessment form sections (A through F)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_HEALTH_OK,
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });

    expect(screen.getByText('Section A: Device Information')).toBeInTheDocument();
    expect(screen.getByText('Section B: Physical Condition')).toBeInTheDocument();
    expect(screen.getByText('Section C: Functional Status')).toBeInTheDocument();
    expect(screen.getByText('Section D: Battery Condition')).toBeInTheDocument();
    expect(screen.getByText('Section E: Storage & Data Privacy')).toBeInTheDocument();
    expect(screen.getByText('Section F: Modular Components & Economics')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 3. Numeric Input Handling
  // --------------------------------------------------------------------------
  it('handles numeric input updates for hardware age and financial values', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_HEALTH_OK,
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });

    const ageInput = screen.getByLabelText(/Hardware Age \(Years\)/i);
    fireEvent.change(ageInput, { target: { value: '4.5' } });
    expect(ageInput).toHaveValue(4.5);

    const marketValueInput = screen.getByLabelText(/Estimated Secondary Market Value/i);
    fireEvent.change(marketValueInput, { target: { value: '350.50' } });
    expect(marketValueInput).toHaveValue(350.5);
  });

  // --------------------------------------------------------------------------
  // 4. Loading a Synthetic Scenario
  // --------------------------------------------------------------------------
  it('populates form inputs when loading a synthetic scenario without auto-submitting', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_HEALTH_OK,
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });

    const scenarioSelect = screen.getByLabelText(/Load Synthetic Assessment Scenario/i);
    fireEvent.change(scenarioSelect, { target: { value: 'hazardous-battery' } });

    // Verify fields populated
    const brandInput = screen.getByLabelText(/Manufacturer \/ Brand/i);
    expect(brandInput).toHaveValue('Razer');

    const modelInput = screen.getByLabelText(/Model Identifier/i);
    expect(modelInput).toHaveValue('Blade 15');

    // Results view should NOT be rendered yet (not auto-submitted)
    expect(screen.queryByTestId('assessment-results')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 5. Successful API Submission
  // --------------------------------------------------------------------------
  it('submits assessment to POST /api/v1/assess and displays the response', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_REUSE_RESPONSE,
      } as Response);

    render(<App />);

    const submitBtn = screen.getByTestId('assess-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-results')).toBeInTheDocument();
    });

    expect(screen.getByTestId('primary-pathway-badge')).toHaveTextContent('REUSE');
    expect(screen.getByTestId('primary-rationale')).toHaveTextContent(
      /Device is fully functional/i,
    );
  });

  // --------------------------------------------------------------------------
  // 6. Rendering SPECIAL_HANDLING with Safety Alert
  // --------------------------------------------------------------------------
  it('renders SPECIAL_HANDLING with critical safety alert and containment protocol', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_HAZARD_RESPONSE,
      } as Response);

    render(<App />);

    const submitBtn = screen.getByTestId('assess-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('safety-alert-banner')).toBeInTheDocument();
    });

    expect(screen.getByText('CRITICAL SAFETY ALERT')).toBeInTheDocument();
    expect(screen.getByText(/Lithium-ion battery confirmed bulging/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Quarantine unit immediately in a fire-rated LiPo safety container/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('primary-pathway-badge')).toHaveTextContent('SPECIAL_HANDLING');
  });

  // --------------------------------------------------------------------------
  // 7. Rendering REPAIR with Calculated Financial Data
  // --------------------------------------------------------------------------
  it('renders REPAIR pathway with calculated financial metrics', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_REPAIR_RESPONSE,
      } as Response);

    render(<App />);

    fireEvent.click(screen.getByTestId('assess-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('metric-market-value')).toHaveTextContent('$280.00');
    });

    expect(screen.getByTestId('metric-repair-cost')).toHaveTextContent('$85.00');
    expect(screen.getByTestId('metric-net-margin')).toHaveTextContent('$195.00');
    expect(screen.getByTestId('metric-cost-ratio')).toHaveTextContent('30.4%');
    expect(screen.getByTestId('financial-status-badge')).toHaveTextContent('CALCULATED');
  });

  // --------------------------------------------------------------------------
  // 8. Rendering DATA_UNAVAILABLE without Converting Null to Zero
  // --------------------------------------------------------------------------
  it('renders DATA_UNAVAILABLE financial summary displaying "Not available" for null values', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_DATA_UNAVAILABLE_RESPONSE,
      } as Response);

    render(<App />);

    fireEvent.click(screen.getByTestId('assess-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('financial-status-badge')).toHaveTextContent('DATA_UNAVAILABLE');
    });

    // Null amounts must explicitly display "Not available", never $0.00
    expect(screen.getByTestId('metric-market-value')).toHaveTextContent('Not available');
    expect(screen.getByTestId('metric-repair-cost')).toHaveTextContent('Not available');
    expect(screen.getByTestId('metric-net-margin')).toHaveTextContent('Not available');
    expect(screen.getByTestId('metric-salvage-yield')).toHaveTextContent('Not available');

    // Manifest should still list unpriced components
    expect(screen.getByText('16GB DDR4 ECC RAM')).toBeInTheDocument();
    expect(screen.getByText('500W Modular PSU')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 9. Rendering Backend Validation Errors (HTTP 400)
  // --------------------------------------------------------------------------
  it('renders backend validation errors (HTTP 400) cleanly', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          statusCode: 400,
          error: 'BAD_REQUEST',
          message:
            'Invalid device category: MICROWAVE. Supported categories: LAPTOP, SMARTPHONE, DESKTOP, TABLET.',
        }),
      } as Response);

    render(<App />);

    fireEvent.click(screen.getByTestId('assess-submit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid device category: MICROWAVE');
    });

    expect(screen.queryByTestId('assessment-results')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 10. Handling Backend Network Failure
  // --------------------------------------------------------------------------
  it('handles network connection failure gracefully with actionable guidance', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockRejectedValueOnce(new Error('Network error / connection refused'));

    render(<App />);

    fireEvent.click(screen.getByTestId('assess-submit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to reach assessment service/i);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Preventing Repeated Submissions While Pending
  // --------------------------------------------------------------------------
  it('disables submit button and shows loading state while submission is pending', async () => {
    let resolveSubmit!: (val: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => {
      resolveSubmit = resolve;
    });

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockReturnValueOnce(pendingPromise);

    render(<App />);

    const submitBtn = screen.getByTestId('assess-submit-btn');
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/Evaluating Telemetry.../i);

    // Resolve promise
    resolveSubmit({
      ok: true,
      status: 200,
      json: async () => MOCK_REUSE_RESPONSE,
    } as Response);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-results')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 12. Exporting Assessment Response as JSON
  // --------------------------------------------------------------------------
  it('exports the completed assessment response as a downloadable JSON file', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_REUSE_RESPONSE,
      } as Response);

    const createObjectURLSpy = vi.fn().mockReturnValue('blob:http://localhost/test-blob');
    const revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy;

    render(<App />);

    fireEvent.click(screen.getByTestId('assess-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('download-json-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('download-json-btn'));

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/test-blob');
  });

  // --------------------------------------------------------------------------
  // 13. Resetting the Form Safely
  // --------------------------------------------------------------------------
  it('resets the form safely back to clean default values', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_HEALTH_OK,
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });

    const brandInput = screen.getByLabelText(/Manufacturer \/ Brand/i);
    fireEvent.change(brandInput, { target: { value: 'Asus ROG' } });
    expect(brandInput).toHaveValue('Asus ROG');

    const resetBtn = screen.getByTestId('assess-reset-btn');
    fireEvent.click(resetBtn);

    expect(screen.getByLabelText(/Manufacturer \/ Brand/i)).toHaveValue('Lenovo');
  });

  // --------------------------------------------------------------------------
  // 14. Existing Health-Indicator and Pathways Overview
  // --------------------------------------------------------------------------
  it('maintains health-indicator and renders all six circularity pathway cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_HEALTH_OK,
    } as Response);

    render(<App />);

    expect(screen.getByText('SPECIAL_HANDLING')).toBeInTheDocument();
    expect(screen.getByText('REUSE')).toBeInTheDocument();
    expect(screen.getByText('REPAIR')).toBeInTheDocument();
    expect(screen.getByText('REFURBISHMENT')).toBeInTheDocument();
    expect(screen.getByText('COMPONENT_RECOVERY')).toBeInTheDocument();
    expect(screen.getByText('FORMAL_RECYCLING')).toBeInTheDocument();

    const indicator = screen.getByTestId('connection-indicator');
    await waitFor(() => {
      expect(indicator).toHaveTextContent('API online');
      expect(indicator).toHaveClass('online');
    });

    expect(screen.getByText(/Connected \(E-CyclePilot v0.1.0\)/i)).toBeInTheDocument();
  });
});
