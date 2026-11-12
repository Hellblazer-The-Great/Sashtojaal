import React, { useState } from 'react';
import { TransferReferral, Doctor, Hospital } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import {
  Activity,
  Ambulance,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Heart,
  ChevronRight,
  User,
  ExternalLink
} from 'lucide-react';

interface TransferPipelineViewProps {
  transfers: TransferReferral[];
  activeDoctor: Doctor;
  hospitals: Hospital[];
  onOpenEmergencyModal: () => void;
  onOpenReverseModal: (transfer: TransferReferral) => void;
  onSelectReverseCareCase: (transferId: string) => void;
}

export const TransferPipelineView: React.FC<TransferPipelineViewProps> = ({
  transfers,
  activeDoctor,
  onOpenEmergencyModal,
  onOpenReverseModal,
  onSelectReverseCareCase
}) => {
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterMineOnly, setFilterMineOnly] = useState<boolean>(false);

  // Filter transfers
  const filteredTransfers = transfers.filter((t) => {
    if (filterUrgency !== 'all' && t.urgency !== filterUrgency) return false;
    if (filterMineOnly) {
      const isMyOrigin = t.localDoctor.doctor_id === activeDoctor.doctor_id;
      const isMyTarget = t.targetDoctor.doctor_id === activeDoctor.doctor_id;
      if (!isMyOrigin && !isMyTarget) return false;
    }
    return true;
  });

  // Pipeline groups
  const inTransitCases = filteredTransfers.filter((t) => t.status === 'in_transit' || t.status === 'pending_dispatch');
  const admittedCases = filteredTransfers.filter((t) => t.status === 'admitted_tertiary' || t.status === 'in_treatment' || t.status === 'treatment_completed');
  const reverseCareCases = filteredTransfers.filter((t) => t.status === 'referred_back' || t.status === 'recovered_closed');

  const handleAdvanceStatus = (transfer: TransferReferral) => {
    if (transfer.status === 'pending_dispatch') {
      dataService.updateTransferStatus(transfer.id, 'in_transit');
    } else if (transfer.status === 'in_transit') {
      dataService.updateTransferStatus(transfer.id, 'admitted_tertiary');
    } else if (transfer.status === 'admitted_tertiary') {
      dataService.updateTransferStatus(transfer.id, 'in_treatment');
    } else if (transfer.status === 'in_treatment') {
      // Prompt to open reverse directive modal
      onOpenReverseModal(transfer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview & Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Emergency Referral &amp; Transfer Command Pipeline
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {filteredTransfers.length} Active Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Semi-automated transfer coordination across Bangladesh Upazila Health Complexes and Tertiary Medical Colleges. Real-time GPS transit tracking and beds synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenEmergencyModal}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-md shadow-rose-950/40 transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>New Emergency Transfer</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter Urgency:</span>
          <button
            onClick={() => setFilterUrgency('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterUrgency === 'all' ? 'bg-slate-700 text-white font-semibold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tiers ({transfers.length})
          </button>
          <button
            onClick={() => setFilterUrgency('code_red')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              filterUrgency === 'code_red' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-900 text-rose-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Code Red ({transfers.filter((t) => t.urgency === 'code_red').length})
          </button>
          <button
            onClick={() => setFilterUrgency('code_amber')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              filterUrgency === 'code_amber' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-900 text-amber-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Code Amber ({transfers.filter((t) => t.urgency === 'code_amber').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={filterMineOnly}
              onChange={(e) => setFilterMineOnly(e.target.checked)}
              className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
            />
            <span>Show cases involving my clinic/consultation only</span>
          </label>
        </div>
      </div>

      {/* 3 Pipeline Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: In Transit & Emergency Dispatch */}
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                1. Transit &amp; En Route ({inTransitCases.length})
              </h3>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">Active Road Dispatch</span>
          </div>

          <div className="space-y-3">
            {inTransitCases.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                No ambulances currently en route.
              </div>
            ) : (
              inTransitCases.map((transfer) => (
                <div
                  key={transfer.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-teal-400 font-bold text-xs">{transfer.id}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                            transfer.urgency === 'code_red'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {transfer.urgency.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{transfer.patient.full_name}</h4>
                      <p className="text-xs text-slate-400">
                        {transfer.patient.age_years}y, {transfer.patient.sex} • Blood: {transfer.patient.blood_group}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase">
                        {transfer.requiredBedType.toUpperCase()} BED
                      </span>
                    </div>
                  </div>

                  {/* Transfer Route */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>From: {transfer.originHospitalName.split('(')[0]}</span>
                      <span className="text-teal-400 font-semibold">{transfer.originUpazila}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                      <div className="h-px bg-slate-800 flex-1"></div>
                      <Ambulance className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                      <div className="h-px bg-slate-800 flex-1"></div>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                      <span className="font-medium text-white">To: {transfer.targetHospital.facility_name.split('(')[0]}</span>
                      <span className="text-amber-400 font-mono font-bold">~{transfer.transitEstimatedMinutes}m transit</span>
                    </div>
                  </div>

                  {/* Clinical condition summary */}
                  <p className="text-xs text-slate-300 line-clamp-2">
                    <strong className="text-slate-100">{transfer.patient.current_problem}:</strong> {transfer.clinicalSummary}
                  </p>

                  {/* Vitals snapshot */}
                  <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/60 rounded text-[11px] font-mono text-center">
                    <div>
                      <span className="text-[9px] text-slate-500 block">BP</span>
                      <span className="text-amber-300">{transfer.initialVitals.bp}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">HR</span>
                      <span className="text-slate-200">{transfer.initialVitals.heartRate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">SPO2</span>
                      <span className={transfer.initialVitals.spo2 < 90 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {transfer.initialVitals.spo2}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">GCS</span>
                      <span className="text-slate-200">{transfer.initialVitals.gcs}/15</span>
                    </div>
                  </div>

                  {/* Status advance action */}
                  <button
                    onClick={() => handleAdvanceStatus(transfer)}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Confirm Arrival &amp; Admit at Tertiary Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Admitted in Tertiary Hospital & In Treatment */}
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                2. Admitted in Tertiary Care ({admittedCases.length})
              </h3>
            </div>
            <span className="text-[10px] text-teal-400 font-mono">In OR / Specialized Ward</span>
          </div>

          <div className="space-y-3">
            {admittedCases.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                No patients currently in tertiary surgery or ICU.
              </div>
            ) : (
              admittedCases.map((transfer) => (
                <div
                  key={transfer.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-teal-400 font-bold text-xs">{transfer.id}</span>
                        <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded font-mono uppercase">
                          {transfer.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{transfer.patient.full_name}</h4>
                      <p className="text-xs text-slate-400">
                        {transfer.patient.age_years}y, {transfer.patient.sex} • Origin: {transfer.originUpazila}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-mono uppercase">
                        {transfer.requiredBedType.toUpperCase()} ALLOCATED
                      </span>
                    </div>
                  </div>

                  {/* Specialist & Hospital Detail */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                    <div className="text-slate-400 text-[11px]">
                      Tertiary Facility: <span className="text-slate-200 font-medium">{transfer.targetHospital.facility_name.split('(')[0]}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Treating Specialist:</span>
                      <span className="text-teal-300 font-semibold">{transfer.targetDoctor.full_name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-100">Intervention:</strong> {transfer.clinicalSummary}
                  </p>

                  {/* Key Action: Issue Reverse Directive once surgery is finished */}
                  <div className="pt-1">
                    <button
                      onClick={() => onOpenReverseModal(transfer)}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2 rounded-lg shadow-sm shadow-teal-950/40 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Issue Reverse Referral Directive (Send Home)</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      Enables patient to recover locally at Upazila Health Complex.
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Reverse Referral Active & Recovering at Home */}
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                3. Monitored Home Recovery ({reverseCareCases.length})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Local Upazila Protocol</span>
          </div>

          <div className="space-y-3">
            {reverseCareCases.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                No patients currently in reverse home recovery monitoring.
              </div>
            ) : (
              reverseCareCases.map((transfer) => {
                const directive = transfer.reverseDirective;
                const completedCount = directive?.scheduledMilestones.filter((m) => m.completed).length || 0;
                const totalCount = directive?.scheduledMilestones.length || 0;

                return (
                  <div
                    key={transfer.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-teal-400 font-bold text-xs">{transfer.id}</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono uppercase">
                            Home Recovery
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{transfer.patient.full_name}</h4>
                        <p className="text-xs text-slate-400">
                          {transfer.patient.age_years}y • Local Clinic: {transfer.originHospitalName.split('(')[0]}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {completedCount}/{totalCount} Visits
                        </span>
                        <span className="text-[10px] text-slate-500 block">Milestones</span>
                      </div>
                    </div>

                    {/* Procedure diagnosis */}
                    {directive && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                        <div className="text-slate-300 font-medium">
                          {directive.dischargeDiagnosis}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Consultant: <span className="text-slate-200">{directive.cityDoctorName}</span> • Directives:{' '}
                          <span className="text-teal-300">{directive.medications.length} meds prescribed</span>
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Upazila Checkup Cadence</span>
                        <span>{completedCount === totalCount ? 'All Completed' : 'In Progress'}</span>
                      </div>
                    </div>

                    {/* Open Case Workspace Button */}
                    <button
                      onClick={() => onSelectReverseCareCase(transfer.id)}
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Post-Care Workspace &amp; Tele-Bridge</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
