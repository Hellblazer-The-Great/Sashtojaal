import React, { useState, useMemo } from 'react';
import { Doctor, Hospital, Patient, HospitalRecommendation } from '../types/index.ts';
import { rankHospitalRecommendations, inferClinicalNeeds } from '../utils/transferLogic.ts';
import { dataService } from '../services/dataService.ts';
import { X, AlertCircle, CheckCircle2, ChevronRight, Stethoscope, Bed, Clock, Navigation, ShieldAlert, Sparkles, MapPin } from 'lucide-react';

interface EmergencyTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoctor: Doctor;
  hospitals: Hospital[];
  doctors: Doctor[];
  patients: Patient[];
  preselectedPatient?: Patient | null;
  onTransferDispatched: (transferId: string) => void;
}

export const EmergencyTransferModal: React.FC<EmergencyTransferModalProps> = ({
  isOpen,
  onClose,
  activeDoctor,
  hospitals,
  doctors,
  patients,
  preselectedPatient,
  onTransferDispatched
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Filter accessible patients for Upazila Doctor by their division
  const divisionAccessiblePatients = useMemo(() => {
    if (activeDoctor.role === 'upazila_doctor') {
      return patients.filter((p) => p.division === activeDoctor.division);
    }
    return patients;
  }, [patients, activeDoctor]);

  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    preselectedPatient ? preselectedPatient.patient_id : divisionAccessiblePatients[0]?.patient_id || ''
  );

  const [newPatient, setNewPatient] = useState({
    fullName: '',
    ageYears: 45,
    sex: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'B+',
    division: activeDoctor.division,
    district: activeDoctor.district || 'Khulna',
    upazila: activeDoctor.upazila || 'Dumuria',
    condition: 'Acute Myocardial Infarction',
    problemDescription: 'Severe crushing retrosternal chest pain with diaphoresis, hypotensive.',
    symptomDuration: '90 minutes'
  });

  const [clinicalCondition, setClinicalCondition] = useState<string>('Acute Myocardial Infarction');
  const [clinicalDescription, setClinicalDescription] = useState<string>(
    'Severe chest pain with hemodynamic collapse. Initial ECG demonstrates 3mm ST-elevations in anterior leads.'
  );
  const [urgency, setUrgency] = useState<'code_red' | 'code_amber' | 'code_yellow'>('code_red');
  const [bedType, setBedType] = useState<'icu' | 'hdu' | 'general'>('icu');
  const [primarySpecialty, setPrimarySpecialty] = useState<string>('Cardiology');

  const [bp, setBp] = useState<string>('85/55');
  const [heartRate, setHeartRate] = useState<number>(115);
  const [spo2, setSpo2] = useState<number>(88);
  const [temp, setTemp] = useState<number>(98.6);
  const [gcs, setGcs] = useState<number>(13);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');

  const currentPatient: Patient = useMemo(() => {
    if (patientMode === 'new') {
      return {
        patient_id: `SHJ-P-EMERG-${Math.floor(1000 + Math.random() * 9000)}`,
        identity_type: 'SASTHOJAL_EMERGENCY_ID',
        identity_number: `EMERG-${Math.floor(1000 + Math.random() * 9000)}`,
        is_synthetic: true,
        full_name: newPatient.fullName || 'Emergency Walk-in Patient',
        date_of_birth: '1980-01-01',
        age_years: Number(newPatient.ageYears) || 45,
        sex: newPatient.sex,
        height_cm: 168,
        weight_kg: 68,
        blood_group: newPatient.bloodGroup,
        division: activeDoctor.division,
        district: newPatient.district,
        upazila: newPatient.upazila,
        current_problem: newPatient.condition,
        problem_description: newPatient.problemDescription,
        symptom_duration: newPatient.symptomDuration,
        known_allergies: 'None recorded in emergency triage',
        chronic_conditions: ['Pending clinical review'],
        last_checkup_date: new Date().toISOString().split('T')[0]
      };
    }
    const found = divisionAccessiblePatients.find((p) => p.patient_id === selectedPatientId);
    if (found) return found;
    return divisionAccessiblePatients[0] || ({} as Patient);
  }, [patientMode, selectedPatientId, newPatient, divisionAccessiblePatients, activeDoctor]);

  const handleAutoInfer = () => {
    const textToAnalyze = clinicalCondition || currentPatient.current_problem || '';
    const inferred = inferClinicalNeeds(textToAnalyze);
    setPrimarySpecialty(inferred.requiredSpecialty);
    setBedType(inferred.defaultBedType);
    setUrgency(inferred.urgency);
  };

  const recommendations: HospitalRecommendation[] = useMemo(() => {
    if (!currentPatient || !isOpen) return [];
    return rankHospitalRecommendations(
      currentPatient,
      hospitals,
      doctors,
      bedType,
      primarySpecialty,
      urgency
    );
  }, [currentPatient, hospitals, doctors, bedType, primarySpecialty, urgency, isOpen]);

  const bestHospital = recommendations[0];
  const chosenRecommendation = recommendations.find((r) => r.hospital.hospital_id === selectedHospitalId) || bestHospital;

  if (!isOpen) return null;

  const handleDispatch = () => {
    if (!chosenRecommendation) return;

    if (patientMode === 'new') {
      dataService.registerEmergencyPatient(currentPatient);
    }

    const assignedDoc =
      chosenRecommendation.assignedDoctor ||
      doctors.find((d) => d.role === 'city_specialist') ||
      activeDoctor;

    const newTransfer = dataService.dispatchEmergencyTransfer({
      patient: currentPatient,
      localDoctor: activeDoctor,
      targetHospital: chosenRecommendation.hospital,
      targetDoctor: assignedDoc,
      urgency,
      requiredBedType: bedType,
      clinicalSummary: `${clinicalCondition}: ${clinicalDescription}`,
      initialVitals: {
        bp,
        heartRate: Number(heartRate),
        spo2: Number(spo2),
        temp: Number(temp),
        gcs: Number(gcs)
      },
      recommendedScore: chosenRecommendation.score.totalScore,
      transitEstimatedMinutes: chosenRecommendation.score.estimatedTransitMinutes
    });

    onTransferDispatched(newTransfer.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Emergency Transfer Dispatch to City Hospital</h2>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-mono px-1.5 py-0.5 rounded uppercase">
                  Upazila Rapid Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Referring Upazila Doctor: <span className="text-slate-200 font-semibold">{activeDoctor.full_name}</span> ({activeDoctor.facility_name}, {activeDoctor.division})
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

        {/* Stepper */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 font-medium ${step === 1 ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                1
              </span>
              Clinical Triage &amp; Division Patient
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 font-medium ${step === 2 ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                2
              </span>
              City Hospital &amp; Specialist Match
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Step {step} of 2
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {step === 1 && (
            <div className="space-y-5">
              {/* Patient Selection Mode */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-200">Patient Selection</label>
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono">
                      {activeDoctor.division} Only
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPatientMode('existing')}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${
                        patientMode === 'existing'
                          ? 'bg-teal-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Division Registry ({divisionAccessiblePatients.length} cases)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientMode('new')}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${
                        patientMode === 'new'
                          ? 'bg-teal-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      + New Emergency Walk-in
                    </button>
                  </div>
                </div>

                {patientMode === 'existing' ? (
                  <div>
                    <select
                      aria-label="Select Patient from Division Registry"
                      value={selectedPatientId}
                      onChange={(e) => {
                        setSelectedPatientId(e.target.value);
                        const p = divisionAccessiblePatients.find((item) => item.patient_id === e.target.value);
                        if (p) {
                          setClinicalCondition(p.current_problem);
                          setClinicalDescription(p.problem_description);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-teal-500"
                    >
                      {divisionAccessiblePatients.slice(0, 100).map((p) => (
                        <option key={p.patient_id} value={p.patient_id}>
                          {p.full_name} ({p.age_years}y, {p.sex}) — {p.upazila}, {p.district} — {p.current_problem}
                        </option>
                      ))}
                    </select>

                    {currentPatient && (
                      <div className="mt-3 p-3 bg-slate-900/80 rounded border border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">PATIENT ID</span>
                          <span className="font-mono text-teal-400 font-semibold">{currentPatient.patient_id}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">AGE / BLOOD</span>
                          <span className="text-slate-200 font-medium">
                            {currentPatient.age_years}y • {currentPatient.blood_group}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">UPAZILA / DIVISION</span>
                          <span className="text-slate-200">
                            {currentPatient.upazila}, {currentPatient.division}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">CHRONIC COMORBIDITIES</span>
                          <span className="text-slate-300 truncate block">
                            {currentPatient.chronic_conditions?.join(', ') || 'None reported'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Md. Rafiqul Islam"
                        value={newPatient.fullName}
                        onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Age &amp; Sex</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Age"
                          value={newPatient.ageYears}
                          onChange={(e) => setNewPatient({ ...newPatient, ageYears: Number(e.target.value) })}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                        />
                        <select
                          aria-label="Patient Sex"
                          value={newPatient.sex}
                          onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value as any })}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Blood Group</label>
                      <select
                        aria-label="Blood Group"
                        value={newPatient.bloodGroup}
                        onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Condition & AI Auto-Infer */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">Emergency Clinical Condition</label>
                  <button
                    type="button"
                    onClick={handleAutoInfer}
                    className="flex items-center gap-1.5 text-[11px] bg-teal-900/60 hover:bg-teal-900 text-teal-300 border border-teal-700/60 px-2 py-1 rounded transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Auto-Infer Specialty &amp; Bed Priority</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Emergency Diagnosis</label>
                    <input
                      type="text"
                      value={clinicalCondition}
                      onChange={(e) => setClinicalCondition(e.target.value)}
                      placeholder="e.g. Acute STEMI, Compound Fracture, Perforated Viscus"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Urgency Code</label>
                    <select
                      aria-label="Urgency Code"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className={`w-full border rounded px-2.5 py-1.5 font-semibold text-xs ${
                        urgency === 'code_red'
                          ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                          : urgency === 'code_amber'
                          ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                          : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                      }`}
                    >
                      <option value="code_red">CODE RED (Critical &lt; 2 hrs)</option>
                      <option value="code_amber">CODE AMBER (Urgent &lt; 6 hrs)</option>
                      <option value="code_yellow">CODE YELLOW (Stable Transfer)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-xs">Clinical Summary &amp; Treatment at Upazila</label>
                  <textarea
                    rows={2}
                    value={clinicalDescription}
                    onChange={(e) => setClinicalDescription(e.target.value)}
                    placeholder="Brief description of symptoms, local interventions and justification for city hospital transfer..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-slate-400 block mb-1">Required Bed Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['icu', 'hdu', 'general'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBedType(type)}
                          className={`py-1.5 px-2 rounded border text-center font-medium uppercase text-xs transition-colors ${
                            bedType === type
                              ? 'bg-teal-600 border-teal-500 text-white font-semibold'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {type.toUpperCase()} Bed
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Target Specialist Specialty</label>
                    <select
                      aria-label="Target Specialist Specialty"
                      value={primarySpecialty}
                      onChange={(e) => setPrimarySpecialty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                    >
                      <option value="General Surgery">General &amp; Laparoscopic Surgery</option>
                      <option value="Cardiology">Cardiology &amp; CCU</option>
                      <option value="Orthopaedics">Orthopaedics &amp; Trauma</option>
                      <option value="Neurology">Neurology &amp; Neuro-Critical Care</option>
                      <option value="Internal Medicine">Internal &amp; Critical Care Medicine</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency Vitals */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <label className="text-xs font-semibold text-slate-200 block mb-2">
                  Emergency Vitals (Recorded at {activeDoctor.facility_name})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">BLOOD PRESSURE</span>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">HEART RATE (BPM)</span>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">SPO2 (%)</span>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className={`w-full bg-slate-900 border rounded px-2 py-1 font-mono font-bold ${
                        spo2 < 90 ? 'border-rose-600 text-rose-400' : 'border-slate-700 text-emerald-400'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">TEMP (°F)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">GLASGOW COMA (GCS)</span>
                    <input
                      type="number"
                      min={3}
                      max={15}
                      value={gcs}
                      onChange={(e) => setGcs(Number(e.target.value))}
                      className={`w-full bg-slate-900 border rounded px-2 py-1 font-mono ${
                        gcs < 10 ? 'border-rose-600 text-rose-400 font-bold' : 'border-slate-700 text-slate-100'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-950/40 border border-teal-800/60 rounded-lg text-xs text-teal-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">City Hospital Matching Active:</span> Evaluating the{' '}
                  <span className="text-teal-300 font-bold">5 designated city hospitals</span> across Bangladesh for requested{' '}
                  <span className="font-mono text-emerald-400 uppercase">{bedType}</span> bed &amp;{' '}
                  <span className="font-bold text-white">{primarySpecialty}</span> specialist consultant.
                </div>
              </div>

              {/* Scored Hospital Cards */}
              <div className="space-y-3">
                {recommendations.map((rec, index) => {
                  const isSelected = chosenRecommendation.hospital.hospital_id === rec.hospital.hospital_id;
                  const bedCapacity =
                    bedType === 'icu'
                      ? rec.hospital.capacity.icu_beds
                      : bedType === 'hdu'
                      ? rec.hospital.capacity.hdu_beds
                      : rec.hospital.capacity.general_beds;

                  return (
                    <div
                      key={rec.hospital.hospital_id}
                      onClick={() => setSelectedHospitalId(rec.hospital.hospital_id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-teal-500 shadow-md shadow-teal-950/40 ring-1 ring-teal-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              index === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            #{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">{rec.hospital.facility_name}</h3>
                              {index === 0 && (
                                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                                  Top Recommendation
                                </span>
                              )}
                              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
                                {rec.hospital.location.division}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {rec.hospital.location.district} District • {rec.hospital.location.address}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-lg font-mono font-bold text-teal-400">
                              {rec.score.totalScore}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">/100</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Match Score</span>
                        </div>
                      </div>

                      {/* Distance & Bed Highlights */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block">ROAD DISTANCE</span>
                            <span className="font-mono font-semibold text-slate-200">
                              {rec.score.distanceKm} km
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block">EST. TRANSIT</span>
                            <span className="font-mono font-semibold text-slate-200">
                              ~{rec.score.estimatedTransitMinutes} mins
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Bed className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">
                              {bedType} VACANCY
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                bedCapacity.available > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {bedCapacity.available} of {bedCapacity.total} beds
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block">DESIGNATED SPECIALIST</span>
                            <span className="text-slate-200 font-medium truncate block max-w-[130px]">
                              {rec.assignedDoctor ? rec.assignedDoctor.full_name : 'City Consultant'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reasoning list */}
                      <div className="mt-3 bg-slate-900/60 p-2.5 rounded border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                        <div className="flex items-center gap-2 text-slate-400 font-semibold text-[10px] uppercase">
                          <span>Match Breakdown:</span>
                          <span className="font-mono text-teal-300">
                            Spec: {rec.score.specialtyMatchScore}/40 • Bed: {rec.score.bedAvailabilityScore}/30 • Dist: {rec.score.distanceScore}/20 • Division: {rec.score.facilityReadinessScore}/10
                          </span>
                        </div>
                        {rec.score.reasoning.map((r, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-slate-300">
                            <span className="w-1 h-1 rounded-full bg-teal-400"></span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      {!rec.hasRequiredBed && (
                        <div className="mt-2 p-2 bg-rose-950/60 border border-rose-800 rounded text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Warning: Zero {bedType.toUpperCase()} beds vacant at this hospital.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {chosenRecommendation && (
                <div className="p-4 bg-teal-950/30 border border-teal-700/60 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Transfer Authorization Protocol:</span>
                    <span className="font-mono text-emerald-400 font-bold">READY FOR DISPATCH</span>
                  </div>
                  <p className="text-slate-300">
                    Patient <strong className="text-white">{currentPatient.full_name}</strong> will be dispatched from{' '}
                    <strong className="text-white">{activeDoctor.facility_name}</strong> to{' '}
                    <strong className="text-teal-300">{chosenRecommendation.hospital.facility_name}</strong> under care of City Specialist{' '}
                    <strong className="text-white">{chosenRecommendation.assignedDoctor?.full_name || 'Designated Specialist'}</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <span>Find Matched City Hospital</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back to Triage
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={!chosenRecommendation}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-rose-950/50 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Dispatch Ambulance Transfer</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
