import React, { useState } from 'react';
import { TransferReferral, Doctor, MedicationDirective, FollowUpMilestone } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import { X, ShieldCheck, Plus, Trash2, Calendar, AlertTriangle, FileText, Pill } from 'lucide-react';

interface ReverseDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: TransferReferral;
  activeDoctor: Doctor;
  onDirectiveIssued: () => void;
}

export const ReverseDirectiveModal: React.FC<ReverseDirectiveModalProps> = ({
  isOpen,
  onClose,
  transfer,
  activeDoctor,
  onDirectiveIssued
}) => {
  const [procedureSummary, setProcedureSummary] = useState(
    `Successful surgical intervention & stabilization for ${transfer.patient.current_problem}. Procedure completed under sterile general theatre protocol with zero intraoperative complications.`
  );
  const [operativeNotes, setOperativeNotes] = useState(
    'Hemostasis secured. Specimen sent for histopathology. Subcutaneous fascia closed with 2-0 Vicryl; skin apposed with 3-0 Monocryl / staples. Patient extubated smoothly and recovered in post-anesthesia care.'
  );
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState(
    `Status post definitive management for ${transfer.patient.current_problem}. Clinically stable, afebrile, wound clean and dry.`
  );
  const [patientCondition, setPatientCondition] = useState<'Stable' | 'Guarded' | 'Ambulatory'>('Stable');

  const [medications, setMedications] = useState<MedicationDirective[]>([
    {
      name: 'Tab. Cefuroxime Axetil 500mg',
      dosage: '1 tablet twice daily',
      frequency: '12-hourly after meals',
      duration: '5 more days',
      instructions: 'Finish entire antibiotic course'
    },
    {
      name: 'Tab. Paracetamol 500mg',
      dosage: '1-2 tablets',
      frequency: 'Every 8 hours as needed',
      duration: '5 days',
      instructions: 'For surgical site pain'
    },
    {
      name: 'Cap. Omeprazole 20mg',
      dosage: '1 capsule daily',
      frequency: 'Morning before breakfast',
      duration: '14 days',
      instructions: 'Acid reduction'
    }
  ]);

  const [woundCare, setWoundCare] = useState(
    'Keep surgical dressing clean and dry. Inspect every 48 hours at Upazila Health Complex. Clean with Povidone-Iodine solution and apply fresh sterile gauze.'
  );
  const [drainManagement, setDrainManagement] = useState(
    'Check drain collection daily. If collection is serosanguinous and less than 25 ml/day for 48 consecutive hours, local doctor may remove drain safely.'
  );
  const [sutureRemovalDate, setSutureRemovalDate] = useState('Post-Op Day 10 (approx. 7 days from today)');
  const [dietaryInstructions, setDietaryInstructions] = useState(
    'High-protein, easily digestible home-cooked diet. Low oil, adequate hydration (>2.5 liters/day). Plenty of seasonal fruits.'
  );
  const [activityMobility, setActivityMobility] = useState(
    'Gradual indoor walking encouraged. Strictly avoid lifting weights >5 kg or heavy agricultural field work for 6 weeks.'
  );

  const [redFlags, setRedFlags] = useState<string[]>([
    'High fever (>101°F) with chills or shaking rigors',
    'Sudden spike in severe pain not relieved by prescribed analgesics',
    'Active bleeding, gaping edges, or foul-smelling purulent discharge from incision',
    'Sudden persistent vomiting or severe abdominal distension',
    'Shortness of breath, chest pain, or SpO2 dropping below 94%'
  ]);

  const [milestones, setMilestones] = useState<FollowUpMilestone[]>([
    {
      dayLabel: 'Day 3 Post-Discharge (Early Clinic Review)',
      scheduledDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      recommendedChecks: ['Check vital signs (BP, Pulse, Temp, SpO2)', 'Incision site inspection', 'Drain output quantification'],
      completed: false
    },
    {
      dayLabel: 'Day 7 Post-Discharge (Wound & Drain Assessment)',
      scheduledDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      recommendedChecks: ['Drain removal evaluation', 'Pain assessment', 'Medication adherence review'],
      completed: false
    },
    {
      dayLabel: 'Day 12 Post-Discharge (Suture / Staple Removal)',
      scheduledDate: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(),
      recommendedChecks: ['Removal of skin sutures/staples', 'Apply sterile adhesive strips', 'Fascial integrity check'],
      completed: false
    },
    {
      dayLabel: 'Day 30 Post-Discharge (Final Recovery Audit)',
      scheduledDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      recommendedChecks: ['Functional recovery audit', 'Abdominal wall / surgical site clearance', 'Formal discharge from registry'],
      completed: false
    }
  ]);

  if (!isOpen) return null;

  const handleAddMed = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const handleRemoveMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleAddRedFlag = () => {
    setRedFlags([...redFlags, '']);
  };

  const handleRemoveRedFlag = (index: number) => {
    setRedFlags(redFlags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dataService.issueReverseDirective(transfer.id, {
      cityDoctorId: activeDoctor.doctor_id,
      cityDoctorName: activeDoctor.full_name,
      cityDoctorSpecialty: activeDoctor.specialty || 'City Specialist',
      cityFacilityName: transfer.targetHospital.facility_name,
      localDoctorId: transfer.localDoctor.doctor_id,
      localDoctorName: transfer.localDoctor.full_name,
      localFacilityName: transfer.originHospitalName,
      procedureSummary,
      operativeNotes,
      dischargeDiagnosis,
      patientConditionAtDischarge: patientCondition,
      medications: medications.filter((m) => m.name.trim() !== ''),
      localCareDirectives: {
        woundCare,
        drainManagement,
        sutureRemovalDate,
        dietaryInstructions,
        activityMobility
      },
      redFlagWarnings: redFlags.filter((r) => r.trim() !== ''),
      scheduledMilestones: milestones
    });

    onDirectiveIssued();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Issue Post-Treatment Reverse Referral Directive</h2>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 font-mono px-1.5 py-0.5 rounded uppercase">
                  Home Recovery Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient: <span className="text-white font-medium">{transfer.patient.full_name}</span> • Referral Code:{' '}
                <span className="font-mono text-teal-400">{transfer.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor Bridge Banner */}
        <div className="px-5 py-2.5 bg-slate-800/80 border-b border-slate-700/80 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Issuing Specialist:</span>
            <span className="text-teal-300 font-medium">{activeDoctor.full_name}</span>
            <span className="text-slate-400">({transfer.targetHospital.facility_name})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Receiving Local Doctor:</span>
            <span className="text-emerald-300 font-medium">{transfer.localDoctor.full_name}</span>
            <span className="text-slate-400">({transfer.originHospitalName})</span>
          </div>
        </div>

        {/* Form Body */}
        <form id="reverse-directive-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Operative & Discharge Summary */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>1. Surgical &amp; Procedural Summary</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Discharge Diagnosis</label>
                <input
                  type="text"
                  required
                  value={dischargeDiagnosis}
                  onChange={(e) => setDischargeDiagnosis(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Condition at Discharge</label>
                <select
                  aria-label="Condition at Discharge"
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-400 font-semibold"
                >
                  <option value="Stable">Stable (Fit for Home Recovery)</option>
                  <option value="Guarded">Guarded (Frequent Local Review)</option>
                  <option value="Ambulatory">Ambulatory</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">Procedure &amp; Interventions Completed</label>
              <textarea
                rows={2}
                required
                value={procedureSummary}
                onChange={(e) => setProcedureSummary(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">Operative Notes &amp; Findings (for Local Doctor's Record)</label>
              <textarea
                rows={2}
                value={operativeNotes}
                onChange={(e) => setOperativeNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Section 2: Medication Table */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Pill className="w-4 h-4 text-emerald-400" />
                <span>2. Prescribed Medications &amp; Taper Schedule</span>
              </div>
              <button
                type="button"
                onClick={handleAddMed}
                className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2 py-1 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Drug</span>
              </button>
            </div>

            <div className="space-y-2">
              {medications.map((med, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 bg-slate-900/90 p-2.5 rounded border border-slate-800 text-xs items-center">
                  <div className="col-span-12 sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Medication Name & Strength"
                      value={med.name}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[index].name = e.target.value;
                        setMedications(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[index].dosage = e.target.value;
                        setMedications(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[index].frequency = e.target.value;
                        setMedications(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div className="col-span-10 sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Duration & Taper"
                      value={med.duration}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[index].duration = e.target.value;
                        setMedications(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveMed(index)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Upazila Care Directives */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-200">
              3. Directives for Local Doctor ({transfer.originHospitalName})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Wound Dressing &amp; Incision Protocol</label>
                <textarea
                  rows={2}
                  value={woundCare}
                  onChange={(e) => setWoundCare(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Drain / Catheter Removal Criteria</label>
                <textarea
                  rows={2}
                  value={drainManagement}
                  onChange={(e) => setDrainManagement(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Suture / Staple Removal Target</label>
                <input
                  type="text"
                  value={sutureRemovalDate}
                  onChange={(e) => setSutureRemovalDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Physical Activity &amp; Lifting Restrictions</label>
                <input
                  type="text"
                  value={activityMobility}
                  onChange={(e) => setActivityMobility(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Dietary &amp; Hydration Instructions</label>
                <input
                  type="text"
                  value={dietaryInstructions}
                  onChange={(e) => setDietaryInstructions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Red Flag Escalation Warnings */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>4. Red Flag Indicators (Require Immediate Re-Escalation to City Hospital)</span>
              </div>
              <button
                type="button"
                onClick={handleAddRedFlag}
                className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-rose-300 px-2 py-1 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Warning</span>
              </button>
            </div>

            <div className="space-y-2">
              {redFlags.map((flag, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <input
                    type="text"
                    value={flag}
                    onChange={(e) => {
                      const copy = [...redFlags];
                      copy[index] = e.target.value;
                      setRedFlags(copy);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-rose-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRedFlag(index)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Scheduled Upazila Milestones */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>5. Scheduled Upazila Health Complex Review Cadence</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {milestones.map((m, i) => (
                <div key={i} className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="font-semibold text-teal-300">{m.dayLabel}</div>
                  <div className="text-slate-400 text-[11px]">
                    Tasks: <span className="text-slate-300">{m.recommendedChecks.join(' • ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="reverse-directive-form"
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-md shadow-teal-950/50 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Issue Directive &amp; Discharge Patient Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
