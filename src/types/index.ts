export type DoctorRole = 'local_doctor' | 'capital_specialist';

export interface Doctor {
  doctor_id: string;
  identity_type: string;
  identity_number: string;
  is_synthetic: boolean;
  full_name: string;
  role: DoctorRole;
  facility_name: string;
  district: string;
  upazila: string | null;
  service_area: string;
  specialty: string;
  qualification: string;
  registration_number: string;
  contact: string;
  availability: string;
  is_active: boolean;
}

export interface BedCapacity {
  total: number;
  occupied: number;
  available: number;
}

export interface HospitalCapacity {
  general_beds: BedCapacity;
  icu_beds: BedCapacity;
  hdu_beds: BedCapacity;
}

export interface HospitalLocation {
  country: string;
  division: string | null;
  district: string;
  upazila: string | null;
  address: string;
}

export interface Hospital {
  hospital_id: string;
  facility_name: string;
  facility_type: 'upazila_health_complex' | 'government_city_hospital';
  ownership: string;
  is_synthetic_record: boolean;
  location: HospitalLocation;
  service_level: 'upazila' | 'district_or_city_referral';
  departments: string[];
  specialties_available: string[];
  capacity: HospitalCapacity;
  services: string[];
  referral_capabilities: string[];
  contact: {
    phone: string;
    email: string;
  };
  operational_status: string;
  last_capacity_update: string;
  capacity_data_note?: string;
}

export interface Patient {
  patient_id: string;
  identity_type: string;
  identity_number: string;
  is_synthetic: boolean;
  full_name: string;
  date_of_birth: string;
  age_years: number;
  sex: 'Male' | 'Female' | 'Other';
  height_cm: number;
  weight_kg: number;
  blood_group: string;
  district: string;
  upazila: string;
  current_problem: string;
  problem_description: string;
  symptom_duration: string;
  known_allergies: string;
  chronic_conditions: string[];
  last_checkup_date: string;
  record_status?: string;
  vitals?: {
    bpSystolic: number;
    bpDiastolic: number;
    heartRate: number;
    spo2: number;
    temperatureF: number;
    gcsScore?: number;
  };
}

export type TransferUrgency = 'code_red' | 'code_amber' | 'code_yellow';

export type TransferStatus =
  | 'pending_dispatch'
  | 'in_transit'
  | 'admitted_tertiary'
  | 'in_treatment'
  | 'treatment_completed'
  | 'referred_back'
  | 'recovered_closed';

export interface ScoreBreakdown {
  specialtyMatchScore: number; // 0 to 40
  bedAvailabilityScore: number; // 0 to 30
  distanceScore: number; // 0 to 20
  facilityReadinessScore: number; // 0 to 10
  totalScore: number; // 0 to 100
  distanceKm: number;
  estimatedTransitMinutes: number;
  reasoning: string[];
}

export interface HospitalRecommendation {
  hospital: Hospital;
  assignedDoctor: Doctor | null;
  score: ScoreBreakdown;
  hasRequiredBed: boolean;
}

export interface MedicationDirective {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export type WoundCondition = 'clean_healing' | 'erythema_mild' | 'discharge_warning' | 'dehiscence_critical';

export interface FollowUpMilestone {
  dayLabel: string; // e.g. "Day 3 Post-Discharge", "Day 7", "Day 14"
  scheduledDate: string;
  recommendedChecks: string[]; // e.g. "Suture line inspection", "SpO2 & BP", "CBC count"
  completed: boolean;
  completedAt?: string;
  doctorNotes?: string;
  recordedVitals?: {
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    spo2?: number;
    temperatureF?: number;
    woundCondition?: WoundCondition;
  };
}

export interface DoctorChatMessage {
  id: string;
  senderDoctorId: string;
  senderName: string;
  senderRole: DoctorRole;
  senderFacility: string;
  timestamp: string;
  content: string;
  isUrgent?: boolean;
  attachmentType?: 'vitals' | 'wound_photo_note' | 'lab_report';
}

export interface ReverseReferralDirective {
  id: string;
  referralId: string;
  issuedAt: string;
  cityDoctorId: string;
  cityDoctorName: string;
  cityDoctorSpecialty: string;
  cityFacilityName: string;
  localDoctorId: string;
  localDoctorName: string;
  localFacilityName: string;
  procedureSummary: string;
  operativeNotes: string;
  dischargeDiagnosis: string;
  patientConditionAtDischarge: 'Stable' | 'Guarded' | 'Ambulatory';
  medications: MedicationDirective[];
  localCareDirectives: {
    woundCare: string;
    drainManagement?: string;
    sutureRemovalDate?: string;
    dietaryInstructions: string;
    activityMobility: string;
  };
  redFlagWarnings: string[];
  scheduledMilestones: FollowUpMilestone[];
  chatMessages: DoctorChatMessage[];
}

export interface TransferReferral {
  id: string; // e.g. "DGHS-REF-2026-8841"
  patient: Patient;
  localDoctor: Doctor;
  originHospitalName: string;
  originDistrict: string;
  originUpazila: string;
  targetHospital: Hospital;
  targetDoctor: Doctor;
  urgency: TransferUrgency;
  requiredBedType: 'icu' | 'hdu' | 'general';
  clinicalSummary: string;
  initialVitals: {
    bp: string;
    heartRate: number;
    spo2: number;
    temp: number;
    gcs: number;
  };
  recommendedScore: number;
  createdAt: string;
  transitStartedAt?: string;
  admittedAt?: string;
  status: TransferStatus;
  ambulanceId?: string;
  transitEstimatedMinutes: number;
  reverseDirective?: ReverseReferralDirective;
}
