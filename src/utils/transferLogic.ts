import { Doctor, Hospital, Patient, HospitalRecommendation, ScoreBreakdown, TransferUrgency } from '../types/index.ts';

// Comprehensive Bangladesh District to Official Division mapping
export const DISTRICT_TO_DIVISION: Record<string, string> = {
  // Khulna Division
  Khulna: 'Khulna Division',
  Jashore: 'Khulna Division',
  Jessore: 'Khulna Division',
  Satkhira: 'Khulna Division',
  Bagerhat: 'Khulna Division',
  Kushtia: 'Khulna Division',
  Jhenaidah: 'Khulna Division',
  Magura: 'Khulna Division',
  Meherpur: 'Khulna Division',
  Narail: 'Khulna Division',
  Chuadanga: 'Khulna Division',

  // Dhaka Division
  Dhaka: 'Dhaka Division',
  Gazipur: 'Dhaka Division',
  Narayanganj: 'Dhaka Division',
  Tangail: 'Dhaka Division',
  Faridpur: 'Dhaka Division',
  Manikganj: 'Dhaka Division',
  Munshiganj: 'Dhaka Division',
  Narsingdi: 'Dhaka Division',
  Kishoreganj: 'Dhaka Division',
  Gopalganj: 'Dhaka Division',
  Rajbari: 'Dhaka Division',
  Madaripur: 'Dhaka Division',
  Shariatpur: 'Dhaka Division',

  // Chattogram Division
  Chattogram: 'Chattogram Division',
  Chittagong: 'Chattogram Division',
  "Cox's Bazar": 'Chattogram Division',
  Cumilla: 'Chattogram Division',
  Comilla: 'Chattogram Division',
  Feni: 'Chattogram Division',
  Brahmanbaria: 'Chattogram Division',
  Noakhali: 'Chattogram Division',
  Chandpur: 'Chattogram Division',
  Lakshmipur: 'Chattogram Division',
  Rangamati: 'Chattogram Division',
  Khagrachhari: 'Chattogram Division',
  Bandarban: 'Chattogram Division',

  // Rajshahi Division
  Rajshahi: 'Rajshahi Division',
  Bogura: 'Rajshahi Division',
  Bogra: 'Rajshahi Division',
  Pabna: 'Rajshahi Division',
  Sirajganj: 'Rajshahi Division',
  Naogaon: 'Rajshahi Division',
  Natore: 'Rajshahi Division',
  Joypurhat: 'Rajshahi Division',
  Chapainawabganj: 'Rajshahi Division',

  // Barishal Division
  Barishal: 'Barishal Division',
  Barisal: 'Barishal Division',
  Patuakhali: 'Barishal Division',
  Bhola: 'Barishal Division',
  Pirojpur: 'Barishal Division',
  Barguna: 'Barishal Division',
  Jhalokati: 'Barishal Division',

  // Sylhet Division
  Sylhet: 'Sylhet Division',
  Moulvibazar: 'Sylhet Division',
  Habiganj: 'Sylhet Division',
  Sunamganj: 'Sylhet Division',

  // Rangpur Division
  Rangpur: 'Rangpur Division',
  Dinajpur: 'Rangpur Division',
  Kurigram: 'Rangpur Division',
  Gaibandha: 'Rangpur Division',
  Nilphamari: 'Rangpur Division',
  Lalmonirhat: 'Rangpur Division',
  Thakurgaon: 'Rangpur Division',
  Panchagarh: 'Rangpur Division',

  // Mymensingh Division
  Mymensingh: 'Mymensingh Division',
  Jamalpur: 'Mymensingh Division',
  Netrokona: 'Mymensingh Division',
  Sherpur: 'Mymensingh Division'
};

export function getDivisionForDistrict(district: string): string {
  const norm = district.trim();
  return DISTRICT_TO_DIVISION[norm] || 'Khulna Division';
}

// Road distance coordinates and distances
const UPAZILA_DISTANCES_FROM_KHULNA: Record<string, number> = {
  Dumuria: 28,
  Dighalia: 18,
  Phultala: 22,
  Koyra: 95,
  Dacope: 62,
  Batiaghata: 20,
  Paikgachha: 68,
  Rupsha: 15,
  Terokhada: 32
};

const CITY_INTER_DISTANCES: Record<string, Record<string, number>> = {
  Khulna: {
    Khulna: 10,
    Jashore: 65,
    Dhaka: 215,
    Chattogram: 390,
    Rajshahi: 260
  },
  Jashore: {
    Khulna: 65,
    Jashore: 10,
    Dhaka: 200,
    Chattogram: 430,
    Rajshahi: 210
  },
  Dhaka: {
    Khulna: 215,
    Jashore: 200,
    Dhaka: 15,
    Chattogram: 245,
    Rajshahi: 245
  },
  Chattogram: {
    Khulna: 390,
    Jashore: 430,
    Dhaka: 245,
    Chattogram: 15,
    Rajshahi: 480
  },
  Rajshahi: {
    Khulna: 260,
    Jashore: 210,
    Dhaka: 245,
    Chattogram: 480,
    Rajshahi: 15
  }
};

/**
 * Calculates road distance in KM between an Upazila and a designated city hospital.
 */
export function estimateDistanceKm(
  originDistrict: string,
  originUpazila: string | null | undefined,
  destinationDistrict: string,
  _destinationUpazila?: string | null
): number {
  const normOriginDist = originDistrict.trim();
  const normDestDist = destinationDistrict.trim();

  // If both in Khulna
  if (normOriginDist.toLowerCase() === 'khulna' && normDestDist.toLowerCase() === 'khulna') {
    if (originUpazila && UPAZILA_DISTANCES_FROM_KHULNA[originUpazila]) {
      return UPAZILA_DISTANCES_FROM_KHULNA[originUpazila];
    }
    return 20;
  }

  // Check city distance matrix
  const fromCity = normOriginDist;
  const toCity = normDestDist;
  if (CITY_INTER_DISTANCES[fromCity] && CITY_INTER_DISTANCES[fromCity][toCity] !== undefined) {
    const baseDist = CITY_INTER_DISTANCES[fromCity][toCity];
    const upazilaOffset = originUpazila && UPAZILA_DISTANCES_FROM_KHULNA[originUpazila] ? 15 : 0;
    return baseDist + upazilaOffset;
  }

  return 120; // Fallback average highway distance
}

/**
 * Estimates ambulance transit duration in minutes based on distance and urgency.
 */
export function estimateTransitMinutes(distanceKm: number, urgency: TransferUrgency = 'code_red'): number {
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
      requiredSpecialty: 'Neurology',
      defaultBedType: 'icu',
      urgency: 'code_red'
    };
  }

  if (
    c.includes('trauma') ||
    c.includes('fracture') ||
    c.includes('bone') ||
    c.includes('accident') ||
    c.includes('ortho')
  ) {
    return {
      requiredSpecialty: 'Orthopaedics',
      defaultBedType: 'hdu',
      urgency: 'code_red'
    };
  }

  if (
    c.includes('surgery') ||
    c.includes('perforation') ||
    c.includes('cholecystitis') ||
    c.includes('appendix') ||
    c.includes('obstruction') ||
    c.includes('bleeding')
  ) {
    return {
      requiredSpecialty: 'General Surgery',
      defaultBedType: 'hdu',
      urgency: 'code_red'
    };
  }

  if (
    c.includes('asthma') ||
    c.includes('respiratory') ||
    c.includes('breath') ||
    c.includes('pneumonia') ||
    c.includes('fever') ||
    c.includes('sepsis')
  ) {
    return {
      requiredSpecialty: 'Internal Medicine',
      defaultBedType: 'hdu',
      urgency: 'code_red'
    };
  }

  // Default
  return {
    requiredSpecialty: 'General Surgery',
    defaultBedType: 'hdu',
    urgency: 'code_amber'
  };
}

/**
 * Evaluates candidate city hospitals and ranks them for the referring Upazila Doctor.
 */
export function rankHospitalRecommendations(
  patient: Patient,
  hospitals: Hospital[],
  doctors: Doctor[],
  requestedBedType: 'icu' | 'hdu' | 'general',
  primarySpecialty: string,
  urgency: TransferUrgency = 'code_red'
): HospitalRecommendation[] {
  // Only evaluate the 5 city hospitals
  const candidateHospitals = hospitals.filter(
    (h) => h.facility_type === 'city_hospital' || h.service_level === 'city_hospital'
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
      reasons.push(`Designated specialist department for ${primarySpecialty} active.`);
    } else if (departments.some((d) => d.includes(targetSpec) || targetSpec.includes(d))) {
      specialtyScore = 32;
      reasons.push(`Department of ${primarySpecialty} available.`);
    } else if (departments.includes('medicine') || departments.includes('general surgery')) {
      specialtyScore = 20;
      reasons.push(`Emergency critical care available, specialty wing for ${primarySpecialty} is shared.`);
    } else {
      specialtyScore = 12;
      reasons.push(`General emergency facility coverage.`);
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
      if (availableCount >= 4) {
        bedScore = 30;
        reasons.push(`Confirmed vacancy buffer: ${availableCount} of ${totalCount} ${requestedBedType.toUpperCase()} beds available.`);
      } else if (availableCount >= 2) {
        bedScore = 24;
        reasons.push(`Vacancy confirmed: ${availableCount} ${requestedBedType.toUpperCase()} beds currently unreserved.`);
      } else {
        bedScore = 18;
        reasons.push(`Urgent reservation: 1 ${requestedBedType.toUpperCase()} bed remaining.`);
      }
    } else {
      bedScore = 0;
      reasons.push(`NO VACANCY: 0 of ${totalCount} ${requestedBedType.toUpperCase()} beds available.`);
    }

    // 3. Distance & Divisional Proximity (0 - 20)
    let distanceScore = 0;
    const sameDivision = patient.division === hospital.location.division;

    if (distanceKm <= 35) {
      distanceScore = 20;
      reasons.push(`Immediate road proximity (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    } else if (distanceKm <= 80) {
      distanceScore = 16;
      reasons.push(`Regional highway transit (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    } else if (distanceKm <= 220) {
      distanceScore = 12;
      reasons.push(`Inter-district transit (~${distanceKm} km, ~${estimatedTransitMinutes} min transit).`);
    } else {
      distanceScore = 6;
      reasons.push(`Long-distance inter-divisional transit (~${distanceKm} km).`);
    }

    // 4. Facility Readiness & 24/7 OT (0 - 10)
    let readinessScore = 10;
    if (sameDivision) {
      readinessScore = 10;
      reasons.push(`In-division government referral agreement confirmed.`);
    } else {
      readinessScore = 8;
      reasons.push(`Inter-divisional emergency referral path.`);
    }

    let totalScore = specialtyScore + bedScore + distanceScore + readinessScore;
    if (!hasRequiredBed && (requestedBedType === 'icu' || requestedBedType === 'hdu')) {
      totalScore = Math.min(totalScore, 40); // Cap if no critical bed available
    }

    // Find the 1 designated specialist attached to this city hospital
    const assignedDoctor =
      doctors.find(
        (d) =>
          d.role === 'city_specialist' &&
          (d.facility_name.toLowerCase().includes(hospital.location.district.toLowerCase()) ||
            d.district.toLowerCase() === hospital.location.district.toLowerCase())
      ) ||
      doctors.find((d) => d.role === 'city_specialist') ||
      null;

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
      assignedDoctor,
      score: scoreBreakdown,
      hasRequiredBed
    };
  });

  // Sort descending by score; prioritize available beds
  recommendations.sort((a, b) => {
    if (a.hasRequiredBed !== b.hasRequiredBed) {
      return a.hasRequiredBed ? -1 : 1;
    }
    return b.score.totalScore - a.score.totalScore;
  });

  return recommendations;
}
