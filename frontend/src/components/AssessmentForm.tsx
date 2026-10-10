import React, { useState } from 'react';
import type {
  BatterySwellingState,
  ChassisIntegrity,
  ChemicalHazard,
  DeviceAssessmentRequest,
  DeviceCategory,
  DisplayState,
  ModularComponentItem,
  PowerState,
  BootState,
  StorageMediaType,
  SanitizationState,
  ThermalBehavior,
  ThermalDamage,
} from '../types/assessment';
import { SAMPLE_SCENARIOS } from '../fixtures/sampleScenarios';

export interface AssessmentFormProps {
  formData: DeviceAssessmentRequest;
  onChange: (updated: DeviceAssessmentRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  isLoading: boolean;
  validationError?: string | null;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onReset,
  isLoading,
  validationError,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [batteryUnknown, setBatteryUnknown] = useState<boolean>(
    formData.battery?.present === true &&
      (formData.battery.healthPercentage === null ||
        formData.battery.healthPercentage === undefined),
  );

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scenarioId = e.target.value;
    setSelectedScenarioId(scenarioId);
    if (!scenarioId) return;

    const found = SAMPLE_SCENARIOS.find((s) => s.id === scenarioId);
    if (found) {
      // Deep clone payload to prevent mutating scenario constants
      const cloned: DeviceAssessmentRequest = JSON.parse(JSON.stringify(found.payload));
      const isUnknown =
        cloned.battery?.present === true &&
        (cloned.battery.healthPercentage === null || cloned.battery.healthPercentage === undefined);
      setBatteryUnknown(isUnknown);
      onChange(cloned);
    }
  };

  const handleDeviceChange = (field: string, value: unknown) => {
    onChange({
      ...formData,
      device: {
        ...formData.device,
        [field]: value,
      },
    });
  };

  const handlePhysicalChange = (field: string, value: unknown) => {
    onChange({
      ...formData,
      physicalCondition: {
        ...formData.physicalCondition,
        [field]: value,
      },
    });
  };

  const handleFunctionalChange = (field: string, value: unknown) => {
    onChange({
      ...formData,
      functionalStatus: {
        ...formData.functionalStatus,
        [field]: value,
      },
    });
  };

  const handleBatteryChange = (field: string, value: unknown) => {
    onChange({
      ...formData,
      battery: {
        present: formData.battery?.present ?? true,
        ...formData.battery,
        [field]: value,
      },
    });
  };

  const handleBatteryUnknownToggle = (checked: boolean) => {
    setBatteryUnknown(checked);
    onChange({
      ...formData,
      battery: {
        present: formData.battery?.present ?? true,
        ...formData.battery,
        healthPercentage: checked ? null : 80,
      },
    });
  };

  const handleStorageChange = (field: string, value: unknown) => {
    onChange({
      ...formData,
      storage: {
        mediaType: formData.storage?.mediaType ?? 'NVME_SSD',
        sanitizationState: formData.storage?.sanitizationState ?? 'UNENCRYPTED_DATA_PRESENT',
        ...formData.storage,
        [field]: value,
      },
    });
  };

  const handleEconomicsChange = (field: string, rawVal: string) => {
    const val = rawVal.trim() === '' ? null : Number(rawVal);
    onChange({
      ...formData,
      economics: {
        ...formData.economics,
        [field]: isNaN(val as number) ? null : val,
      },
    });
  };

  const handleAddComponent = () => {
    const current = formData.modularComponents || [];
    const newComponent: ModularComponentItem = {
      name: `Component ${current.length + 1}`,
      functional: true,
      salvageValue: null,
    };
    onChange({
      ...formData,
      modularComponents: [...current, newComponent],
    });
  };

  const handleRemoveComponent = (index: number) => {
    const current = formData.modularComponents || [];
    const updated = current.filter((_, idx) => idx !== index);
    onChange({
      ...formData,
      modularComponents: updated,
    });
  };

  const handleUpdateComponent = (
    index: number,
    field: keyof ModularComponentItem,
    value: unknown,
  ) => {
    const current = [...(formData.modularComponents || [])];
    const existing = current[index];
    if (!existing) return;
    current[index] = {
      ...existing,
      [field]: value,
    } as ModularComponentItem;
    onChange({
      ...formData,
      modularComponents: current,
    });
  };

  // Contradiction detection for non-blocking client hint
  const hasTelemetryContradiction =
    formData.functionalStatus?.powerState === 'NO_POWER' &&
    (formData.functionalStatus?.bootState === 'OS_BOOTS' ||
      formData.functionalStatus?.bootState === 'POST_PASS');

  return (
    <form className="assessment-form" onSubmit={onSubmit} noValidate>
      {/* Sample Scenario Preset Selector */}
      <div className="scenario-selector-banner">
        <div className="selector-group">
          <label htmlFor="sample-scenario-select" className="selector-label">
            Load Synthetic Assessment Scenario
          </label>
          <select
            id="sample-scenario-select"
            className="form-select scenario-select"
            value={selectedScenarioId}
            onChange={handleScenarioChange}
            disabled={isLoading}
          >
            <option value="">-- Select a synthetic scenario preset --</option>
            {SAMPLE_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name} &bull; Expected: {scenario.expectedPathway}
              </option>
            ))}
          </select>
        </div>
        <p className="scenario-disclaimer">
          Synthetic demo presets derived from test plan fixtures (ATP-ECP-001). Loading a preset
          populates the inputs below without submitting.
        </p>
      </div>

      {validationError && (
        <div className="form-alert error-alert" role="alert" aria-live="assertive">
          <strong>Validation Error:</strong> {validationError}
        </div>
      )}

      {hasTelemetryContradiction && (
        <div className="form-alert warning-alert" role="alert">
          <strong>Contradictory Telemetry:</strong> Device power state is set to{' '}
          <code>NO_POWER</code> while boot state indicates OS boots or POST passes. The backend
          decision engine will strictly reject this contradiction with HTTP 400.
        </div>
      )}

      {/* Section A: Device Information */}
      <fieldset className="form-section">
        <legend className="section-legend">Section A: Device Information</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="device-category" className="field-label">
              Device Category <span className="required-mark">*</span>
            </label>
            <select
              id="device-category"
              className="form-select"
              value={formData.device?.category || 'LAPTOP'}
              onChange={(e) => handleDeviceChange('category', e.target.value as DeviceCategory)}
              required
              disabled={isLoading}
            >
              <option value="LAPTOP">Laptop</option>
              <option value="SMARTPHONE">Smartphone</option>
              <option value="DESKTOP">Desktop Workstation</option>
              <option value="TABLET">Tablet</option>
            </select>
            <span className="field-help">Supported circularity device classifications</span>
          </div>

          <div className="form-field">
            <label htmlFor="device-brand" className="field-label">
              Manufacturer / Brand <span className="required-mark">*</span>
            </label>
            <input
              id="device-brand"
              type="text"
              className="form-input"
              value={formData.device?.brand || ''}
              onChange={(e) => handleDeviceChange('brand', e.target.value)}
              placeholder="e.g., Lenovo, Dell, Apple, HP"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="device-model" className="field-label">
              Model Identifier
            </label>
            <input
              id="device-model"
              type="text"
              className="form-input"
              value={formData.device?.model || ''}
              onChange={(e) => handleDeviceChange('model', e.target.value)}
              placeholder="e.g., ThinkPad T14 Gen 2"
              disabled={isLoading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="device-age" className="field-label">
              Hardware Age (Years) <span className="required-mark">*</span>
            </label>
            <input
              id="device-age"
              type="number"
              step="0.1"
              min="0"
              max="50"
              className="form-input"
              value={formData.device?.ageYears ?? 0}
              onChange={(e) =>
                handleDeviceChange('ageYears', Math.max(0, parseFloat(e.target.value) || 0))
              }
              required
              disabled={isLoading}
            />
            <span className="field-help">
              Age &ge; 10.0 years triggers architectural obsolescence recycling
            </span>
          </div>
        </div>
      </fieldset>

      {/* Section B: Physical Condition */}
      <fieldset className="form-section">
        <legend className="section-legend">Section B: Physical Condition</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="chassis-integrity" className="field-label">
              Chassis Integrity <span className="required-mark">*</span>
            </label>
            <select
              id="chassis-integrity"
              className="form-select"
              value={formData.physicalCondition?.chassisIntegrity || 'INTACT'}
              onChange={(e) =>
                handlePhysicalChange('chassisIntegrity', e.target.value as ChassisIntegrity)
              }
              required
              disabled={isLoading}
            >
              <option value="INTACT">Intact (Pristine structure)</option>
              <option value="SCRATCHED">Scratched (Cosmetic wear)</option>
              <option value="WARPED">Warped (Chassis deformation)</option>
              <option value="CRACKED">Cracked (Structural fracture)</option>
              <option value="DAMAGED">Damaged (Severe physical compromise)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="screen-condition" className="field-label">
              Screen Condition <span className="required-mark">*</span>
            </label>
            <select
              id="screen-condition"
              className="form-select"
              value={formData.physicalCondition?.screenCondition || 'INTACT'}
              onChange={(e) => handlePhysicalChange('screenCondition', e.target.value)}
              required
              disabled={isLoading}
            >
              <option value="INTACT">Intact (No fractures or pixel defects)</option>
              <option value="CRACKED_FUNCTIONAL">
                Cracked but Functional (Glass damaged, panel responds)
              </option>
              <option value="CRACKED_NO_DISPLAY">Cracked and Dead (No video output)</option>
              <option value="SHATTERED">Shattered (Severe glass fragmentation)</option>
              <option value="DELAMINATING">Delaminating (Separation from frame)</option>
              <option value="NOT_APPLICABLE">Not Applicable (Headless desktop)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="liquid-damage" className="field-label">
              Liquid Damage Indicator <span className="required-mark">*</span>
            </label>
            <select
              id="liquid-damage"
              className="form-select"
              value={formData.physicalCondition?.liquidDamage ? 'true' : 'false'}
              onChange={(e) => handlePhysicalChange('liquidDamage', e.target.value === 'true')}
              required
              disabled={isLoading}
            >
              <option value="false">Negative (LDI white / no moisture evidence)</option>
              <option value="true">Positive (LDI tripped / corrosion detected)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="thermal-damage" className="field-label">
              Thermal Damage State <span className="required-mark">*</span>
            </label>
            <select
              id="thermal-damage"
              className="form-select"
              value={formData.physicalCondition?.thermalDamage || 'NONE'}
              onChange={(e) =>
                handlePhysicalChange('thermalDamage', e.target.value as ThermalDamage)
              }
              required
              disabled={isLoading}
            >
              <option value="NONE">None (Clean thermal profile)</option>
              <option value="SCORCHED">Scorched (Surface heat discolouration)</option>
              <option value="BURNT">Burnt (Charred casing or PCB burn)</option>
            </select>
          </div>

          <div className="form-field full-width">
            <label htmlFor="chemical-hazard" className="field-label">
              Chemical / Environmental Hazard <span className="required-mark">*</span>
            </label>
            <select
              id="chemical-hazard"
              className="form-select"
              value={formData.physicalCondition?.chemicalHazard || 'NONE'}
              onChange={(e) =>
                handlePhysicalChange('chemicalHazard', e.target.value as ChemicalHazard)
              }
              required
              disabled={isLoading}
            >
              <option value="NONE">None (No toxic chemical release)</option>
              <option value="LEAKING_BATTERY_ELECTROLYTE">
                Leaking Battery Electrolyte (Pungent / corrosive liquid)
              </option>
              <option value="BROKEN_MERCURY_LAMP">
                Broken Mercury Cold-Cathode Lamp (CCFL backlight fracture)
              </option>
            </select>
            <span className="field-help">
              Triggers immediate SPECIAL_HANDLING containment under UN 3480/3481 regulations
            </span>
          </div>
        </div>
      </fieldset>

      {/* Section C: Functional Status */}
      <fieldset className="form-section">
        <legend className="section-legend">Section C: Functional Status</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="power-state" className="field-label">
              Power Delivery State <span className="required-mark">*</span>
            </label>
            <select
              id="power-state"
              className="form-select"
              value={formData.functionalStatus?.powerState || 'POWERS_ON'}
              onChange={(e) => handleFunctionalChange('powerState', e.target.value as PowerState)}
              required
              disabled={isLoading}
            >
              <option value="POWERS_ON">Powers On (Steady DC rail power)</option>
              <option value="INTERMITTENT">Intermittent (Power cycles / unstable rail)</option>
              <option value="NO_POWER">No Power (Complete board power failure)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="boot-state" className="field-label">
              Motherboard Boot State <span className="required-mark">*</span>
            </label>
            <select
              id="boot-state"
              className="form-select"
              value={formData.functionalStatus?.bootState || 'OS_BOOTS'}
              onChange={(e) => handleFunctionalChange('bootState', e.target.value as BootState)}
              required
              disabled={isLoading}
            >
              <option value="OS_BOOTS">OS Boots (Loads operating system)</option>
              <option value="POST_PASS">POST Pass (Passes BIOS/UEFI diagnostic only)</option>
              <option value="BOOT_LOOP">Boot Loop (Resets during initialization)</option>
              <option value="DEAD">Dead (No BIOS/UEFI execution)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="display-state" className="field-label">
              Display / Output State <span className="required-mark">*</span>
            </label>
            <select
              id="display-state"
              className="form-select"
              value={formData.functionalStatus?.displayState || 'WORKING'}
              onChange={(e) =>
                handleFunctionalChange('displayState', e.target.value as DisplayState)
              }
              required
              disabled={isLoading}
            >
              <option value="WORKING">Working (Clear image output)</option>
              <option value="CRACKED_FUNCTIONAL">Cracked / Functional image</option>
              <option value="CRACKED_NO_DISPLAY">Cracked / No Video Signal</option>
              <option value="ARTIFACTS">Artifacts / GPU Lines</option>
              <option value="NOT_APPLICABLE">Not Applicable (External display system)</option>
              <option value="UNKNOWN">Unknown / Untested</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Section D: Battery Condition */}
      <fieldset className="form-section">
        <legend className="section-legend">Section D: Battery Condition</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="battery-present" className="field-label">
              Internal Battery Present <span className="required-mark">*</span>
            </label>
            <select
              id="battery-present"
              className="form-select"
              value={formData.battery?.present !== false ? 'true' : 'false'}
              onChange={(e) => handleBatteryChange('present', e.target.value === 'true')}
              required
              disabled={isLoading}
            >
              <option value="true">Yes (Battery installed)</option>
              <option value="false">No (Desktop or battery removed)</option>
            </select>
          </div>

          {formData.battery?.present !== false ? (
            <>
              <div className="form-field">
                <label htmlFor="battery-health" className="field-label">
                  Health Percentage (0 - 100%)
                </label>
                <div className="input-with-checkbox">
                  <input
                    id="battery-health"
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={batteryUnknown ? '' : (formData.battery?.healthPercentage ?? 80)}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                      handleBatteryChange('healthPercentage', val);
                    }}
                    placeholder="e.g., 85"
                    disabled={batteryUnknown || isLoading}
                  />
                  <label className="checkbox-label inline-checkbox">
                    <input
                      id="battery-unknown-toggle"
                      type="checkbox"
                      checked={batteryUnknown}
                      onChange={(e) => handleBatteryUnknownToggle(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span>Explicitly unknown / not tested</span>
                  </label>
                </div>
                <span className="field-help">
                  {batteryUnknown
                    ? 'Battery metric unknown. Triggers REFURBISHMENT diagnosis warning.'
                    : 'Degraded battery (<80%) requires cell replacement prior to deployment.'}
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="battery-swelling" className="field-label">
                  Swelling / Deformation State <span className="required-mark">*</span>
                </label>
                <select
                  id="battery-swelling"
                  className="form-select"
                  value={formData.battery?.swellingState || 'NONE'}
                  onChange={(e) =>
                    handleBatteryChange('swellingState', e.target.value as BatterySwellingState)
                  }
                  required
                  disabled={isLoading}
                >
                  <option value="NONE">None (Flat lithium cell)</option>
                  <option value="SUSPECTED">Suspected (Chassis pop / seam lift)</option>
                  <option value="CONFIRMED_BULGING">
                    Confirmed Bulging (Swollen lithium pouch)
                  </option>
                </select>
                <span className="field-help">
                  Any swelling routes unconditionally to SPECIAL_HANDLING
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="battery-thermal" className="field-label">
                  Thermal Charging Profile <span className="required-mark">*</span>
                </label>
                <select
                  id="battery-thermal"
                  className="form-select"
                  value={formData.battery?.thermalBehavior || 'NORMAL'}
                  onChange={(e) =>
                    handleBatteryChange('thermalBehavior', e.target.value as ThermalBehavior)
                  }
                  required
                  disabled={isLoading}
                >
                  <option value="NORMAL">Normal (Operating within ambient temperatures)</option>
                  <option value="OVERHEATING">Overheating (Thermal runaway threshold risk)</option>
                </select>
              </div>
            </>
          ) : (
            <div className="form-field full-width">
              <p className="field-help static-note">
                No battery installed. Battery swelling and degradation rules are bypassed.
              </p>
            </div>
          )}
        </div>
      </fieldset>

      {/* Section E: Storage and Data Privacy */}
      <fieldset className="form-section">
        <legend className="section-legend">Section E: Storage & Data Privacy</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="storage-media" className="field-label">
              Storage Media Architecture <span className="required-mark">*</span>
            </label>
            <select
              id="storage-media"
              className="form-select"
              value={formData.storage?.mediaType || 'NVME_SSD'}
              onChange={(e) => handleStorageChange('mediaType', e.target.value as StorageMediaType)}
              required
              disabled={isLoading}
            >
              <option value="NVME_SSD">NVMe M.2 Solid State Drive</option>
              <option value="SATA_SSD">2.5" SATA Solid State Drive</option>
              <option value="HDD">Mechanical Hard Disk Drive</option>
              <option value="EMMC_SOLDERED">eMMC / Soldered Flash Storage</option>
              <option value="REMOVABLE_CARD">MicroSD / Removable Storage</option>
              <option value="NO_STORAGE">No Storage Media Present</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="sanitization-state" className="field-label">
              Media Sanitization State <span className="required-mark">*</span>
            </label>
            <select
              id="sanitization-state"
              className="form-select"
              value={formData.storage?.sanitizationState || 'VERIFIED_WIPED'}
              onChange={(e) =>
                handleStorageChange('sanitizationState', e.target.value as SanitizationState)
              }
              required
              disabled={isLoading}
            >
              <option value="VERIFIED_WIPED">Verified Wiped (Zeroed / Sanitized)</option>
              <option value="ENCRYPTED_LOCKED">
                Encrypted & Locked (BitLocker/FileVault key unknown)
              </option>
              <option value="UNENCRYPTED_DATA_PRESENT">
                Unencrypted Data Present (Active filesystem)
              </option>
              <option value="DAMAGED_PHYSICALLY">
                Physically Damaged (Non-readable platter/flash)
              </option>
            </select>
          </div>
        </div>

        <div className="sanitization-guidance-note">
          <strong>NIST SP 800-88 Rev. 2 Assessment Notice:</strong> E-CyclePilot evaluates whether
          media sanitization is advised prior to redeployment. It does not perform disk wiping,
          validate sanitization operations, or issue certificates of destruction.
        </div>
      </fieldset>

      {/* Section F: Modular Components & Financial Estimates */}
      <fieldset className="form-section">
        <legend className="section-legend">Section F: Modular Components & Economics</legend>

        <div className="sub-section">
          <div className="sub-section-header">
            <h3 className="sub-section-title">Modular Component Manifest</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddComponent}
              disabled={isLoading}
              data-testid="add-component-btn"
            >
              + Add Modular Component
            </button>
          </div>

          {formData.modularComponents && formData.modularComponents.length > 0 ? (
            <div className="components-table-container">
              <table className="components-table">
                <thead>
                  <tr>
                    <th>Component Name</th>
                    <th>Functional State</th>
                    <th>Salvage Value (USD, Optional)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.modularComponents.map((comp, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          value={comp.name}
                          onChange={(e) => handleUpdateComponent(idx, 'name', e.target.value)}
                          placeholder="e.g., 16GB DDR4 RAM, 512GB NVMe SSD"
                          required
                          disabled={isLoading}
                        />
                      </td>
                      <td>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={comp.functional}
                            onChange={(e) =>
                              handleUpdateComponent(idx, 'functional', e.target.checked)
                            }
                            disabled={isLoading}
                          />
                          <span>{comp.functional ? 'Functional' : 'Defective'}</span>
                        </label>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          value={comp.salvageValue ?? ''}
                          onChange={(e) => {
                            const val =
                              e.target.value.trim() === '' ? null : parseFloat(e.target.value);
                            handleUpdateComponent(
                              idx,
                              'salvageValue',
                              isNaN(val as number) ? null : val,
                            );
                          }}
                          placeholder="Leave blank if unknown"
                          disabled={isLoading}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveComponent(idx)}
                          disabled={isLoading}
                          aria-label={`Remove component ${comp.name}`}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-sub-state">
              No modular subcomponents recorded. Click &ldquo;+ Add Modular Component&rdquo; to
              catalog recoverable RAM, SSD, GPU, or power assemblies.
            </p>
          )}
        </div>

        <div className="sub-section">
          <h3 className="sub-section-title">Economic Feasibility Inputs</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="market-value" className="field-label">
                Estimated Secondary Market Value (USD)
              </label>
              <input
                id="market-value"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.economics?.estimatedMarketValue ?? ''}
                onChange={(e) => handleEconomicsChange('estimatedMarketValue', e.target.value)}
                placeholder="Optional (e.g., 450.00)"
                disabled={isLoading}
              />
              <span className="field-help">
                Leave blank if unknown; will report DATA_UNAVAILABLE
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="repair-cost" className="field-label">
                Estimated Restoration / Repair Cost (USD)
              </label>
              <input
                id="repair-cost"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.economics?.estimatedRepairCost ?? ''}
                onChange={(e) => handleEconomicsChange('estimatedRepairCost', e.target.value)}
                placeholder="Optional (e.g., 85.00)"
                disabled={isLoading}
              />
              <span className="field-help">Evaluated against 70% economic threshold ceiling</span>
            </div>

            <div className="form-field">
              <label htmlFor="salvage-value" className="field-label">
                Aggregate Component Salvage Value (USD)
              </label>
              <input
                id="salvage-value"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.economics?.estimatedComponentSalvageValue ?? ''}
                onChange={(e) =>
                  handleEconomicsChange('estimatedComponentSalvageValue', e.target.value)
                }
                placeholder="Optional (e.g., 280.00)"
                disabled={isLoading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="scrap-weight" className="field-label">
                Scrap Weight (kg)
              </label>
              <input
                id="scrap-weight"
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                value={formData.economics?.scrapWeightKg ?? ''}
                onChange={(e) => handleEconomicsChange('scrapWeightKg', e.target.value)}
                placeholder="Optional (e.g., 2.1)"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Form Action Controls */}
      <div className="form-actions-bar">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={isLoading}
          data-testid="assess-submit-btn"
        >
          {isLoading ? (
            <span className="btn-loading-content">
              <span className="spinner" aria-hidden="true" />
              Evaluating Telemetry...
            </span>
          ) : (
            'Assess Device'
          )}
        </button>

        <button
          type="button"
          className="btn btn-outline btn-lg"
          onClick={onReset}
          disabled={isLoading}
          data-testid="assess-reset-btn"
        >
          Reset Form
        </button>
      </div>
    </form>
  );
};
