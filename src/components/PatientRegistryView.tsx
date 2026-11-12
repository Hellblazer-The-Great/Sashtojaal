import React, { useState, useMemo } from 'react';
import { Patient } from '../types/index.ts';
import { Users, Search, Activity, ChevronLeft, ChevronRight, Filter, AlertCircle, Heart } from 'lucide-react';

interface PatientRegistryViewProps {
  patients: Patient[];
  onInitiateTransfer: (patient: Patient) => void;
}

export const PatientRegistryView: React.FC<PatientRegistryViewProps> = ({ patients, onInitiateTransfer }) => {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [sexFilter, setSexFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.full_name.toLowerCase().includes(q);
        const matchId = p.patient_id.toLowerCase().includes(q);
        const matchProb = p.current_problem.toLowerCase().includes(q);
        const matchUpazila = p.upazila.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchProb && !matchUpazila) return false;
      }

      if (districtFilter !== 'all' && p.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (sexFilter !== 'all' && p.sex.toLowerCase() !== sexFilter.toLowerCase()) return false;

      return true;
    });
  }, [patients, search, districtFilter, sexFilter]);

  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Government Public Health Patient Registry
            </h2>
            <span className="text-xs bg-teal-950 text-teal-300 border border-teal-800 font-mono px-2 py-0.5 rounded">
              {patients.length.toLocaleString()} Registered Cases
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            National DGHS electronic health records across Upazila Health Complexes. Local doctors can directly trigger emergency tertiary transfers with complete clinical history.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, diagnosis, or upazila..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
            />
          </div>

          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="all">All Districts</option>
            <option value="Khulna">Khulna</option>
            <option value="Jashore">Jashore</option>
            <option value="Dhaka">Dhaka</option>
          </select>

          <select
            value={sexFilter}
            onChange={(e) => {
              setSexFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPatients.length)} of{' '}
          {filteredPatients.length} cases
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Patient &amp; National ID</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Upazila / District</th>
                <th className="py-3 px-4">Current Condition &amp; Presentation</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching patient records found.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => (
                  <tr key={patient.patient_id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{patient.full_name}</div>
                      <div className="font-mono text-[11px] text-teal-400">{patient.patient_id}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {patient.age_years} yrs • {patient.sex}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-amber-300">
                        {patient.blood_group}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div>{patient.upazila}</div>
                      <div className="text-[10px] text-slate-500">{patient.district}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-200">{patient.current_problem}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">{patient.problem_description}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {patient.symptom_duration}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onInitiateTransfer(patient)}
                        className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-sm shadow-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Transfer Case</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="text-white font-semibold">{currentPage}</span> of{' '}
            <span className="text-white font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
