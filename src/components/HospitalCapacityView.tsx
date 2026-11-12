import React, { useState } from 'react';
import { Hospital, Doctor } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import { Building2, Search, Bed, Stethoscope, MapPin, Plus, Minus, ShieldCheck, Activity } from 'lucide-react';

interface HospitalCapacityViewProps {
  hospitals: Hospital[];
  doctors: Doctor[];
}

export const HospitalCapacityView: React.FC<HospitalCapacityViewProps> = ({ hospitals, doctors }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');

  const filteredHospitals = hospitals.filter((h) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = h.facility_name.toLowerCase().includes(q);
      const matchDist = h.location.district.toLowerCase().includes(q);
      const matchDiv = h.location.division.toLowerCase().includes(q);
      const matchDep = (h.departments || []).some((d) => d.toLowerCase().includes(q));
      if (!matchName && !matchDist && !matchDiv && !matchDep) return false;
    }

    if (divisionFilter !== 'all' && h.location.division.toLowerCase() !== divisionFilter.toLowerCase()) {
      return false;
    }

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
              National City Hospital Bed Capacity &amp; Specialist Roster
            </h2>
            <span className="text-xs bg-teal-950 text-teal-300 border border-teal-800 font-mono px-2 py-0.5 rounded">
              5 City Hospitals in Different Districts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time bed availability tracking across the 5 designated public city hospitals with on-duty specialist consultants. Integrated with automated emergency Upazila dispatch.
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

      {/* Toolbar: Search & Division Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 w-72">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search city hospital, district, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Division:</span>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none font-medium"
          >
            <option value="all">All Divisions</option>
            <option value="Khulna Division">Khulna Division (KMCH &amp; Jashore)</option>
            <option value="Dhaka Division">Dhaka Division (DMCH)</option>
            <option value="Chattogram Division">Chattogram Division (CMCH)</option>
            <option value="Rajshahi Division">Rajshahi Division (RMCH)</option>
          </select>
        </div>
      </div>

      {/* Grid of the 5 City Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHospitals.map((hospital) => {
          const { general_beds, icu_beds, hdu_beds } = hospital.capacity;

          // Find the 1 designated specialist for this city hospital
          const designatedSpecialist = doctors.find(
            (d) =>
              d.role === 'city_specialist' &&
              (d.facility_name.toLowerCase().includes(hospital.location.district.toLowerCase()) ||
                d.district.toLowerCase() === hospital.location.district.toLowerCase())
          );

          return (
            <div
              key={hospital.hospital_id}
              className="bg-slate-900/95 border border-teal-800/80 rounded-xl p-5 space-y-4 shadow-md shadow-teal-950/20"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-teal-400 font-bold">{hospital.hospital_id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700 font-mono">
                    {hospital.location.division}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 leading-snug">{hospital.facility_name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{hospital.location.address}</span>
                </p>
              </div>

              {/* Designated Specialist Box */}
              {designatedSpecialist && (
                <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Designated City Specialist on Duty
                  </span>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-xs">{designatedSpecialist.full_name}</div>
                      <div className="text-[11px] text-emerald-300">{designatedSpecialist.specialty}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 font-mono">
                    Reg: <span className="text-slate-300">{designatedSpecialist.registration_number}</span> •{' '}
                    <span>{designatedSpecialist.availability}</span>
                  </div>
                </div>
              )}

              {/* Bed Capacity Counters with Interactive Simulation Controls */}
              <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-1">
                  <span>Bed Category</span>
                  <span className="font-mono">Occupied / Total (Vacant)</span>
                </div>

                {/* ICU Beds */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-300">ICU Beds</span>
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
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        title="Simulate Admit (+1 Occupied)"
                        onClick={() => handleAdjustBed(hospital.hospital_id, 'icu_beds', 1)}
                        disabled={icu_beds.available === 0}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        title="Simulate Discharge (-1 Occupied)"
                        onClick={() => handleAdjustBed(hospital.hospital_id, 'icu_beds', -1)}
                        disabled={icu_beds.occupied === 0}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* HDU Beds */}
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
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        title="Simulate Admit"
                        onClick={() => handleAdjustBed(hospital.hospital_id, 'hdu_beds', 1)}
                        disabled={hdu_beds.available === 0}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        title="Simulate Discharge"
                        onClick={() => handleAdjustBed(hospital.hospital_id, 'hdu_beds', -1)}
                        disabled={hdu_beds.occupied === 0}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* General Beds */}
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

              {/* Specialties */}
              <div className="text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Specialized Clinical Units
                </span>
                <div className="flex flex-wrap gap-1">
                  {hospital.specialties_available.map((spec, i) => (
                    <span
                      key={i}
                      className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-700"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Details */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Emergency Service: 24/7 OT Active</span>
                <span className="font-mono text-emerald-400 font-semibold">Accepting Referrals</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
