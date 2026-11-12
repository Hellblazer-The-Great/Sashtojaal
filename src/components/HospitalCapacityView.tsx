import React, { useState } from 'react';
import { Hospital } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import { Building2, Search, Filter, Bed, Phone, ShieldCheck, MapPin, Plus, Minus, Stethoscope } from 'lucide-react';

interface HospitalCapacityViewProps {
  hospitals: Hospital[];
  onOpenEmergencyWithHospital?: (hospital: Hospital) => void;
}

export const HospitalCapacityView: React.FC<HospitalCapacityViewProps> = ({ hospitals }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'tertiary' | 'upazila'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  const filteredHospitals = hospitals.filter((h) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = h.facility_name.toLowerCase().includes(q);
      const matchDist = h.location.district.toLowerCase().includes(q);
      const matchUpazila = h.location.upazila?.toLowerCase().includes(q) || false;
      const matchDep = (h.departments || []).some((d) => d.toLowerCase().includes(q));
      if (!matchName && !matchDist && !matchUpazila && !matchDep) return false;
    }

    // Tier filter
    if (tierFilter === 'tertiary' && h.service_level !== 'district_or_city_referral') return false;
    if (tierFilter === 'upazila' && h.service_level !== 'upazila') return false;

    // District filter
    if (districtFilter !== 'all' && h.location.district.toLowerCase() !== districtFilter.toLowerCase()) return false;

    return true;
  });

  const handleAdjustBed = (hospitalId: string, bedType: 'general_beds' | 'icu_beds' | 'hdu_beds', delta: number) => {
    dataService.adjustBedCount(hospitalId, bedType, delta);
  };

  const totalGeneral = hospitals.reduce((acc, h) => acc + h.capacity.general_beds.available, 0);
  const totalICU = hospitals.reduce((acc, h) => acc + h.capacity.icu_beds.available, 0);
  const totalHDU = hospitals.reduce((acc, h) => acc + h.capacity.hdu_beds.available, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Live Capacity Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              National Hospital Bed Capacity &amp; Infrastructure Matrix
            </h2>
            <span className="text-xs bg-teal-950 text-teal-300 border border-teal-800 font-mono px-2 py-0.5 rounded">
              25 Facilities Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time bed availability tracking across 20 Upazila Health Complexes and 5 City Tertiary Referral Centers. Integrated with the automated triage dispatch algorithm.
          </p>
        </div>

        {/* Live Aggregates */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">ICU BEDS VACANT</span>
            <span className={`text-base font-mono font-bold ${totalICU > 5 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalICU}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">HDU BEDS VACANT</span>
            <span className="text-base font-mono font-bold text-teal-400">{totalHDU}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">GENERAL VACANCY</span>
            <span className="text-base font-mono font-bold text-slate-200">{totalGeneral}</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 w-64">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search facility, upazila, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
            />
          </div>

          {/* Tier buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTierFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                tierFilter === 'all' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All (25)
            </button>
            <button
              onClick={() => setTierFilter('tertiary')}
              className={`px-2.5 py-1 rounded transition-colors ${
                tierFilter === 'tertiary' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tertiary Medical Centers (5)
            </button>
            <button
              onClick={() => setTierFilter('upazila')}
              className={`px-2.5 py-1 rounded transition-colors ${
                tierFilter === 'upazila' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upazila Health Complexes (20)
            </button>
          </div>
        </div>

        {/* District select */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">District:</span>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="all">All Districts</option>
            <option value="Khulna">Khulna</option>
            <option value="Jashore">Jashore</option>
            <option value="Dhaka">Dhaka</option>
          </select>
        </div>
      </div>

      {/* Grid of Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHospitals.map((hospital) => {
          const isTertiary = hospital.service_level === 'district_or_city_referral';
          const { general_beds, icu_beds, hdu_beds } = hospital.capacity;

          return (
            <div
              key={hospital.hospital_id}
              className={`rounded-xl border p-4.5 space-y-3.5 transition-all ${
                isTertiary
                  ? 'bg-slate-900/95 border-teal-800/80 shadow-md shadow-teal-950/20'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-teal-400 font-bold">{hospital.hospital_id}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                        isTertiary
                          ? 'bg-teal-950 text-teal-300 border border-teal-700'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isTertiary ? 'Tertiary Referral Center' : 'Upazila Health Complex'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                    {hospital.facility_name.replace('(TEST RECORD)', '').replace('(TEST)', '')}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>
                      {hospital.location.upazila ? `${hospital.location.upazila}, ` : ''}
                      {hospital.location.district}
                    </span>
                  </p>
                </div>
              </div>

              {/* Bed Capacity Counters with Interactive Demo Adjustments */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 border-b border-slate-800/60 pb-1">
                  <span>Bed Category</span>
                  <span className="font-mono">Occupied / Total (Vacant)</span>
                </div>

                {/* ICU Bed Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-rose-300">ICU Beds</span>
                    {isTertiary && (
                      <span className="text-[9px] bg-rose-950/80 text-rose-400 border border-rose-800 px-1 rounded">
                        Critical
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">
                      {icu_beds.occupied}/{icu_beds.total}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                        icu_beds.available > 0
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {icu_beds.available} free
                    </span>
                    {isTertiary && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          title="Simulate Admit (+1 Occupied)"
                          onClick={() => handleAdjustBed(hospital.hospital_id, 'icu_beds', 1)}
                          disabled={icu_beds.available === 0}
                          className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px]"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <button
                          title="Simulate Discharge (-1 Occupied)"
                          onClick={() => handleAdjustBed(hospital.hospital_id, 'icu_beds', -1)}
                          disabled={icu_beds.occupied === 0}
                          className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px]"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* HDU Bed Row */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">HDU Beds</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">
                      {hdu_beds.occupied}/{hdu_beds.total}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                        hdu_beds.available > 0
                          ? 'bg-teal-950 text-teal-400 border border-teal-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {hdu_beds.available} free
                    </span>
                    {isTertiary && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          title="Simulate Admit"
                          onClick={() => handleAdjustBed(hospital.hospital_id, 'hdu_beds', 1)}
                          disabled={hdu_beds.available === 0}
                          className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px]"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        <button
                          title="Simulate Discharge"
                          onClick={() => handleAdjustBed(hospital.hospital_id, 'hdu_beds', -1)}
                          disabled={hdu_beds.occupied === 0}
                          className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px]"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* General Beds Row */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">General Beds</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">
                      {general_beds.occupied}/{general_beds.total}
                    </span>
                    <span className="font-bold text-slate-200">
                      {general_beds.available} free
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialties / Departments */}
              <div className="text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  {isTertiary ? 'Specialized Departments & Units' : 'Operational Wards'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {(hospital.specialties_available && hospital.specialties_available.length > 0
                    ? hospital.specialties_available
                    : hospital.departments.slice(0, 5)
                  ).map((spec, i) => (
                    <span
                      key={i}
                      className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-700"
                    >
                      {spec}
                    </span>
                  ))}
                  {hospital.departments.length > 5 && (
                    <span className="text-[10px] text-slate-500 py-0.5">+{hospital.departments.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* Footer Details */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Emergency Services: 24/7 Active</span>
                <span className="font-mono text-emerald-400 font-medium">Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
