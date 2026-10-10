import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { App } from '../App';
import { AssessmentForm } from '../components/AssessmentForm';
import { AssessmentResultView } from '../components/AssessmentResultView';
import { SAMPLE_SCENARIOS } from '../fixtures/sampleScenarios';
import type {
  CircularityPathway,
  DeviceAssessmentRequest,
  DeviceAssessmentResponse,
} from '../types/assessment';

const MOCK_HEALTH_OK = { status: 'ok', application: 'E-CyclePilot', version: '0.1.0' };

function buildMockResponse(
  pathway: CircularityPathway,
  overrides?: Partial<DeviceAssessmentResponse>,
): DeviceAssessmentResponse {
  return {
    success: true,
    statusCode: 200,
    assessmentId: `ECP-PARITY-${pathway}`,
    timestamp: '2026-10-10T00:00:00.000Z',
    primaryPathway: pathway,
    primaryRationale: `Canonical rationale for pathway ${pathway}.`,
    safetyAlert: {
      active: pathway === 'SPECIAL_HANDLING',
      hazardLevel: pathway === 'SPECIAL_HANDLING' ? 'CRITICAL' : 'NONE',
      hazardsIdentified:
        pathway === 'SPECIAL_HANDLING' ? ['Confirmed bulging lithium-ion battery'] : [],
      mandatoryContainmentInstructions:
        pathway === 'SPECIAL_HANDLING'
          ? ['Quarantine immediately in a fire-rated LiPo safety container']
          : [],
    },
    complianceFlags: {
      dataSanitizationRequired: false,
      hazardousTransportRestricted: pathway === 'SPECIAL_HANDLING',
    },
    eligiblePathways: [pathway],
    disqualifiedPathways:
      pathway === 'SPECIAL_HANDLING'
        ? ['REUSE', 'REPAIR', 'REFURBISHMENT', 'COMPONENT_RECOVERY', 'FORMAL_RECYCLING']
        : ['SPECIAL_HANDLING'],
    pathwayComparison: [
      {
        pathway,
        status: 'RECOMMENDED',
        score: 95,
        rationale: `Primary recommended pathway: ${pathway}`,
      },
      {
        pathway: pathway === 'REUSE' ? 'REFURBISHMENT' : 'REUSE',
        status: 'ELIGIBLE',
        score: 75,
        rationale: 'Viable secondary pathway alternative.',
      },
      {
        pathway: pathway === 'SPECIAL_HANDLING' ? 'REPAIR' : 'SPECIAL_HANDLING',
        status: 'DISQUALIFIED',
        score: 0,
        rationale: 'Disqualified under current evaluation gates.',
        disqualificationReason: 'Criteria not met.',
      },
    ],
    reasonCodes: [`RULE_${pathway}_TRIGGERED`],
    actionChecklist: [`Follow execution checklist for ${pathway}`],
    harvestManifest: [],
    financialSummary: {
      status: 'CALCULATED',
      currency: 'USD',
      estimatedMarketValue: 300.0,
      estimatedRepairCost: 50.0,
      costRatioPercent: 16.7,
      netRepairMargin: 250.0,
      salvageYieldTotal: 75.0,
      notes: 'Feasibility calculated successfully.',
    },
    uncertaintyWarnings: [],
    ...overrides,
  };
}

describe('Frontend-Backend Contract Parity & Regression Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Exact Request Serialization
  // --------------------------------------------------------------------------
  it('serializes exact payload without corrupting types, nulls, or modular components', async () => {
    let capturedBody: string | undefined;

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_HEALTH_OK,
      } as Response)
      .mockImplementationOnce(async (_url, init) => {
        capturedBody = init?.body as string;
        return {
          ok: true,
          status: 200,
          json: async () => buildMockResponse('REUSE'),
        } as Response;
      });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });

    // Populate explicit fields
    fireEvent.change(screen.getByLabelText(/Device Category/i), {
      target: { value: 'SMARTPHONE' },
    });
    fireEvent.change(screen.getByLabelText(/Manufacturer \/ Brand/i), {
      target: { value: 'Apple' },
    });
    fireEvent.change(screen.getByLabelText(/Model Identifier/i), {
      target: { value: 'iPhone 13' },
    });
    fireEvent.change(screen.getByLabelText(/Hardware Age/i), {
      target: { value: '2.5' },
    });

    // Add modular component
    fireEvent.click(screen.getByTestId('add-component-btn'));
    const compName = screen.getByPlaceholderText(/e.g., 16GB DDR4 RAM/i);
    fireEvent.change(compName, { target: { value: 'Camera Module' } });

    // Submit form
    fireEvent.click(screen.getByTestId('assess-submit-btn'));

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });

    const parsed = JSON.parse(capturedBody!);
    expect(parsed.device.category).toBe('SMARTPHONE');
    expect(parsed.device.brand).toBe('Apple');
    expect(parsed.device.model).toBe('iPhone 13');
    expect(parsed.device.ageYears).toBe(2.5);
    expect(parsed.modularComponents).toHaveLength(1);
    expect(parsed.modularComponents[0].name).toBe('Camera Module');
    expect(parsed.modularComponents[0].functional).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. Synthetic Scenarios Contract Validity
  // --------------------------------------------------------------------------
  it('validates contract schemas for all six synthetic scenarios', () => {
    expect(SAMPLE_SCENARIOS).toHaveLength(6);

    const validCategories = ['LAPTOP', 'SMARTPHONE', 'DESKTOP', 'TABLET'];
    const validPowerStates = ['POWERS_ON', 'INTERMITTENT', 'NO_POWER'];
    const validBootStates = ['OS_BOOTS', 'POST_PASS', 'BOOT_LOOP', 'DEAD'];
    const validChassis = ['INTACT', 'SCRATCHED', 'WARPED', 'CRACKED', 'DAMAGED'];

    for (const scenario of SAMPLE_SCENARIOS) {
      const p = scenario.payload;
      expect(p.device).toBeDefined();
      expect(validCategories).toContain(p.device.category);
      expect(typeof p.device.brand).toBe('string');
      expect(p.device.ageYears).toBeGreaterThanOrEqual(0);

      expect(p.physicalCondition).toBeDefined();
      expect(validChassis).toContain(p.physicalCondition.chassisIntegrity);
      expect(typeof p.physicalCondition.liquidDamage).toBe('boolean');

      expect(p.functionalStatus).toBeDefined();
      expect(validPowerStates).toContain(p.functionalStatus.powerState);
      expect(validBootStates).toContain(p.functionalStatus.bootState);

      if (p.battery?.healthPercentage !== undefined && p.battery?.healthPercentage !== null) {
        expect(p.battery.healthPercentage).toBeGreaterThanOrEqual(0);
        expect(p.battery.healthPercentage).toBeLessThanOrEqual(100);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3. Rendering All Six Primary Pathways
  // --------------------------------------------------------------------------
  const allPathways: CircularityPathway[] = [
    'SPECIAL_HANDLING',
    'REUSE',
    'REPAIR',
    'REFURBISHMENT',
    'COMPONENT_RECOVERY',
    'FORMAL_RECYCLING',
  ];

  it.each(allPathways)('renders primary recommendation for pathway "%s"', (pathway) => {
    const mock = buildMockResponse(pathway);
    render(<AssessmentResultView result={mock} onStartNewAssessment={() => {}} />);

    const badge = screen.getByTestId('primary-pathway-badge');
    expect(badge).toHaveTextContent(pathway);
    expect(screen.getByTestId('primary-rationale')).toHaveTextContent(mock.primaryRationale);
  });

  // --------------------------------------------------------------------------
  // 4. Actual Backend Response Pathway Comparison Status Values
  // --------------------------------------------------------------------------
  it('correctly maps and displays backend comparison status pills (RECOMMENDED, ELIGIBLE, DISQUALIFIED)', () => {
    const mock = buildMockResponse('REUSE');
    render(<AssessmentResultView result={mock} onStartNewAssessment={() => {}} />);

    const recommendedPill = screen.getByText('RECOMMENDED');
    expect(recommendedPill).toBeInTheDocument();
    expect(recommendedPill).toHaveClass('status-pill', 'recommended');

    const eligiblePill = screen.getByText('ELIGIBLE');
    expect(eligiblePill).toBeInTheDocument();
    expect(eligiblePill).toHaveClass('status-pill', 'eligible');

    const disqualifiedPill = screen.getByText('DISQUALIFIED');
    expect(disqualifiedPill).toBeInTheDocument();
    expect(disqualifiedPill).toHaveClass('status-pill', 'disqualified');
  });

  // --------------------------------------------------------------------------
  // 5. Null Financial Values Never Appear as Zero
  // --------------------------------------------------------------------------
  it('renders null financial values as "Not available" and never as $0.00 or 0.0%', () => {
    const mock = buildMockResponse('COMPONENT_RECOVERY', {
      financialSummary: {
        status: 'DATA_UNAVAILABLE',
        currency: 'USD',
        estimatedMarketValue: null,
        estimatedRepairCost: null,
        costRatioPercent: null,
        netRepairMargin: null,
        salvageYieldTotal: null,
        notes: 'Financial metrics not supplied.',
      },
    });

    render(<AssessmentResultView result={mock} onStartNewAssessment={() => {}} />);

    expect(screen.getByTestId('metric-market-value')).toHaveTextContent('Not available');
    expect(screen.getByTestId('metric-repair-cost')).toHaveTextContent('Not available');
    expect(screen.getByTestId('metric-cost-ratio')).toHaveTextContent('Not available');
    expect(screen.getByTestId('metric-net-margin')).toHaveTextContent('Not available');
    expect(
      screen.getByTestId(
        'metric-salvageYieldTotal' in screen ? 'metric-salvageYieldTotal' : 'metric-salvage-yield',
      ),
    ).toHaveTextContent('Not available');

    // Strict invariant: no false "$0.00" displayed
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 6. Unknown Battery State Handling
  // --------------------------------------------------------------------------
  it('sets battery health to null and disables input when explicitly unknown is checked', () => {
    let currentData: DeviceAssessmentRequest = {
      device: { category: 'LAPTOP', brand: 'Dell', ageYears: 2.0 },
      physicalCondition: {
        chassisIntegrity: 'INTACT',
        screenCondition: 'INTACT',
        liquidDamage: false,
        thermalDamage: 'NONE',
        chemicalHazard: 'NONE',
      },
      functionalStatus: {
        powerState: 'POWERS_ON',
        bootState: 'OS_BOOTS',
        displayState: 'WORKING',
      },
      battery: {
        present: true,
        healthPercentage: 80,
      },
    };

    const handleChange = (updated: DeviceAssessmentRequest) => {
      currentData = updated;
    };

    const { rerender } = render(
      <AssessmentForm
        formData={currentData}
        onChange={handleChange}
        onSubmit={(e) => e.preventDefault()}
        onReset={() => {}}
        isLoading={false}
      />,
    );

    const toggle = screen.getByRole('checkbox', { name: /explicitly unknown/i });
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);

    expect(currentData.battery?.healthPercentage).toBeNull();

    // Rerender with updated data
    rerender(
      <AssessmentForm
        formData={currentData}
        onChange={handleChange}
        onSubmit={(e) => e.preventDefault()}
        onReset={() => {}}
        isLoading={false}
      />,
    );

    const healthInput = screen.getByLabelText(/Health Percentage/i);
    expect(healthInput).toBeDisabled();
    expect(screen.getByText(/Battery metric unknown/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 7. Safety Warning Dominance Rendering
  // --------------------------------------------------------------------------
  it('renders critical safety banner prominently when safetyAlert is active', () => {
    const mock = buildMockResponse('SPECIAL_HANDLING', {
      safetyAlert: {
        active: true,
        hazardLevel: 'CRITICAL',
        hazardsIdentified: ['Confirmed bulging pouch cell', 'Thermal runaway risk'],
        mandatoryContainmentInstructions: [
          'Quarantine unit immediately in a fire-rated LiPo safety container',
          'Do NOT connect AC power',
        ],
      },
    });

    render(<AssessmentResultView result={mock} onStartNewAssessment={() => {}} />);

    const alertBanner = screen.getByTestId('safety-alert-banner');
    expect(alertBanner).toBeInTheDocument();
    expect(alertBanner).toHaveClass('critical-alert');
    expect(screen.getByText(/Hazard Level: CRITICAL/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmed bulging pouch cell/i)).toBeInTheDocument();
    expect(screen.getByText(/Quarantine unit immediately/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 8. Sanitization Requirement Rendering (NIST SP 800-88 Rev. 2)
  // --------------------------------------------------------------------------
  it('renders NIST SP 800-88 Rev. 2 guidance and advisory when sanitization is required', () => {
    const mock = buildMockResponse('REUSE', {
      complianceFlags: {
        dataSanitizationRequired: true,
        hazardousTransportRestricted: false,
      },
      actionChecklist: ['Perform certified storage wipe (NIST SP 800-88 Rev. 2) before handover'],
      reasonCodes: ['DATA_SANITIZATION_REQUIRED'],
    });

    render(<AssessmentResultView result={mock} onStartNewAssessment={() => {}} />);

    expect(screen.getByTestId('sanitization-flag')).toHaveTextContent(/Sanitization Required/i);
    expect(
      screen.getByText(/Perform certified storage wipe \(NIST SP 800-88 Rev. 2\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/DATA_SANITIZATION_REQUIRED/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 9. API Validation Error Rendering (HTTP 400 with logical contradiction)
  // --------------------------------------------------------------------------
  it('renders backend validation error message when server returns HTTP 400', async () => {
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
          error: 'LOGICAL_CONTRADICTION',
          message: 'Contradictory telemetry: device cannot boot OS while powerState is NO_POWER.',
        }),
      } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });

    fireEvent.click(screen.getByTestId('assess-submit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Contradictory telemetry: device cannot boot OS while powerState is NO_POWER/i,
      );
    });

    // Ensures error response does not render as successful assessment
    expect(screen.queryByTestId('assessment-results')).not.toBeInTheDocument();
  });
});
