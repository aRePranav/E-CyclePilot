import React from 'react';
import type { CircularityPathway, DeviceAssessmentResponse } from '../types/assessment';

export interface AssessmentResultViewProps {
  result: DeviceAssessmentResponse;
  onStartNewAssessment: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  result,
  onStartNewAssessment,
}) => {
  const getPathwayClass = (pathway: CircularityPathway): string => {
    switch (pathway) {
      case 'SPECIAL_HANDLING':
        return 'pathway-badge-danger';
      case 'REUSE':
        return 'pathway-badge-success';
      case 'REPAIR':
        return 'pathway-badge-info';
      case 'REFURBISHMENT':
        return 'pathway-badge-primary';
      case 'COMPONENT_RECOVERY':
        return 'pathway-badge-warning';
      case 'FORMAL_RECYCLING':
        return 'pathway-badge-secondary';
      default:
        return 'pathway-badge-default';
    }
  };

  const formatCurrency = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatPercent = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Not available';
    return `${val.toFixed(1)}%`;
  };

  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'e-cyclepilot-assessment.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="assessment-results"
      aria-label="Device Assessment Results"
      data-testid="assessment-results"
    >
      <div className="results-header-bar">
        <div>
          <span className="results-kicker">Assessment Complete</span>
          <h2 className="results-title">Circularity Recommendation</h2>
          <span className="assessment-id-badge">ID: {result.assessmentId}</span>
        </div>
        <div className="results-actions">
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={handleDownloadJson}
            data-testid="download-json-btn"
          >
            Download Assessment (JSON)
          </button>
          <button type="button" className="btn btn-outline btn-md" onClick={onStartNewAssessment}>
            Start Another Assessment
          </button>
        </div>
      </div>

      {/* Safety Alert (Prominent Dominance Card) */}
      {result.safetyAlert.active ? (
        <div className="alert-card critical-alert" role="alert" data-testid="safety-alert-banner">
          <div className="alert-header">
            <span className="alert-tag">CRITICAL SAFETY ALERT</span>
            <span className="hazard-level-badge">
              Hazard Level: {result.safetyAlert.hazardLevel}
            </span>
          </div>
          <h3 className="alert-title">Mandatory Safety Containment Required</h3>
          <p className="alert-desc">
            Active safety hazards have been detected. Under UN 3480 / UN 3481 regulations and safety
            precedence invariants, commercial reuse and repair are strictly disqualified until
            dangerous fractions are contained.
          </p>

          <div className="alert-block">
            <strong>Identified Hazards:</strong>
            <ul className="alert-list">
              {result.safetyAlert.hazardsIdentified.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <div className="alert-block">
            <strong>Mandatory Containment Protocol:</strong>
            <ol className="alert-list numeric-list">
              {result.safetyAlert.mandatoryContainmentInstructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="alert-card safe-card">
          <span className="safe-tag">Safety Precedence Verified</span>
          <p className="safe-desc">
            Zero active thermal, chemical, or battery swelling hazards reported. Safe for handling
            and secondary processing.
          </p>
        </div>
      )}

      {/* Primary Recommendation Banner */}
      <div className="recommendation-hero-card">
        <div className="recommendation-header">
          <span className="recommendation-label">Primary Recommended Pathway</span>
          <span
            className={`pathway-badge-hero ${getPathwayClass(result.primaryPathway)}`}
            data-testid="primary-pathway-badge"
          >
            {result.primaryPathway}
          </span>
        </div>
        <p className="recommendation-rationale" data-testid="primary-rationale">
          {result.primaryRationale}
        </p>
      </div>

      {/* Pathway Comparison Matrix */}
      <div className="results-section">
        <h3 className="results-section-title">Comparative Pathway Evaluation Matrix</h3>
        <p className="results-section-desc">
          Systematic ranking across all six standardized circularity pathways evaluated by the
          deterministic engine.
        </p>
        <div className="comparison-grid">
          {result.pathwayComparison.map((item) => (
            <div
              key={item.pathway}
              className={`comparison-card status-${item.status.toLowerCase()}`}
              data-testid={`pathway-card-${item.pathway}`}
            >
              <div className="comparison-card-top">
                <span className="comparison-pathway-name">{item.pathway}</span>
                <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
              <div className="comparison-score-bar">
                <div className="score-fill" style={{ width: `${item.score}%` }} />
                <span className="score-text">Engine Score: {item.score}/100</span>
              </div>
              <p className="comparison-rationale">{item.rationale}</p>
              {item.disqualificationReason && (
                <p className="disqualification-notice">
                  <strong>Disqualification Factor:</strong> {item.disqualificationReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="results-section">
        <div className="section-title-with-badge">
          <h3 className="results-section-title">Financial Feasibility & Economic Yield</h3>
          <span
            className={`status-pill ${result.financialSummary.status === 'CALCULATED' ? 'eligible' : 'disqualified'}`}
            data-testid="financial-status-badge"
          >
            {result.financialSummary.status}
          </span>
        </div>
        <p className="results-section-desc">{result.financialSummary.notes}</p>

        <div className="financial-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Estimated Market Value</span>
            <span className="metric-value" data-testid="metric-market-value">
              {formatCurrency(result.financialSummary.estimatedMarketValue)}
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Estimated Restoration Cost</span>
            <span className="metric-value" data-testid="metric-repair-cost">
              {formatCurrency(result.financialSummary.estimatedRepairCost)}
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Cost-to-Value Ratio</span>
            <span className="metric-value" data-testid="metric-cost-ratio">
              {formatPercent(result.financialSummary.costRatioPercent)}
            </span>
            <span className="metric-subtext">Configured ceiling: &le; 70.0%</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Net Projected Repair Margin</span>
            <span className="metric-value" data-testid="metric-net-margin">
              {formatCurrency(result.financialSummary.netRepairMargin)}
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Harvested Salvage Yield Total</span>
            <span className="metric-value" data-testid="metric-salvage-yield">
              {formatCurrency(result.financialSummary.salvageYieldTotal)}
            </span>
          </div>
        </div>

        <p className="financial-disclaimer">
          Figures reflect unverified user-supplied estimates. E-CyclePilot does not guarantee market
          valuations or trade-in pricing.
        </p>
      </div>

      {/* Component Harvest Manifest */}
      <div className="results-section">
        <h3 className="results-section-title">Component Harvest Manifest</h3>
        <p className="results-section-desc">
          Modular subassemblies cataloged for parts harvesting prior to carcass disposition.
        </p>

        {result.harvestManifest && result.harvestManifest.length > 0 ? (
          <div className="components-table-container">
            <table className="components-table" data-testid="manifest-table">
              <thead>
                <tr>
                  <th>Component Name</th>
                  <th>Functional Status</th>
                  <th>Estimated Salvage Value</th>
                </tr>
              </thead>
              <tbody>
                {result.harvestManifest.map((comp, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{comp.name}</td>
                    <td>
                      <span
                        className={`status-pill ${comp.functional ? 'eligible' : 'disqualified'}`}
                      >
                        {comp.functional ? 'Verified Working' : 'Defective'}
                      </span>
                    </td>
                    <td>{formatCurrency(comp.salvageValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-sub-state">Zero modular subassemblies registered for harvest.</p>
        )}
      </div>

      {/* Compliance & Data Privacy */}
      <div className="results-section">
        <h3 className="results-section-title">Data Privacy & Hazardous Transport Compliance</h3>
        <div className="compliance-grid">
          <div className="compliance-card">
            <span className="compliance-card-title">NIST SP 800-88 Rev. 2 Data Sanitization</span>
            <div className="compliance-status">
              <span
                className={`status-pill ${result.complianceFlags.dataSanitizationRequired ? 'disqualified' : 'eligible'}`}
                data-testid="sanitization-flag"
              >
                {result.complianceFlags.dataSanitizationRequired
                  ? 'Sanitization Required'
                  : 'Not Required / Drive Wiped'}
              </span>
            </div>
            <p className="compliance-desc">
              {result.complianceFlags.dataSanitizationRequired
                ? 'Active or encrypted confidential media detected. Complete NIST Clear or Purge overwriting before redeployment.'
                : 'Storage media verified sanitized or absent.'}
            </p>
            <span className="compliance-notice">
              Notice: E-CyclePilot assesses sanitization requirement; it does not perform physical
              media wiping or issue certificates of destruction.
            </span>
          </div>

          <div className="compliance-card">
            <span className="compliance-card-title">
              UN 3480 / UN 3481 Hazardous Freight Status
            </span>
            <div className="compliance-status">
              <span
                className={`status-pill ${result.complianceFlags.hazardousTransportRestricted ? 'disqualified' : 'eligible'}`}
                data-testid="transport-flag"
              >
                {result.complianceFlags.hazardousTransportRestricted
                  ? 'Restricted Transport (Hazmat Only)'
                  : 'Standard Ground/Air Freight'}
              </span>
            </div>
            <p className="compliance-desc">
              {result.complianceFlags.hazardousTransportRestricted
                ? 'Air freight prohibited. Unit restricted to certified hazardous materials ground logistics.'
                : 'Unit is free from active thermal or chemical hazards for standard commercial transport.'}
            </p>
          </div>
        </div>
      </div>

      {/* Uncertainty Warnings */}
      {result.uncertaintyWarnings && result.uncertaintyWarnings.length > 0 && (
        <div className="results-section" data-testid="uncertainty-warnings-section">
          <h3 className="results-section-title">Telemetry Uncertainty Warnings</h3>
          <div className="alert-card warning-alert">
            <ul className="alert-list">
              {result.uncertaintyWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Reason Codes & Action Checklist */}
      <div className="results-section">
        <div className="two-col-grid">
          <div>
            <h3 className="results-section-title">Machine-Readable Reason Codes</h3>
            <ul className="reason-codes-list" data-testid="reason-codes-list">
              {result.reasonCodes.map((rc, idx) => (
                <li key={idx} className="reason-code-item">
                  <code>{rc}</code>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="results-section-title">Recommended Action Checklist</h3>
            <ul className="action-checklist" data-testid="action-checklist">
              {result.actionChecklist.map((item, idx) => (
                <li key={idx} className="checklist-item">
                  <span className="check-bullet" aria-hidden="true">
                    &bull;
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
