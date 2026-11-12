import React from 'react';
import { Doctor } from '../types/index.ts';
import { Activity, ShieldCheck, UserCheck, Stethoscope, Building2, Users, ArrowLeftRight, HeartPulse } from 'lucide-react';

interface NavbarProps {
  activeDoctor: Doctor;
  doctors: Doctor[];
  onSelectDoctor: (doctor: Doctor) => void;
  activeTab: 'pipeline' | 'reverse_care' | 'hospitals' | 'patients';
  onSelectTab: (tab: 'pipeline' | 'reverse_care' | 'hospitals' | 'patients') => void;
  onOpenEmergencyModal: () => void;
  activeTransfersCount: number;
  reverseCareCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeDoctor,
  doctors,
  onSelectDoctor,
  activeTab,
  onSelectTab,
  onOpenEmergencyModal,
  activeTransfersCount,
  reverseCareCount
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      {/* Top Directorate Ribbon */}
      <div className="bg-teal-950/80 border-b border-teal-800/40 px-4 py-1 text-xs text-teal-200 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">Government of Bangladesh</span>
          <span className="text-teal-400">|</span>
          <span>Directorate General of Health Services (DGHS)</span>
          <span className="text-teal-400">|</span>
          <span className="text-emerald-300 font-mono">BMDC Certified Referral System</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            National Bed Registry: LIVE
          </span>
          <span className="text-slate-400">Emergency Dispatch: 16263</span>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/30 font-black">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Sasthojaal</h1>
              <span className="text-xs bg-teal-900/80 text-teal-300 border border-teal-700/60 px-1.5 py-0.5 rounded font-medium">
                স্বাস্থ্যজাল
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Government Hospital Emergency Referral & Reverse Care Network</p>
          </div>
        </div>

        {/* Doctor Persona Switcher */}
        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 rounded-lg p-1.5 pl-3">
          <div className="flex items-center gap-2 text-xs">
            <Stethoscope className="w-4 h-4 text-teal-400" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-200">{activeDoctor.full_name}</span>
                <span
                  className={`text-[10px] font-semibold px-1 rounded uppercase tracking-wider ${
                    activeDoctor.role === 'local_doctor'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {activeDoctor.role === 'local_doctor' ? 'Local Upazila Doctor' : 'City Specialist'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {activeDoctor.facility_name} • <span className="font-mono text-slate-300">{activeDoctor.registration_number}</span>
              </p>
            </div>
          </div>

          <div className="border-l border-slate-700 pl-2">
            <select
              aria-label="Switch Active Doctor Persona"
              className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 outline-none focus:border-teal-500 cursor-pointer"
              value={activeDoctor.doctor_id}
              onChange={(e) => {
                const doc = doctors.find((d) => d.doctor_id === e.target.value);
                if (doc) onSelectDoctor(doc);
              }}
            >
              <optgroup label="Local Upazila Doctors (Originating Clinic)">
                {doctors
                  .filter((d) => d.role === 'local_doctor')
                  .slice(0, 5)
                  .map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.full_name} ({d.facility_name.split(' ')[0]})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Tertiary Specialists (Receiving Hospitals)">
                {doctors
                  .filter((d) => d.role === 'capital_specialist')
                  .map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.full_name} ({d.specialty} - {d.facility_name.split(' ')[0]})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Emergency Transfer Button */}
        <div>
          <button
            onClick={onOpenEmergencyModal}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-rose-900/40 transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Initiate Emergency Transfer</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => onSelectTab('pipeline')}
          className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'pipeline'
              ? 'border-teal-500 text-teal-300 font-semibold bg-teal-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Active Transfers & Dispatch</span>
          {activeTransfersCount > 0 && (
            <span className="font-mono bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
              {activeTransfersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('reverse_care')}
          className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'reverse_care'
              ? 'border-teal-500 text-teal-300 font-semibold bg-teal-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Reverse Referral & Post-Care Directives</span>
          {reverseCareCount > 0 && (
            <span className="font-mono bg-teal-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
              {reverseCareCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('hospitals')}
          className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'hospitals'
              ? 'border-teal-500 text-teal-300 font-semibold bg-teal-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Live Hospital Bed Capacity</span>
        </button>

        <button
          onClick={() => onSelectTab('patients')}
          className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'patients'
              ? 'border-teal-500 text-teal-300 font-semibold bg-teal-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Government Patient Directory</span>
        </button>
      </div>
    </header>
  );
};
