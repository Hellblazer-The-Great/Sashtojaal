import React, { useState } from 'react';
import { Doctor } from '../types/index.ts';
import { ShieldCheck, Stethoscope, Building2, Key, CheckCircle2, Lock, AlertCircle, X, MapPin } from 'lucide-react';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSelectDoctor: (doctor: Doctor) => void;
  isMandatoryLogin?: boolean;
}

export const DoctorAuthModal: React.FC<DoctorAuthModalProps> = ({
  isOpen,
  onClose,
  doctors,
  currentDoctor,
  onSelectDoctor,
  isMandatoryLogin = false
}) => {
  const [bmdcInput, setBmdcInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedBmdc = bmdcInput.trim().toUpperCase();
    const doc = doctors.find(
      (d) => d.registration_number.toUpperCase() === trimmedBmdc || d.identity_number.toUpperCase() === trimmedBmdc
    );

    if (!doc) {
      setErrorMessage('Unregistered BMDC credentials. Please verify your BMDC registration number.');
      return;
    }

    if (pinInput && pinInput !== (doc.pin || '1234')) {
      setErrorMessage('Incorrect Security PIN. Demo PIN is 1234.');
      return;
    }

    onSelectDoctor(doc);
    if (onClose) onClose();
  };

  const handleQuickLogin = (doc: Doctor) => {
    onSelectDoctor(doc);
    if (onClose) onClose();
  };

  const upazilaDoctors = doctors.filter((d) => d.role === 'upazila_doctor');
  const citySpecialists = doctors.filter((d) => d.role === 'city_specialist');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Government Doctor Authentication</h2>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 font-mono px-2 py-0.5 rounded font-semibold">
                  BMDC Certified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Directorate General of Health Services (DGHS) Secure Referral Gateway
              </p>
            </div>
          </div>

          {!isMandatoryLogin && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Active Session Notice */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold">
                {currentDoctor.full_name.charAt(4) || 'D'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{currentDoctor.full_name}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      currentDoctor.role === 'upazila_doctor'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {currentDoctor.role === 'upazila_doctor' ? 'Upazila Doctor' : 'City Specialist'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {currentDoctor.facility_name} • <span className="text-teal-400 font-medium">{currentDoctor.division}</span>
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Current Session
            </span>
          </div>

          {/* Quick Doctor Roster Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Select Doctor from Verified Government Roster
              </span>
              <span className="text-[11px] text-slate-400">One-click simulated BMDC authentication</span>
            </div>

            {/* Group 1: 4 Nearby Upazila Local Doctors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1">
                <span className="font-semibold text-blue-400 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Upazila Doctors (4 Nearby Local Clinics)</span>
                </span>
                <span>Jurisdiction: Restricted to own Division</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {upazilaDoctors.map((doc) => {
                  const isActive = currentDoctor.doctor_id === doc.doctor_id;
                  return (
                    <button
                      type="button"
                      key={doc.doctor_id}
                      onClick={() => handleQuickLogin(doc)}
                      className={`p-3 rounded-xl border text-left w-full transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50 shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{doc.full_name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{doc.facility_name}</div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-slate-900 text-teal-300 border border-slate-800 px-1.5 py-0.5 rounded">
                          {doc.registration_number}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{doc.division}</span>
                        </span>
                        <span className="text-blue-400 font-semibold">{isActive ? '✓ Active' : 'Switch Account →'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 2: 5 City Specialists (1 per City Hospital) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>City Specialists (5 Designated City Hospitals)</span>
                </span>
                <span>1 Specialist per Hospital in Different Districts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {citySpecialists.map((doc) => {
                  const isActive = currentDoctor.doctor_id === doc.doctor_id;
                  return (
                    <button
                      type="button"
                      key={doc.doctor_id}
                      onClick={() => handleQuickLogin(doc)}
                      className={`p-3 rounded-xl border text-left w-full transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{doc.full_name}</div>
                          <div className="text-[11px] text-emerald-300 font-medium">{doc.specialty}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{doc.facility_name}</div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-slate-900 text-teal-300 border border-slate-800 px-1.5 py-0.5 rounded">
                          {doc.registration_number}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{doc.division}</span>
                        </span>
                        <span className="text-emerald-400 font-semibold">{isActive ? '✓ Active' : 'Switch Account →'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Manual Credential Verification Form */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-bold text-slate-200 text-xs block">Or Enter BMDC Security Credentials</span>

            {errorMessage && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleManualLogin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">BMDC Registration No.</label>
                <input
                  type="text"
                  placeholder="e.g. BMDC-A-78214"
                  value={bmdcInput}
                  onChange={(e) => setBmdcInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Security PIN (Demo: 1234)</label>
                <input
                  type="password"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors cursor-pointer"
                >
                  Verify &amp; Sign In
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Official Ministry of Health and Family Welfare Portal</span>
          <span className="font-mono text-[11px] text-teal-400 font-semibold">256-bit Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};
