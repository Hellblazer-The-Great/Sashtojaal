import { Doctor, Hospital, Patient, HospitalRecommendation, ScoreBreakdown, TransferUrgency } from '../types/index.ts';

// Approximate geographic coordinates or road distance table for Bangladesh districts
interface GeoCoord {
  lat: number;
  lng: number;
}

const DISTRICT_COORDS: Record<string, GeoCoord> = {
  Khulna: { lat: 22.8456, lng: 89.5403 },
  Jashore: { lat: 23.1664, lng: 89.2081 },
  Jessore: { lat: 23.1664, lng: 89.2081 },
  Satkhira: { lat: 22.7185, lng: 89.0705 },
  Bagerhat: { lat: 22.6602, lng: 89.7895 },
  Dhaka: { lat: 23.8103, lng: 90.4125 },
  Chattogram: { lat: 22.3569, lng: 91.7832 },
  Rajshahi: { lat: 24.3745, lng: 88.6042 },
  Sylhet: { lat: 24.8949, lng: 91.8687 },
  Barishal: { lat: 22.7010, lng: 90.3535 },
  Cumilla: { lat: 23.4682, lng: 91.1788 },
  Kushtia: { lat: 23.9013, lng: 89.1205 }
};

// Upazila offset estimates (distance from district headquarters in km)
const UPAZILA_DISTANCES_FROM_KHULNA: Record<string, number> = {
  Dumuria: 28,
  Dighalia: 18,
  Koyra: 95,
  Dacope: 62,
  Batiaghata: 20,
  Paikgachha: 68,
  Phultala: 22,
  Rupsha: 15,
  Terokhada: 32
};

/**
 * Calculates approximate road distance in KM between an origin upazila/district
 * and a destination hospital.
 */
export function estimateDistanceKm(
  originDistrict: string,
  originUpazila: string | null | undefined,
  destinationDistrict: string,
  destinationUpazila?: string | null
): number {
  const normOriginDist = originDistrict.trim();
  const normDestDist = destinationDistrict.trim();

  // If both are in Khulna
  if (normOriginDist.toLowerCase() === 'khulna' && normDestDist.toLowerCase() === 'khulna') {
    if (originUpazila && UPAZILA_DISTANCES_FROM_KHULNA[originUpazila]) {
      return UPAZILA_DISTANCES_FROM_KHULNA[originUpazila];
    }
    return 25;
  }

  // Khulna to Jashore
  if (
    (normOriginDist.toLowerCase() === 'khulna' && normDestDist.toLowerCase() === 'jashore') ||
    (normOriginDist.toLowerCase() === 'jashore' && normDestDist.toLowerCase() === 'khulna')
  ) {
    const base = 65;
    const upazilaOffset = originUpazila && UPAZILA_DISTANCES_FROM_KHULNA[originUpazila] ? 15 : 0;
    return base + upazilaOffset;
  }

  // Khulna to Dhaka
  if (
    (normOriginDist.toLowerCase() === 'khulna' && normDestDist.toLowerCase() === 'dhaka') ||
    (normOriginDist.toLowerCase() === 'dhaka' && normDestDist.toLowerCase() === 'khulna')
  ) {
    const base = 215; // via Padma Bridge highway
    const upazilaOffset = originUpazila && UPAZILA_DISTANCES_FROM_KHULNA[originUpazila] ? 20 : 0;
    return base + upazilaOffset;
  }

  // Jashore to Dhaka
  if (
    (normOriginDist.toLowerCase() === 'jashore' && normDestDist.toLowerCase() === 'dhaka') ||
    (normOriginDist.toLowerCase() === 'dhaka' && normDestDist.toLowerCase() === 'jashore')
  ) {
    return 200;
  }

  // Fallback Haversine between district coordinates
  const c1 = DISTRICT_COORDS[normOriginDist] || DISTRICT_COORDS['Khulna'];
  const c2 = DISTRICT_COORDS[normDestDist] || DISTRICT_COORDS['Dhaka'];

  const R = 6371; // Earth radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const haversineDist = R * c;

  // Road distance is roughly 1.35x crow-flies distance in Bangladesh
  return Math.round(haversineDist * 1.35);
}

/**
 * Estimates ambulance transit duration in minutes based on distance and urgency.
 */
export function estimateTransitMinutes(distanceKm: number, urgency: TransferUrgency = 'code_red'): number {
  // Average emergency ambulance speed:
  // Code Red with sirens: ~50-60 km/h average factoring rural roads & highway
  // Code Amber: ~45 km/h
  // Code Yellow: ~40 km/h
  let avgKmh = 50;
  if (urgency === 'code_red') avgKmh = 55;
  else if (urgency === 'code_amber') avgKmh = 45;
  else avgKmh = 40;

  const hours = distanceKm / avgKmh;
  const minutes = Math.round(hours * 60) + 10; // add 10 min dispatch prep
  return Math.max(15, minutes);
}

/**
 * Maps a patient's problem/condition to primary specialties and bed requirements.
 */
export function inferClinicalNeeds(condition: string): {
  requiredSpecialty: string;
  secondarySpecialty?: string;
  defaultBedType: 'icu' | 'hdu' | 'general';
  urgency: TransferUrgency;
} {
  const c = condition.toLowerCase();

  if (
    c.includes('cardiac') ||
    c.includes('myocardial') ||
    c.includes('heart') ||
    c.includes('chest pain') ||
    c.includes('infarction')
  ) {
    return {
      requiredSpecialty: 'Cardiology',
      secondarySpecialty: 'Cardiothoracic Surgery',
      defaultBedType: 'icu',
      urgency: 'code_red'
    };
  }

  if (
    c.includes('stroke') ||
    c.includes('neuro') ||
    c.includes('brain') ||
    c.includes('paralysis') ||
    c.includes('hemiplegia') ||
    c.includes('headache') ||
    c.includes('head trauma') ||
    c.includes('loss of consciousness')
  ) {
    return {
      requiredSpecialty: 'Neurosurgery',
      secondarySpecialty: 'Neurology',
      defaultBedType: 'icu',
      urgency: 'code_red'
    };
  }

  if (
    c.includes('asthma') ||
    c.includes('respiratory') ||
    c.includes('breath') ||
    c.includes('dyspnea') ||
    c.includes('pneumonia') ||
    c.includes('ards')
  ) {
    return {
      requiredSpecialty: 'Medicine',
      secondarySpecialty: 'Internal Medicine',
      defaultBedType: 'hdu',
      urgency: 'code_red'
    };
  }

  if (
    c.includes('trauma') ||
    c.includes('fracture') ||
    c.includes('accident') ||
    c.includes('perforation') ||
    c.includes('bleeding') ||
    c.includes('surgery')
  ) {
    return {
      requiredSpecialty: 'General Surgery',
      secondarySpecialty: 'Orthopaedics',
      defaultBedType: 'hdu',
      urgency: 'code_red'
    };
  }

  if (c.includes('kidney') || c.includes('renal') || c.includes('dialysis') || c.includes('anuria')) {
    return {
      requiredSpecialty: 'Nephrology',
      secondarySpecialty: 'Urology',
      defaultBedType: 'hdu',
      urgency: 'code_amber'
    };
  }

  if (c.includes('diabet') || c.includes('endocrine') || c.includes('thyroid') || c.includes('ketoacidosis')) {
    return {
      requiredSpecialty: 'Endocrinology',
      secondarySpecialty: 'Medicine',
      defaultBedType: 'general',
      urgency: 'code_amber'
    };
  }

  // Default
  return {
    requiredSpecialty: 'Internal Medicine',
    secondarySpecialty: 'General Surgery',
    defaultBedType: 'hdu',
    urgency: 'code_amber'
  };
}

/**
 * Evaluates candidate hospitals and ranks them with an explainable scoring matrix.
 */
export function rankHospitalRecommendations(
  patient: Patient,
  hospitals: Hospital[],
  doctors: Doctor[],
  requestedBedType: 'icu' | 'hdu' | 'general',
  primarySpecialty: string,
  urgency: TransferUrgency = 'code_red'
): HospitalRecommendation[] {
  // Only evaluate tertiary / specialized referral hospitals with critical capabilities
  const candidateHospitals = hospitals.filter(
    (h) => h.service_level === 'district_or_city_referral' || h.facility_type === 'government_city_hospital'
  );

  const recommendations: HospitalRecommendation[] = candidateHospitals.map((hospital) => {
    const distanceKm = estimateDistanceKm(
      patient.district,
      patient.upazila,
      hospital.location.district,
      hospital.location.upazila
    );
    const estimatedTransitMinutes = estimateTransitMinutes(distanceKm, urgency);

    const reasons: string[] = [];

    // 1. Specialty & Department Match Score (0 - 40)
    let specialtyScore = 0;
    const specialties = (hospital.specialties_available || []).map((s) => s.toLowerCase());
    const departments = (hospital.departments || []).map((d) => d.toLowerCase());
    const targetSpec = primarySpecialty.toLowerCase();

    if (specialties.includes(targetSpec)) {
      specialtyScore = 40;
      reasons.push(`Direct designated specialty wing for ${primarySpecialty} available.`);
    } else if (departments.some((d) => d.includes(targetSpec) || targetSpec.includes(d))) {
      specialtyScore = 32;
      reasons.push(`Active Department of ${primarySpecialty} operational.`);
    } else if (departments.includes('medicine') || departments.includes('general surgery')) {
      specialtyScore = 20;
      reasons.push(`General emergency tertiary care available, though specialized ${primarySpecialty} unit is limited.`);
    } else {
      specialtyScore = 10;
      reasons.push(`Limited specialty coverage for ${primarySpecialty}.`);
    }

    // 2. Bed Availability Score (0 - 30)
    let bedScore = 0;
    let hasRequiredBed = false;
    let availableCount = 0;
    let totalCount = 0;

    if (requestedBedType === 'icu') {
      availableCount = hospital.capacity.icu_beds.available;
      totalCount = hospital.capacity.icu_beds.total;
    } else if (requestedBedType === 'hdu') {
      availableCount = hospital.capacity.hdu_beds.available;
      totalCount = hospital.capacity.hdu_beds.total;
    } else {
      availableCount = hospital.capacity.general_beds.available;
      totalCount = hospital.capacity.general_beds.total;
    }

    hasRequiredBed = availableCount > 0;

    if (hasRequiredBed) {
      if (availableCount >= 5) {
        bedScore = 30;
        reasons.push(`Sufficient bed buffer: ${availableCount} of ${totalCount} ${requestedBedType.toUpperCase()} beds available.`);
      } else if (availableCount >= 2) {
        bedScore = 25;
        reasons.push(`Confirmed vacancy: ${availableCount} ${requestedBedType.toUpperCase()} beds currently unallocated.`);
      } else {
        bedScore = 18;
        reasons.push(`CRITICAL NOTICE: Only 1 ${requestedBedType.toUpperCase()} bed remaining! Immediate reservation required.`);
      }
    } else {
      bedScore = 0;
      reasons.push(`NO VACANCY: 0 of ${totalCount} ${requestedBedType.toUpperCase()} beds available currently.`);
    }

    // 3. Proximity / Distance Score (0 - 20)
    let distanceScore = 0;
    if (distanceKm <= 35) {
      distanceScore = 20;
      reasons.push(`Immediate local proximity (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    } else if (distanceKm <= 75) {
      distanceScore = 16;
      reasons.push(`Adjacent district transit (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    } else if (distanceKm <= 150) {
      distanceScore = 12;
      reasons.push(`Inter-district highway transit (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    } else if (distanceKm <= 250) {
      distanceScore = 8;
      reasons.push(`Long-distance arterial transfer (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    } else {
      distanceScore = 4;
      reasons.push(`High transit distance (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    }

    // 4. Facility Readiness & Level (0 - 10)
    let readinessScore = 10;
    if (hospital.services.includes('emergency') && hospital.services.includes('surgery')) {
      readinessScore = 10;
      reasons.push(`24/7 emergency theatre and intensive care readiness verified.`);
    } else {
      readinessScore = 7;
    }

    // Total Score calculation
    // If no required bed is available for ICU/HDU code red, penalize score heavily
    let totalScore = specialtyScore + bedScore + distanceScore + readinessScore;
    if (!hasRequiredBed && (requestedBedType === 'icu' || requestedBedType === 'hdu')) {
      totalScore = Math.min(totalScore, 40); // Cap at 40 if zero critical beds
    }

    // Doctor Auto-Assignment
    // Find specialists affiliated with this hospital or matching specialty in capital/city roster
    const receivingDoctors = doctors.filter((d) => d.role === 'capital_specialist' && d.is_active);

    // Prefer exact specialty match
    let matchedDoc = receivingDoctors.find(
      (d) =>
        d.specialty.toLowerCase() === primarySpecialty.toLowerCase() ||
        (d.facility_name.toLowerCase().includes(hospital.location.district.toLowerCase()) &&
          d.specialty.toLowerCase() === primarySpecialty.toLowerCase())
    );

    if (!matchedDoc) {
      // Secondary fallback
      matchedDoc = receivingDoctors.find(
        (d) =>
          d.specialty.toLowerCase().includes('medicine') ||
          d.specialty.toLowerCase().includes('cardio') ||
          d.specialty.toLowerCase().includes('neuro')
      );
    }

    if (!matchedDoc && receivingDoctors.length > 0) {
      matchedDoc = receivingDoctors[0];
    }

    const scoreBreakdown: ScoreBreakdown = {
      specialtyMatchScore: specialtyScore,
      bedAvailabilityScore: bedScore,
      distanceScore,
      facilityReadinessScore: readinessScore,
      totalScore,
      distanceKm,
      estimatedTransitMinutes,
      reasoning: reasons
    };

    return {
      hospital,
      assignedDoctor: matchedDoc || null,
      score: scoreBreakdown,
      hasRequiredBed
    };
  });

  // Sort descending by score; prioritize hospitals with bed availability
  recommendations.sort((a, b) => {
    if (a.hasRequiredBed !== b.hasRequiredBed) {
      return a.hasRequiredBed ? -1 : 1;
    }
    return b.score.totalScore - a.score.totalScore;
  });

  return recommendations;
}
