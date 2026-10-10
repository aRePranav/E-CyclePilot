import React, { useEffect, useState } from 'react';
import './styles.css';

export type ApiConnectionState = 'checking' | 'online' | 'offline';

export interface HealthData {
  status: string;
  application: string;
  version: string;
}

export const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ApiConnectionState>('checking');
  const [healthInfo, setHealthInfo] = useState<HealthData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/health`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data: HealthData = await response.json();
        if (isMounted) {
          if (data.status === 'ok') {
            setConnectionState('online');
            setHealthInfo(data);
          } else {
            setConnectionState('offline');
          }
        }
      } catch {
        if (isMounted) {
          setConnectionState('offline');
          setHealthInfo(null);
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="brand-group">
            <span className="brand-title">E-CyclePilot</span>
            <span className="brand-badge">Engine v0.1.0</span>
          </div>

          <div
            className={`connection-indicator ${connectionState}`}
            data-testid="connection-indicator"
            aria-live="polite"
          >
            <span className="status-dot" aria-hidden="true" />
            <span className="status-label">
              {connectionState === 'checking' && 'Checking connection'}
              {connectionState === 'online' && 'API online'}
              {connectionState === 'offline' && 'API unavailable'}
            </span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-section">
          <p className="hero-subtitle">AI-Powered E-Waste Recovery & Circularity Decision Engine</p>
          <h1 className="hero-title">E-CyclePilot</h1>
          <p className="hero-tagline">Give Every Device a Smarter Second Life.</p>
          <p className="hero-description">
            E-CyclePilot provides deterministic, reproducible triage for surplus and end-of-life
            electronics. Using verified physical telemetry, strict safety rules, and explainable
            decision logic, the engine classifies devices into appropriate recovery pathways without
            fabricating market estimates or environmental claims.
          </p>
        </section>

        <section className="invariants-section" aria-label="System Guiding Invariants">
          <div className="invariants-grid">
            <div className="invariant-card">
              <h2 className="invariant-title">Safety Dominance</h2>
              <p className="invariant-text">
                Thermal, chemical, and battery swelling hazards permanently override economic or
                resale incentives. Compromised lithium-ion cells route unconditionally to hazardous
                containment.
              </p>
            </div>

            <div className="invariant-card">
              <h2 className="invariant-title">Deterministic Explainability</h2>
              <p className="invariant-text">
                Every recommendation is 100% reproducible for identical validated inputs,
                accompanied by machine-readable reason codes and transparent disqualification
                rationale.
              </p>
            </div>

            <div className="invariant-card">
              <h2 className="invariant-title">Honest Evidence Handling</h2>
              <p className="invariant-text">
                Missing telemetry remains explicitly missing. The engine never hallucinates
                secondary market prices, repair quotes, carbon offsets, or component yields.
              </p>
            </div>
          </div>
        </section>

        <section className="pathways-section" aria-label="Circularity Pathways">
          <div className="section-header">
            <h2 className="section-title">Six Circularity Pathways</h2>
            <p className="section-description">
              Standardized disposition pathways applied systematically across all supported device
              categories.
            </p>
          </div>

          <div className="pathways-grid">
            <article className="pathway-card">
              <div className="pathway-card-header">
                <span className="pathway-name">SPECIAL_HANDLING</span>
                <span className="pathway-tag hazard">Hazardous Gate</span>
              </div>
              <p className="pathway-desc">
                Mandatory containment for devices with active hazards: swelling lithium cells,
                scorch marks, or chemical leakage.
              </p>
            </article>

            <article className="pathway-card">
              <div className="pathway-card-header">
                <span className="pathway-name">REUSE</span>
                <span className="pathway-tag circular">Highest Value</span>
              </div>
              <p className="pathway-desc">
                Direct secondary deployment or resale for fully operational hardware with healthy
                batteries and sanitized storage.
              </p>
            </article>

            <article className="pathway-card">
              <div className="pathway-card-header">
                <span className="pathway-name">REPAIR</span>
                <span className="pathway-tag circular">Restoration</span>
              </div>
              <p className="pathway-desc">
                Targeted restoration for isolated defects where the estimated repair cost does not
                exceed the 70% project heuristic.
              </p>
            </article>

            <article className="pathway-card">
              <div className="pathway-card-header">
                <span className="pathway-name">REFURBISHMENT</span>
                <span className="pathway-tag recovery">Reconditioning</span>
              </div>
              <p className="pathway-desc">
                Multi-point maintenance (battery replacement, OS re-imaging, cosmetic refresh) for
                devices with functional core boards.
              </p>
            </article>

            <article className="pathway-card">
              <div className="pathway-card-header">
                <span className="pathway-name">COMPONENT_RECOVERY</span>
                <span className="pathway-tag recovery">Cannibalization</span>
              </div>
              <p className="pathway-desc">
                Extraction of verified functional modular parts (RAM, storage, discrete GPUs) from
                non-repairable host chassis.
              </p>
            </article>

            <article className="pathway-card">
              <div className="pathway-card-header">
                <span className="pathway-name">FORMAL_RECYCLING</span>
                <span className="pathway-tag">Smelting</span>
              </div>
              <p className="pathway-desc">
                Certified mechanical shredding and material recovery for obsolete hardware (age &ge;
                10 years) or carcasses with zero harvestable components.
              </p>
            </article>
          </div>
        </section>

        <section className="status-panel" aria-label="System Diagnostics">
          <h2 className="status-panel-title">System Diagnostics</h2>
          <div className="status-panel-details">
            <p>
              Backend API Status:{' '}
              <strong>
                {connectionState === 'online' &&
                  `Connected (${healthInfo?.application} v${healthInfo?.version})`}
                {connectionState === 'checking' && 'Connecting to API endpoint...'}
                {connectionState === 'offline' &&
                  'Service currently unreachable at configured API URL'}
              </strong>
            </p>
            <p>
              Endpoint Target:{' '}
              <code>{import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/health</code>
            </p>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          E-CyclePilot &bull; Deterministic E-Waste Circularity Decision Engine &bull; Hackathon
          Scaffold v0.1.0
        </p>
      </footer>
    </div>
  );
};
