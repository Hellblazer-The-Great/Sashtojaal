/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Doctor, Hospital, Patient, TransferReferral } from './types/index.ts';
import { dataService } from './services/dataService.ts';
import { Navbar } from './components/Navbar.tsx';
import { TransferPipelineView } from './components/TransferPipelineView.tsx';
import { ReverseCareHub } from './components/ReverseCareHub.tsx';
import { HospitalCapacityView } from './components/HospitalCapacityView.tsx';
import { PatientRegistryView } from './components/PatientRegistryView.tsx';
import { EmergencyTransferModal } from './components/EmergencyTransferModal.tsx';
import { ReverseDirectiveModal } from './components/ReverseDirectiveModal.tsx';
import { Activity, ShieldCheck, HeartPulse, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [transfers, setTransfers] = useState<TransferReferral[]>([]);

  // Active Doctor Persona
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<'pipeline' | 'reverse_care' | 'hospitals' | 'patients'>('pipeline');

  // Selected reverse care transfer ID
  const [selectedReverseCaseId, setSelectedReverseCaseId] = useState<string | null>(null);

  // Modals
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [transferForReverseModal, setTransferForReverseModal] = useState<TransferReferral | null>(null);
  const [patientForTransferModal, setPatientForTransferModal] = useState<Patient | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function loadData() {
      try {
        const initData = await dataService.initialize();
        setDoctors(initData.doctors);
        setHospitals(initData.hospitals);
        setPatients(initData.patients);
        setTransfers(initData.transfers);

        // Default to Dr. Nabila Khan (Dumuria UHC, local doctor)
        const defaultDoc = initData.doctors.find((d) => d.doctor_id === 'SHJ-D-L-001') || initData.doctors[0];
        setActiveDoctor(defaultDoc || null);

        // Pre-select reverse referral case
        const revCase = initData.transfers.find((t) => t.reverseDirective);
        if (revCase) {
          setSelectedReverseCaseId(revCase.id);
        }

        // Subscribe to live state updates
        unsubscribe = dataService.subscribe(() => {
          setTransfers([...dataService.getTransfers()]);
          setHospitals([...dataService.getHospitals()]);
          setPatients([...dataService.getPatients()]);
        });
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading || !activeDoctor) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white mb-4 animate-pulse shadow-lg shadow-teal-900/50">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Sasthojaal • স্বাস্থ্যজাল</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting Bangladesh Government Hospital Referral Network...</p>
      </div>
    );
  }

  const activeTransfersCount = transfers.filter((t) => t.status === 'in_transit' || t.status === 'pending_dispatch').length;
  const reverseCareCount = transfers.filter((t) => t.reverseDirective || t.status === 'referred_back').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-700 selection:text-white">
      {/* Top Directorate & Doctor Header */}
      <Navbar
        activeDoctor={activeDoctor}
        doctors={doctors}
        onSelectDoctor={(doc) => setActiveDoctor(doc)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenEmergencyModal={() => {
          setPatientForTransferModal(null);
          setIsEmergencyModalOpen(true);
        }}
        activeTransfersCount={activeTransfersCount}
        reverseCareCount={reverseCareCount}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-teal-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl shadow-teal-950/60 flex items-center gap-2 border border-teal-400 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'pipeline' && (
          <TransferPipelineView
            transfers={transfers}
            activeDoctor={activeDoctor}
            hospitals={hospitals}
            onOpenEmergencyModal={() => {
              setPatientForTransferModal(null);
              setIsEmergencyModalOpen(true);
            }}
            onOpenReverseModal={(t) => setTransferForReverseModal(t)}
            onSelectReverseCareCase={(id) => {
              setSelectedReverseCaseId(id);
              setActiveTab('reverse_care');
            }}
          />
        )}

        {activeTab === 'reverse_care' && (
          <ReverseCareHub
            transfers={transfers}
            activeDoctor={activeDoctor}
            selectedTransferId={selectedReverseCaseId}
            onSelectTransfer={(id) => setSelectedReverseCaseId(id)}
            onOpenReverseModal={(t) => setTransferForReverseModal(t)}
          />
        )}

        {activeTab === 'hospitals' && (
          <HospitalCapacityView
            hospitals={hospitals}
          />
        )}

        {activeTab === 'patients' && (
          <PatientRegistryView
            patients={patients}
            onInitiateTransfer={(p) => {
              setPatientForTransferModal(p);
              setIsEmergencyModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">স্বাস্থ্যজাল (Sasthojaal)</span>
            <span>•</span>
            <span>Directorate General of Health Services, Ministry of Health and Family Welfare</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Emergency Transit Hotline: <span className="text-emerald-400 font-bold">16263</span> • BMDC Registry Live
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isEmergencyModalOpen && (
        <EmergencyTransferModal
          isOpen={isEmergencyModalOpen}
          onClose={() => {
            setIsEmergencyModalOpen(false);
            setPatientForTransferModal(null);
          }}
          activeDoctor={activeDoctor}
          hospitals={hospitals}
          doctors={doctors}
          patients={patients}
          preselectedPatient={patientForTransferModal}
          onTransferDispatched={(transferId) => {
            showToast(`Ambulance Transfer ${transferId} dispatched to tertiary center.`);
            setActiveTab('pipeline');
          }}
        />
      )}

      {transferForReverseModal && (
        <ReverseDirectiveModal
          isOpen={!!transferForReverseModal}
          onClose={() => setTransferForReverseModal(null)}
          transfer={transferForReverseModal}
          activeDoctor={activeDoctor}
          onDirectiveIssued={() => {
            showToast(`Reverse Referral Directive issued for ${transferForReverseModal.patient.full_name}. Home recovery initialized.`);
            setSelectedReverseCaseId(transferForReverseModal.id);
            setActiveTab('reverse_care');
          }}
        />
      )}
    </div>
  );
}
