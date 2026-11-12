import React, { useState } from 'react';
import { TransferReferral, Doctor, FollowUpMilestone, WoundCondition } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import {
  ShieldCheck,
  Stethoscope,
  Building2,
  Calendar,
  AlertTriangle,
  Pill,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Lock,
  Plus,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface ReverseCareHubProps {
  transfers: TransferReferral[];
  activeDoctor: Doctor;
  selectedTransferId?: string | null;
  onSelectTransfer: (id: string) => void;
  onOpenReverseModal: (transfer: TransferReferral) => void;
}

export const ReverseCareHub: React.FC<ReverseCareHubProps> = ({
  transfers,
  activeDoctor,
  selectedTransferId,
  onSelectTransfer,
  onOpenReverseModal
}) => {
  // If Upazila doctor: can see cases in their division or their own cases
  const relevantCases = transfers.filter((t) => {
    if (!t.reverseDirective && t.status !== 'treatment_completed' && t.status !== 'in_treatment') {
      return false;
    }
    if (activeDoctor.role === 'upazila_doctor') {
      return t.originDivision === activeDoctor.division;
    }
    return true;
  });

  const activeCase = relevantCases.find((t) => t.id === selectedTransferId) || relevantCases[0];

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'directives' | 'milestones' | 'teleconsult'>('directives');

  // New message state
  const [chatInput, setChatInput] = useState('');
  const [isUrgentMsg, setIsUrgentMsg] = useState(false);

  // Milestone log form modal state
  const [isLoggingMilestone, setIsLoggingMilestone] = useState(false);
  const [milestoneIndexToLog, setMilestoneIndexToLog] = useState<number>(0);
  const [logNotes, setLogNotes] = useState('');
  const [logBpSystolic, setLogBpSystolic] = useState<number>(120);
  const [logBpDiastolic, setLogBpDiastolic] = useState<number>(80);
  const [logHeartRate, setLogHeartRate] = useState<number>(76);
  const [logSpo2, setLogSpo2] = useState<number>(98);
  const [logTemp, setLogTemp] = useState<number>(98.6);
  const [logWoundCondition, setLogWoundCondition] = useState<WoundCondition>('clean_healing');

  const directive = activeCase?.reverseDirective;

  // Strict Tele-consult access control: Only the 2 designated doctors on this case can see the chat!
  const caseUpazilaDoctorId = activeCase?.localDoctor.doctor_id;
  const caseCitySpecialistId = directive?.cityDoctorId || activeCase?.targetDoctor.doctor_id;
  const isDoctorAuthorizedForChat =
    activeDoctor.doctor_id === caseUpazilaDoctorId || activeDoctor.doctor_id === caseCitySpecialistId;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeCase || !isDoctorAuthorizedForChat) return;

    dataService.addChatMessage(activeCase.id, {
      senderDoctorId: activeDoctor.doctor_id,
      senderName: activeDoctor.full_name,
      senderRole: activeDoctor.role,
      senderFacility: activeDoctor.facility_name,
      content: chatInput.trim(),
      isUrgent: isUrgentMsg
    });

    setChatInput('');
    setIsUrgentMsg(false);
  };

  const handleSaveMilestoneLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !directive) return;

    dataService.completeMilestone(activeCase.id, milestoneIndexToLog, {
      notes: logNotes || 'Patient evaluated at Upazila Health Complex. Recovery progressing satisfactorily.',
      vitals: {
        bpSystolic: Number(logBpSystolic),
        bpDiastolic: Number(logBpDiastolic),
        heartRate: Number(logHeartRate),
        spo2: Number(logSpo2),
        temperatureF: Number(logTemp),
        woundCondition: logWoundCondition
      }
    });

    setIsLoggingMilestone(false);
    setLogNotes('');
  };

  if (!activeCase) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <ShieldCheck className="w-12 h-12 text-teal-500 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-white">No Reverse Care Cases in Your Division</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Currently there are no active reverse care directives in {activeDoctor.division}. When a City Specialist issues a directive for a patient from your Upazila, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Reverse Referral &amp; Long-Term Home Recovery Hub
            </h2>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono px-2 py-0.5 rounded">
              Two-Doctor Handoff Protocol
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Connecting the City Specialist directly with the patient's local Upazila Doctor. The patient recovers close to home under Upazila supervision, without needing weeks of lodging in distant city centers.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-300">
            <span className="text-slate-500 block text-[10px]">MONITORED AT HOME</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {relevantCases.filter((c) => c.status === 'referred_back').length} Patients
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-300">
            <span className="text-slate-500 block text-[10px]">RECOVERY COMPLETE</span>
            <span className="font-mono text-teal-400 font-bold text-sm">
              {relevantCases.filter((c) => c.status === 'recovered_closed').length} Discharged
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Cohort list (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-lg flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {activeDoctor.role === 'upazila_doctor' ? `${activeDoctor.division} Cohort (${relevantCases.length})` : `Assigned Patients (${relevantCases.length})`}
            </span>
            <span className="text-[10px] text-teal-400 font-mono">BMDC Synchronized</span>
          </div>

          <div className="space-y-2.5">
            {relevantCases.map((transfer) => {
              const isSelected = transfer.id === activeCase.id;
              const hasDirective = !!transfer.reverseDirective;
              const completedMilestones =
                transfer.reverseDirective?.scheduledMilestones.filter((m) => m.completed).length || 0;
              const totalMilestones = transfer.reverseDirective?.scheduledMilestones.length || 0;

              // Check if current doctor is authorized on this case's chat
              const isPartyToCase =
                activeDoctor.doctor_id === transfer.localDoctor.doctor_id ||
                activeDoctor.doctor_id === transfer.targetDoctor.doctor_id;

              return (
                <div
                  key={transfer.id}
                  onClick={() => onSelectTransfer(transfer.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/95 border-teal-500 shadow-md shadow-teal-950/40 ring-1 ring-teal-500/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-teal-400 font-bold text-xs">{transfer.id}</span>
                        {transfer.reverseDirective ? (
                          <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold px-1 rounded uppercase">
                            Home Care Active
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 font-semibold px-1 rounded uppercase">
                            Ready for Directive
                          </span>
                        )}
                        {!isPartyToCase && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 font-mono px-1 rounded flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Private</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{transfer.patient.full_name}</h4>
                      <p className="text-xs text-slate-400">
                        {transfer.patient.age_years}y • Upazila: {transfer.originUpazila} ({transfer.originDivision})
                      </p>
                    </div>

                    <div className="text-right">
                      {hasDirective ? (
                        <div>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {completedMilestones}/{totalMilestones}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Visits Logged</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReverseModal(transfer);
                          }}
                          className="text-[10px] bg-teal-600 hover:bg-teal-500 text-white font-semibold px-2 py-1 rounded shadow-xs"
                        >
                          + Issue Directive
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1 mt-2">
                    {transfer.patient.current_problem}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Upazila: {transfer.localDoctor.full_name.split(' ')[1]}</span>
                    <span>City: {transfer.targetHospital.facility_name.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Selected Case Workspace (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Case Header */}
          <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-teal-400 font-bold">{activeCase.id}</span>
                  {directive && (
                    <span className="font-mono text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                      Directive: {directive.id}
                    </span>
                  )}
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                    {activeCase.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5">{activeCase.patient.full_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeCase.patient.age_years} years • {activeCase.patient.sex} • Blood Group: {activeCase.patient.blood_group} •
                  Home: <span className="text-slate-200">{activeCase.patient.upazila}, {activeCase.patient.district} ({activeCase.patient.division})</span>
                </p>
              </div>

              {!directive && (
                <button
                  onClick={() => onOpenReverseModal(activeCase)}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Issue Reverse Directive Now</span>
                </button>
              )}
            </div>

            {/* The Two Parties Bar: Upazila Doctor <-> City Specialist */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 text-xs">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Treating City Specialist</span>
                  <span className="font-semibold text-slate-200">{directive?.cityDoctorName || activeCase.targetDoctor.full_name}</span>
                  <p className="text-[11px] text-slate-400">{directive?.cityFacilityName || activeCase.targetHospital.facility_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Stethoscope className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Supervising Upazila Doctor</span>
                  <span className="font-semibold text-slate-200">{activeCase.localDoctor.full_name}</span>
                  <p className="text-[11px] text-slate-400">{activeCase.originHospitalName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 text-xs font-medium">
            <button
              onClick={() => setActiveWorkspaceTab('directives')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeWorkspaceTab === 'directives'
                  ? 'border-teal-500 text-teal-300 font-semibold bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Medical &amp; Care Directives</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('milestones')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeWorkspaceTab === 'milestones'
                  ? 'border-teal-500 text-teal-300 font-semibold bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upazila Follow-Up Checkpoints</span>
              {directive && (
                <span className="bg-emerald-900 text-emerald-300 font-mono text-[10px] px-1.5 rounded-full ml-1">
                  {directive.scheduledMilestones.filter((m) => m.completed).length}/{directive.scheduledMilestones.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('teleconsult')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeWorkspaceTab === 'teleconsult'
                  ? 'border-teal-500 text-teal-300 font-semibold bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Doctor-to-Doctor Tele-Consult</span>
              {!isDoctorAuthorizedForChat ? (
                <Lock className="w-3 h-3 text-amber-400 ml-1" />
              ) : directive?.chatMessages && directive.chatMessages.length > 0 ? (
                <span className="bg-teal-700 text-white font-mono text-[10px] px-1.5 rounded-full ml-1">
                  {directive.chatMessages.length}
                </span>
              ) : null}
            </button>
          </div>

          {/* Workspace Tab Content */}
          <div className="p-5">
            {!directive ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Reverse Care Directive Pending</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The patient is currently undergoing treatment at the city hospital. When the surgery or critical stabilization is complete, the City Specialist will issue the structured recovery directive for the Upazila Doctor.
                </p>
                <button
                  onClick={() => onOpenReverseModal(activeCase)}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Generate Directive for this Patient
                </button>
              </div>
            ) : (
              <>
                {/* Tab 1: Medical & Care Directives */}
                {activeWorkspaceTab === 'directives' && (
                  <div className="space-y-5 text-xs">
                    {/* Operative Summary */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-400" />
                          <span>Definitive Discharge Diagnosis &amp; Procedure</span>
                        </span>
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          Condition: {directive.patientConditionAtDischarge}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium text-sm">{directive.dischargeDiagnosis}</p>
                      <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                        {directive.procedureSummary}
                      </p>
                      {directive.operativeNotes && (
                        <div className="text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300">Operative Details:</span> {directive.operativeNotes}
                        </div>
                      )}
                    </div>

                    {/* Prescribed Medications */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-emerald-400" />
                          <span>Prescribed Medications &amp; Taper Schedule</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {directive.medications.length} active prescriptions
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-800">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                              <th className="p-2 font-medium">Drug &amp; Form</th>
                              <th className="p-2 font-medium">Dosage</th>
                              <th className="p-2 font-medium">Frequency</th>
                              <th className="p-2 font-medium">Duration</th>
                              <th className="p-2 font-medium">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {directive.medications.map((m, i) => (
                              <tr key={i} className="hover:bg-slate-900/50">
                                <td className="p-2 font-semibold text-teal-300">{m.name}</td>
                                <td className="p-2 text-slate-200">{m.dosage}</td>
                                <td className="p-2 text-slate-300">{m.frequency}</td>
                                <td className="p-2 font-mono text-emerald-400">{m.duration}</td>
                                <td className="p-2 text-slate-400 text-[11px]">{m.instructions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Upazila Care Directives */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <span className="font-semibold text-white text-xs block">
                        Supervision Instructions for Upazila Health Complex Doctor ({activeCase.originHospitalName})
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] text-teal-400 font-bold block uppercase tracking-wider">
                            Wound Dressing &amp; Incision Care
                          </span>
                          <p className="text-slate-300">{directive.localCareDirectives.woundCare}</p>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] text-teal-400 font-bold block uppercase tracking-wider">
                            Drain / Catheter Removal Criteria
                          </span>
                          <p className="text-slate-300">{directive.localCareDirectives.drainManagement || 'No active drain.'}</p>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] text-teal-400 font-bold block uppercase tracking-wider">
                            Target Suture / Staple Removal
                          </span>
                          <p className="text-slate-200 font-medium">
                            {directive.localCareDirectives.sutureRemovalDate || 'Absorbable sutures used.'}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] text-teal-400 font-bold block uppercase tracking-wider">
                            Physical Activity &amp; Lifting Restrictions
                          </span>
                          <p className="text-slate-300">{directive.localCareDirectives.activityMobility}</p>
                        </div>

                        <div className="sm:col-span-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] text-teal-400 font-bold block uppercase tracking-wider">
                            Dietary &amp; Hydration Guidance
                          </span>
                          <p className="text-slate-300">{directive.localCareDirectives.dietaryInstructions}</p>
                        </div>
                      </div>
                    </div>

                    {/* Red Flag Warnings */}
                    <div className="bg-rose-950/30 p-4 rounded-xl border border-rose-900/80 space-y-2">
                      <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Red Flag Warning Criteria (Immediate City Hospital Re-Escalation)</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80">
                        If patient presents with any of the following to the Upazila Health Complex, immediately notify the City Specialist via the peer channel or arrange direct re-transfer:
                      </p>
                      <div className="space-y-1 mt-2">
                        {directive.redFlagWarnings.map((flag, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-rose-200 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Upazila Follow-up Milestone Tracker */}
                {activeWorkspaceTab === 'milestones' && (
                  <div className="space-y-5 text-xs">
                    <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <div>
                        <h4 className="font-bold text-white text-xs">Upazila Health Complex Care Cadence</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Milestone reviews conducted by the local Upazila Doctor close to the patient's home.
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded">
                        {directive.scheduledMilestones.filter((m) => m.completed).length} of{' '}
                        {directive.scheduledMilestones.length} Completed
                      </span>
                    </div>

                    <div className="space-y-3">
                      {directive.scheduledMilestones.map((m, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border transition-all ${
                            m.completed
                              ? 'bg-slate-950 border-emerald-800/80'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                  m.completed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {m.completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                              </div>
                              <div>
                                <h5 className="font-bold text-white text-sm">{m.dayLabel}</h5>
                                <p className="text-slate-400 text-[11px] mt-0.5">
                                  Scheduled: {new Date(m.scheduledDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div>
                              {m.completed ? (
                                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                                  VERIFIED &amp; COMPLETED
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setMilestoneIndexToLog(index);
                                    setIsLoggingMilestone(true);
                                  }}
                                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Log Upazila Clinic Visit</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 text-slate-300 text-xs">
                            <span className="font-semibold text-slate-400">Required Review Checks:</span>{' '}
                            {m.recommendedChecks.join(' • ')}
                          </div>

                          {m.completed && (
                            <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-900/60 rounded-lg space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-b border-emerald-900/40 pb-1.5">
                                <span>Logged at: {m.completedAt ? new Date(m.completedAt).toLocaleString() : 'Recent'}</span>
                                <span className="font-medium text-emerald-300">Audited by Dr. {activeCase.localDoctor.full_name}</span>
                              </div>

                              {m.recordedVitals && (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-center pt-1">
                                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                                    <span className="text-[9px] text-slate-500 block">BP</span>
                                    <span className="text-white">{m.recordedVitals.bpSystolic}/{m.recordedVitals.bpDiastolic}</span>
                                  </div>
                                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                                    <span className="text-[9px] text-slate-500 block">HR</span>
                                    <span className="text-white">{m.recordedVitals.heartRate} bpm</span>
                                  </div>
                                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                                    <span className="text-[9px] text-slate-500 block">SPO2</span>
                                    <span className="text-emerald-400">{m.recordedVitals.spo2}%</span>
                                  </div>
                                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                                    <span className="text-[9px] text-slate-500 block">TEMP</span>
                                    <span className="text-white">{m.recordedVitals.temperatureF}°F</span>
                                  </div>
                                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                                    <span className="text-[9px] text-slate-500 block">WOUND</span>
                                    <span className="text-emerald-400 capitalize">
                                      {m.recordedVitals.woundCondition?.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {m.doctorNotes && (
                                <p className="text-slate-300 text-xs italic bg-slate-900/60 p-2 rounded">
                                  "{m.doctorNotes}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Doctor-to-Doctor Tele-Consult */}
                {activeWorkspaceTab === 'teleconsult' && (
                  <div className="space-y-4">
                    {/* PRIVACY ENFORCEMENT */}
                    {!isDoctorAuthorizedForChat ? (
                      <div className="p-8 text-center bg-slate-950 rounded-2xl border border-rose-900/60 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
                          <Lock className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white">Private Doctor-to-Doctor Tele-Consultation</h4>
                          <span className="text-xs font-mono text-rose-400 bg-rose-950 border border-rose-900 px-2 py-0.5 rounded font-semibold uppercase">
                            DGHS Confidential Channel • Access Restricted
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                          This encrypted consultation channel is strictly private between the referring Upazila Doctor (<strong className="text-teal-300">{activeCase.localDoctor.full_name}</strong>) and the designated City Specialist (<strong className="text-emerald-300">{directive.cityDoctorName}</strong>).
                        </p>
                        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 max-w-md mx-auto text-[11px] text-slate-400">
                          Your currently authenticated session is{' '}
                          <strong className="text-white">{activeDoctor.full_name}</strong> ({activeDoctor.facility_name}). You are not a party to this clinical handoff and cannot view or post messages here.
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-teal-950/40 border border-teal-800/60 rounded-lg text-xs text-teal-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-teal-400 shrink-0" />
                            <span>
                              Direct BMDC Peer Channel between <strong className="text-white">{directive.cityDoctorName}</strong> (City Specialist) and{' '}
                              <strong className="text-white">{activeCase.localDoctor.full_name}</strong> (Upazila Doctor)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Private Channel</span>
                          </span>
                        </div>

                        {/* Chat Messages */}
                        <div className="h-80 overflow-y-auto space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                          {directive.chatMessages.map((msg) => {
                            const isMe = msg.senderDoctorId === activeDoctor.doctor_id;
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} text-xs`}
                              >
                                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                                  <span className="font-semibold text-slate-200">{msg.senderName}</span>
                                  <span>•</span>
                                  <span>{msg.senderFacility.split('(')[0]}</span>
                                  <span>•</span>
                                  <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                <div
                                  className={`p-3 rounded-2xl max-w-lg leading-relaxed ${
                                    isMe
                                      ? 'bg-teal-700 text-white rounded-br-none'
                                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                                  } ${msg.isUrgent ? 'border-2 border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                >
                                  {msg.isUrgent && (
                                    <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>High Clinical Priority</span>
                                    </div>
                                  )}
                                  <p>{msg.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Response Chips */}
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setChatInput('Patient attended check-in today. Vitals stable, wound clean and dry.')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            + Vitals stable &amp; clean wound
                          </button>
                          <button
                            type="button"
                            onClick={() => setChatInput('24h drain output <15ml serosanguinous. Requesting authorization to remove Blake drain.')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            + Request drain removal approval
                          </button>
                          <button
                            type="button"
                            onClick={() => setChatInput('Authorized: You may safely pull the drain at Upazila complex and apply sterile pressure dressing.')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            + Approve drain removal
                          </button>
                        </div>

                        {/* Input Field */}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
                            <input
                              type="text"
                              placeholder={`Message Dr. ${activeDoctor.role === 'upazila_doctor' ? directive.cityDoctorName.split(' ')[1] : activeCase.localDoctor.full_name.split(' ')[1]}...`}
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              className="flex-1 bg-transparent text-xs text-white outline-none placeholder-slate-500"
                            />
                            <label className="flex items-center gap-1 text-[11px] text-rose-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isUrgentMsg}
                                onChange={(e) => setIsUrgentMsg(e.target.checked)}
                                className="rounded border-rose-700 text-rose-600 focus:ring-rose-500"
                              />
                              <span>Urgent</span>
                            </label>
                          </div>

                          <button
                            type="submit"
                            className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send</span>
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Log Milestone Modal */}
      {isLoggingMilestone && directive && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">
                Log Upazila Clinic Visit: {directive.scheduledMilestones[milestoneIndexToLog]?.dayLabel}
              </h3>
              <button onClick={() => setIsLoggingMilestone(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMilestoneLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">BP (Systolic / Diastolic)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={logBpSystolic}
                      onChange={(e) => setLogBpSystolic(Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-center"
                    />
                    <span className="text-slate-500 self-center">/</span>
                    <input
                      type="number"
                      value={logBpDiastolic}
                      onChange={(e) => setLogBpDiastolic(Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={logHeartRate}
                    onChange={(e) => setLogHeartRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={logSpo2}
                    onChange={(e) => setLogSpo2(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={logTemp}
                    onChange={(e) => setLogTemp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Incision / Wound Assessment</label>
                  <select
                    value={logWoundCondition}
                    onChange={(e) => setLogWoundCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                  >
                    <option value="clean_healing">Clean &amp; Healing without exudate</option>
                    <option value="erythema_mild">Mild erythema (observe, clean dressing)</option>
                    <option value="discharge_warning">Seropurulent discharge (Alert Specialist)</option>
                    <option value="dehiscence_critical">Dehiscence / Gaping (Immediate City Hospital Re-escalate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Upazila Doctor Clinical Observations</label>
                <textarea
                  rows={3}
                  placeholder="Record findings: suture condition, drain output, patient mobility, compliance with medicines..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLoggingMilestone(false)}
                  className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm"
                >
                  Save &amp; Notify Specialist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
