import { Doctor, Hospital, Patient, TransferReferral, ReverseReferralDirective, DoctorChatMessage, FollowUpMilestone } from '../types/index.ts';
import { getDivisionForDistrict } from '../utils/transferLogic.ts';

const STORAGE_KEYS = {
  TRANSFERS: 'sasthojaal_transfers_v2',
  HOSPITALS_STATE: 'sasthojaal_hospitals_state_v2',
  AUTH_DOCTOR_ID: 'sasthojaal_auth_doctor_id_v2'
};

// 5 Dedicated City Hospitals across different Bangladesh districts
export const FIVE_CITY_HOSPITALS: Hospital[] = [
  {
    hospital_id: 'SHJ-HOSP-KMCH',
    facility_name: 'Khulna Medical College Hospital',
    facility_type: 'city_hospital',
    ownership: 'government',
    is_synthetic_record: true,
    location: {
      country: 'Bangladesh',
      division: 'Khulna Division',
      district: 'Khulna',
      upazila: null,
      address: 'Boyra, Khulna - 9000'
    },
    service_level: 'city_hospital',
    departments: ['General Surgery', 'Medicine', 'Cardiology', 'Orthopaedics', 'Emergency', 'ICU', 'HDU'],
    specialties_available: ['General Surgery', 'Laparoscopic Surgery', 'Cardiology', 'Gastroenterology'],
    capacity: {
      general_beds: { total: 500, occupied: 432, available: 68 },
      icu_beds: { total: 10, occupied: 7, available: 3 },
      hdu_beds: { total: 10, occupied: 6, available: 4 }
    },
    services: ['emergency', 'surgery', 'inpatient', 'diagnostics'],
    referral_capabilities: ['upazila_health_complex'],
    contact: { phone: '041-760350', email: 'director@kmch.gov.bd' },
    operational_status: 'operational',
    last_capacity_update: new Date().toISOString()
  },
  {
    hospital_id: 'SHJ-HOSP-DMCH',
    facility_name: 'Dhaka Medical College Hospital',
    facility_type: 'city_hospital',
    ownership: 'government',
    is_synthetic_record: true,
    location: {
      country: 'Bangladesh',
      division: 'Dhaka Division',
      district: 'Dhaka',
      upazila: null,
      address: 'Secretariat Road, Ramna, Dhaka - 1000'
    },
    service_level: 'city_hospital',
    departments: ['Cardiology', 'Neurosurgery', 'General Surgery', 'Medicine', 'Emergency', 'CCU', 'ICU'],
    specialties_available: ['Cardiology', 'Interventional Cardiology', 'Neurosurgery', 'Critical Care'],
    capacity: {
      general_beds: { total: 800, occupied: 710, available: 90 },
      icu_beds: { total: 16, occupied: 12, available: 4 },
      hdu_beds: { total: 14, occupied: 9, available: 5 }
    },
    services: ['emergency', 'surgery', 'inpatient', 'cath_lab'],
    referral_capabilities: ['upazila_health_complex'],
    contact: { phone: '02-55165088', email: 'director@dmch.gov.bd' },
    operational_status: 'operational',
    last_capacity_update: new Date().toISOString()
  },
  {
    hospital_id: 'SHJ-HOSP-JASH',
    facility_name: 'Jashore 250 Bed General Hospital',
    facility_type: 'city_hospital',
    ownership: 'government',
    is_synthetic_record: true,
    location: {
      country: 'Bangladesh',
      division: 'Khulna Division',
      district: 'Jashore',
      upazila: null,
      address: 'Hospital Road, Jashore Sadar, Jashore'
    },
    service_level: 'city_hospital',
    departments: ['Orthopaedics', 'General Surgery', 'Medicine', 'Paediatrics', 'Emergency', 'ICU'],
    specialties_available: ['Orthopaedics', 'Trauma Surgery', 'General Surgery', 'Emergency Care'],
    capacity: {
      general_beds: { total: 250, occupied: 215, available: 35 },
      icu_beds: { total: 8, occupied: 6, available: 2 },
      hdu_beds: { total: 6, occupied: 4, available: 2 }
    },
    services: ['emergency', 'surgery', 'inpatient'],
    referral_capabilities: ['upazila_health_complex'],
    contact: { phone: '0421-68520', email: 'ms@jashore250bed.gov.bd' },
    operational_status: 'operational',
    last_capacity_update: new Date().toISOString()
  },
  {
    hospital_id: 'SHJ-HOSP-CMCH',
    facility_name: 'Chattogram Medical College Hospital',
    facility_type: 'city_hospital',
    ownership: 'government',
    is_synthetic_record: true,
    location: {
      country: 'Bangladesh',
      division: 'Chattogram Division',
      district: 'Chattogram',
      upazila: null,
      address: 'KB Fazlul Kader Road, Panchlaish, Chattogram'
    },
    service_level: 'city_hospital',
    departments: ['Neurology', 'Neurosurgery', 'Cardiology', 'General Surgery', 'ICU', 'HDU'],
    specialties_available: ['Neurology', 'Neurosurgery', 'Stroke Care', 'Cardiology'],
    capacity: {
      general_beds: { total: 600, occupied: 520, available: 80 },
      icu_beds: { total: 12, occupied: 9, available: 3 },
      hdu_beds: { total: 10, occupied: 7, available: 3 }
    },
    services: ['emergency', 'surgery', 'inpatient', 'neuro_diagnostics'],
    referral_capabilities: ['upazila_health_complex'],
    contact: { phone: '031-619400', email: 'director@cmch.gov.bd' },
    operational_status: 'operational',
    last_capacity_update: new Date().toISOString()
  },
  {
    hospital_id: 'SHJ-HOSP-RMCH',
    facility_name: 'Rajshahi Medical College Hospital',
    facility_type: 'city_hospital',
    ownership: 'government',
    is_synthetic_record: true,
    location: {
      country: 'Bangladesh',
      division: 'Rajshahi Division',
      district: 'Rajshahi',
      upazila: null,
      address: 'Laxmipur, Rajshahi - 6000'
    },
    service_level: 'city_hospital',
    departments: ['Internal Medicine', 'Nephrology', 'Critical Care', 'General Surgery', 'ICU', 'HDU'],
    specialties_available: ['Internal Medicine', 'Critical Care', 'Nephrology', 'Dialysis'],
    capacity: {
      general_beds: { total: 550, occupied: 470, available: 80 },
      icu_beds: { total: 10, occupied: 7, available: 3 },
      hdu_beds: { total: 8, occupied: 5, available: 3 }
    },
    services: ['emergency', 'surgery', 'inpatient', 'dialysis'],
    referral_capabilities: ['upazila_health_complex'],
    contact: { phone: '0721-772150', email: 'director@rmch.gov.bd' },
    operational_status: 'operational',
    last_capacity_update: new Date().toISOString()
  }
];

// Exact Doctor Roster: 5 City Specialists (1 per city hospital) + 4 Nearby Upazila Local Doctors
export const REGISTERED_DOCTORS: Doctor[] = [
  // 5 City Specialists
  {
    doctor_id: 'DOC-SPEC-01',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-41290',
    is_synthetic: true,
    full_name: 'Dr. Sharmeen Akhter',
    role: 'city_specialist',
    facility_name: 'Khulna Medical College Hospital',
    division: 'Khulna Division',
    district: 'Khulna',
    upazila: null,
    service_area: 'city_hospital',
    specialty: 'General & Laparoscopic Surgery',
    qualification: 'MBBS, FCPS (Surgery)',
    registration_number: 'BMDC-A-41290',
    contact: '01711-412900',
    availability: '24/7 On-Call Emergency & OT',
    is_active: true,
    pin: '1234'
  },
  {
    doctor_id: 'DOC-SPEC-02',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-32851',
    is_synthetic: true,
    full_name: 'Dr. Kazi Mahfuzur Rahman',
    role: 'city_specialist',
    facility_name: 'Dhaka Medical College Hospital',
    division: 'Dhaka Division',
    district: 'Dhaka',
    upazila: null,
    service_area: 'city_hospital',
    specialty: 'Cardiology & CCU',
    qualification: 'MBBS, MD, FCPS (Cardiology)',
    registration_number: 'BMDC-A-32851',
    contact: '01819-328510',
    availability: '24/7 Emergency Cath Lab',
    is_active: true,
    pin: '1234'
  },
  {
    doctor_id: 'DOC-SPEC-03',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-54910',
    is_synthetic: true,
    full_name: 'Dr. Md. Tariqul Islam',
    role: 'city_specialist',
    facility_name: 'Jashore 250 Bed General Hospital',
    division: 'Khulna Division',
    district: 'Jashore',
    upazila: null,
    service_area: 'city_hospital',
    specialty: 'Orthopaedics & Trauma Surgery',
    qualification: 'MBBS, MS (Orthopaedics)',
    registration_number: 'BMDC-A-54910',
    contact: '01914-549100',
    availability: 'Emergency Trauma Wing',
    is_active: true,
    pin: '1234'
  },
  {
    doctor_id: 'DOC-SPEC-04',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-62184',
    is_synthetic: true,
    full_name: 'Dr. Nusrat Jahan Chowdhury',
    role: 'city_specialist',
    facility_name: 'Chattogram Medical College Hospital',
    division: 'Chattogram Division',
    district: 'Chattogram',
    upazila: null,
    service_area: 'city_hospital',
    specialty: 'Neurology & Neuro-Critical Care',
    qualification: 'MBBS, FCPS (Neurology)',
    registration_number: 'BMDC-A-62184',
    contact: '01713-621840',
    availability: 'Stroke & Neuro-ICU Unit',
    is_active: true,
    pin: '1234'
  },
  {
    doctor_id: 'DOC-SPEC-05',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-49273',
    is_synthetic: true,
    full_name: 'Dr. Mostafa Kamal',
    role: 'city_specialist',
    facility_name: 'Rajshahi Medical College Hospital',
    division: 'Rajshahi Division',
    district: 'Rajshahi',
    upazila: null,
    service_area: 'city_hospital',
    specialty: 'Internal & Critical Care Medicine',
    qualification: 'MBBS, MD (Internal Medicine)',
    registration_number: 'BMDC-A-49273',
    contact: '01712-492730',
    availability: 'Medical ICU & HDU',
    is_active: true,
    pin: '1234'
  },

  // 4 Nearby Upazila Local Doctors (3 in Khulna Division nearby each other + 1 in Dhaka Division)
  {
    doctor_id: 'DOC-UPZ-01',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-78214',
    is_synthetic: true,
    full_name: 'Dr. Nabila Khan',
    role: 'upazila_doctor',
    facility_name: 'Dumuria Upazila Health Complex',
    division: 'Khulna Division',
    district: 'Khulna',
    upazila: 'Dumuria',
    service_area: 'upazila',
    specialty: 'General Medicine & Emergency Care',
    qualification: 'MBBS, BCS (Health)',
    registration_number: 'BMDC-A-78214',
    contact: '01715-782140',
    availability: 'Sat–Thu 08:30–14:30',
    is_active: true,
    pin: '1234'
  },
  {
    doctor_id: 'DOC-UPZ-02',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-81042',
    is_synthetic: true,
    full_name: 'Dr. Tanvir Hossain',
    role: 'upazila_doctor',
    facility_name: 'Dighalia Upazila Health Complex',
    division: 'Khulna Division',
    district: 'Khulna',
    upazila: 'Dighalia',
    service_area: 'upazila',
    specialty: 'General Medicine & Family Health',
    qualification: 'MBBS, BCS (Health)',
    registration_number: 'BMDC-A-81042',
    contact: '01716-810420',
    availability: 'Sat–Thu 08:30–14:30',
    is_active: true,
    pin: '1234'
  },
  {
    doctor_id: 'DOC-UPZ-03',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-85319',
    is_synthetic: true,
    full_name: 'Dr. Farhana Yasmin',
    role: 'upazila_doctor',
    facility_name: 'Phultala Upazila Health Complex',
    division: 'Khulna Division',
    district: 'Khulna',
    upazila: 'Phultala',
    service_area: 'upazila',
    specialty: 'General Medicine & Maternal Care',
    qualification: 'MBBS, BCS (Health)',
    registration_number: 'BMDC-A-85319',
    contact: '01718-853190',
    availability: 'Sat–Thu 08:30–14:30',
    is_active: true,
    pin: '1234'
  },
  {
    doctor_id: 'DOC-UPZ-04',
    identity_type: 'BMDC_REGISTRATION_ID',
    identity_number: 'BMDC-A-72491',
    is_synthetic: true,
    full_name: 'Dr. Sajjad Ahmed',
    role: 'upazila_doctor',
    facility_name: 'Savar Upazila Health Complex',
    division: 'Dhaka Division',
    district: 'Dhaka',
    upazila: 'Savar',
    service_area: 'upazila',
    specialty: 'General Medicine & Emergency Triage',
    qualification: 'MBBS, BCS (Health)',
    registration_number: 'BMDC-A-72491',
    contact: '01817-724910',
    availability: 'Sat–Thu 08:30–14:30',
    is_active: true,
    pin: '1234'
  }
];

// Initial seed referrals establishing clear case histories between the Upazila Doctor and City Specialist
function createSeedReferrals(doctors: Doctor[], hospitals: Hospital[], patients: Patient[]): TransferReferral[] {
  const upzDocNabila = doctors.find((d) => d.doctor_id === 'DOC-UPZ-01')!;
  const upzDocTanvir = doctors.find((d) => d.doctor_id === 'DOC-UPZ-02')!;
  const upzDocSajjad = doctors.find((d) => d.doctor_id === 'DOC-UPZ-04')!;

  const specSharmeen = doctors.find((d) => d.doctor_id === 'DOC-SPEC-01')!; // Khulna Medical College
  const specMahfuzur = doctors.find((d) => d.doctor_id === 'DOC-SPEC-02')!; // Dhaka Medical College
  const specTariqul = doctors.find((d) => d.doctor_id === 'DOC-SPEC-03')!; // Jashore 250 Bed

  const hospKMCH = hospitals.find((h) => h.hospital_id === 'SHJ-HOSP-KMCH')!;
  const hospDMCH = hospitals.find((h) => h.hospital_id === 'SHJ-HOSP-DMCH')!;
  const hospJASH = hospitals.find((h) => h.hospital_id === 'SHJ-HOSP-JASH')!;

  // Patient 1: In Khulna Division (Dumuria) - Managed by Dr. Nabila Khan & Dr. Sharmeen Akhter
  const p1: Patient = {
    patient_id: 'SHJ-P-000002',
    identity_type: 'SASTHOJAL_TEST_ID',
    identity_number: 'TEST-P-000002',
    is_synthetic: true,
    full_name: 'Sohana Chowdhury',
    date_of_birth: '1962-02-17',
    age_years: 64,
    sex: 'Female',
    height_cm: 156,
    weight_kg: 62,
    blood_group: 'A-',
    division: 'Khulna Division',
    district: 'Khulna',
    upazila: 'Dumuria',
    current_problem: 'Complicated acute cholecystitis with gallbladder perforation',
    problem_description: 'Emergency open subtotal cholecystectomy + Morrison pouch drain insertion performed at Khulna Medical College Hospital. Discharged for home recovery under Dumuria Upazila Health Complex supervision.',
    symptom_duration: '4 days',
    known_allergies: 'None recorded',
    chronic_conditions: ['Hypothyroidism'],
    last_checkup_date: '2026-04-10'
  };

  // Directive issued by Dr. Sharmeen Akhter to Dr. Nabila Khan
  const directive1: ReverseReferralDirective = {
    id: 'DGHS-REV-2026-4011',
    referralId: 'DGHS-REF-2026-8842',
    issuedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    cityDoctorId: specSharmeen.doctor_id,
    cityDoctorName: specSharmeen.full_name,
    cityDoctorSpecialty: specSharmeen.specialty,
    cityFacilityName: hospKMCH.facility_name,
    localDoctorId: upzDocNabila.doctor_id,
    localDoctorName: upzDocNabila.full_name,
    localFacilityName: upzDocNabila.facility_name,
    procedureSummary: 'Open subtotal cholecystectomy with peritoneal lavage and closed suction Blake drain insertion.',
    operativeNotes: 'Extensive subhepatic adhesions dissected. Gallbladder wall gangrenous at fundus. Cystic duct stump secured. 1.5L normal saline lavage. Blake drain placed in Morrison pouch.',
    dischargeDiagnosis: 'Post-operative Day 4: Acute gangrenous cholecystitis s/p subtotal cholecystectomy. Hemodynamically stable, afebrile, tolerating oral diet.',
    patientConditionAtDischarge: 'Stable',
    medications: [
      {
        name: 'Tab. Cefuroxime Axetil 500mg',
        dosage: '1 tablet twice daily',
        frequency: '12-hourly after meals',
        duration: '5 more days',
        instructions: 'Complete prescribed course. Monitor for diarrhea.'
      },
      {
        name: 'Tab. Paracetamol 500mg',
        dosage: '1-2 tablets',
        frequency: '8-hourly as needed',
        duration: '5 days',
        instructions: 'For surgical site pain. Max 4g daily.'
      },
      {
        name: 'Cap. Esomeprazole 20mg',
        dosage: '1 capsule',
        frequency: 'Once daily before breakfast',
        duration: '14 days',
        instructions: 'Gastroprotection.'
      }
    ],
    localCareDirectives: {
      woundCare: 'Keep subcostal surgical dressing clean and dry. Inspect every 48 hours at Dumuria Upazila Health Complex. Clean with Povidone-Iodine solution and re-apply sterile gauze.',
      drainManagement: 'Check Blake drain collection daily. If 24h serosanguinous output is <20ml for 2 consecutive days, Upazila Doctor is authorized to pull drain.',
      sutureRemovalDate: 'Post-op Day 10 (approx. 4 days from today). Remove alternate staples first.',
      dietaryInstructions: 'Low-fat, high-protein soft diet. Avoid ghee and fried items. Plenty of fluids.',
      activityMobility: 'Gentle indoor walking encouraged. Strictly no heavy lifting (>5 kg) or agricultural field work for 6 weeks.'
    },
    redFlagWarnings: [
      'High-grade fever (>101°F) with chills or shaking rigors',
      'Sudden surge in abdominal pain with distension or rigidity',
      'Sudden drain output with fresh blood (>100ml/hr) or frank bile',
      'Wound edge gaping or purulent foul-smelling discharge'
    ],
    scheduledMilestones: [
      {
        dayLabel: 'Day 3 Post-Discharge (Clinic Inspection)',
        scheduledDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Incision site inspection', 'Drain output quantification', 'Vital signs audit (BP, Pulse, SpO2)'],
        completed: true,
        completedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        doctorNotes: 'Patient visited Dumuria UHC accompanied by daughter. Afebrile (98.6F), BP 120/75. Drain output 15ml serosanguinous. Wound clean, minimal erythema.',
        recordedVitals: {
          bpSystolic: 120,
          bpDiastolic: 75,
          heartRate: 78,
          spo2: 98,
          temperatureF: 98.6,
          woundCondition: 'clean_healing'
        }
      },
      {
        dayLabel: 'Day 6 Post-Discharge (Drain Removal Evaluation)',
        scheduledDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Blake drain removal if <20ml', 'Sterile dressing re-application', 'Pain assessment'],
        completed: false
      },
      {
        dayLabel: 'Day 10 Post-Discharge (Suture / Staple Removal)',
        scheduledDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Removal of skin staples', 'Fascial healing review', 'Liver function test review'],
        completed: false
      },
      {
        dayLabel: 'Day 30 (Final Long-Term Recovery Audit)',
        scheduledDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Incisional integrity audit', 'Dietary normalization check', 'Discharge from active follow-up'],
        completed: false
      }
    ],
    // PRIVATE CHAT: ONLY Dr. Nabila Khan (Upazila Doctor) and Dr. Sharmeen Akhter (City Specialist) can see this!
    chatMessages: [
      {
        id: 'msg-01',
        senderDoctorId: specSharmeen.doctor_id,
        senderName: specSharmeen.full_name,
        senderRole: 'city_specialist',
        senderFacility: hospKMCH.facility_name,
        timestamp: new Date(Date.now() - 47 * 3600 * 1000).toISOString(),
        content: 'Dr. Nabila, patient Sohana Chowdhury was discharged in stable condition today. We controlled the acute biliary sepsis. The patient is very glad she can recover at her village home in Dumuria instead of staying in Khulna city. Please monitor her drain output.'
      },
      {
        id: 'msg-02',
        senderDoctorId: upzDocNabila.doctor_id,
        senderName: upzDocNabila.full_name,
        senderRole: 'upazila_doctor',
        senderFacility: upzDocNabila.facility_name,
        timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        content: 'Thank you Dr. Sharmeen. The patient attended Dumuria UHC this morning. Drain output was only 15ml and incision is clean without erythema. Her vitals are completely stable.',
        isUrgent: false,
        attachmentType: 'vitals'
      },
      {
        id: 'msg-03',
        senderDoctorId: specSharmeen.doctor_id,
        senderName: specSharmeen.full_name,
        senderRole: 'city_specialist',
        senderFacility: hospKMCH.facility_name,
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        content: 'Splendid news. If tomorrow morning the 24-hour collection remains below 20ml, you are authorized to pull the Blake drain at your Dumuria complex and apply a sterile pressure dressing.'
      }
    ]
  };

  const ref1: TransferReferral = {
    id: 'DGHS-REF-2026-8842',
    patient: p1,
    localDoctor: upzDocNabila,
    originHospitalName: upzDocNabila.facility_name,
    originDivision: 'Khulna Division',
    originDistrict: 'Khulna',
    originUpazila: 'Dumuria',
    targetHospital: hospKMCH,
    targetDoctor: specSharmeen,
    urgency: 'code_amber',
    requiredBedType: 'hdu',
    clinicalSummary: 'Emergency surgery for ruptured acute cholecystitis with peritonitis. Treatment completed; returned home under Upazila Health Complex monitored recovery.',
    initialVitals: {
      bp: '110/70',
      heartRate: 98,
      spo2: 95,
      temp: 101.2,
      gcs: 15
    },
    recommendedScore: 92,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    transitStartedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000 + 40 * 60 * 1000).toISOString(),
    admittedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000 + 100 * 60 * 1000).toISOString(),
    status: 'referred_back',
    ambulanceId: 'GOV-AMB-KHU-018',
    transitEstimatedMinutes: 40,
    reverseDirective: directive1
  };

  // Patient 2: Active in Transit from Dumuria to Jashore 250 Bed Hospital (Dr. Nabila Khan & Dr. Md. Tariqul Islam)
  const p2: Patient = {
    patient_id: 'SHJ-P-000001',
    identity_type: 'SASTHOJAL_TEST_ID',
    identity_number: 'TEST-P-000001',
    is_synthetic: true,
    full_name: 'Sabbir Chowdhury',
    date_of_birth: '1961-10-04',
    age_years: 65,
    sex: 'Male',
    height_cm: 172,
    weight_kg: 74,
    blood_group: 'O+',
    division: 'Khulna Division',
    district: 'Khulna',
    upazila: 'Dumuria',
    current_problem: 'Severe open compound fracture of right tibia-fibula with compartment syndrome',
    problem_description: 'Highway accident victim. Severe limb-threatening neurovascular compromise, absent dorsalis pedis pulse, tense right leg compartment. Requires urgent fasciotomy and external fixation.',
    symptom_duration: '75 minutes',
    known_allergies: 'Penicillin',
    chronic_conditions: ['Hypertension'],
    last_checkup_date: '2026-04-13'
  };

  const ref2: TransferReferral = {
    id: 'DGHS-REF-2026-9104',
    patient: p2,
    localDoctor: upzDocNabila,
    originHospitalName: upzDocNabila.facility_name,
    originDivision: 'Khulna Division',
    originDistrict: 'Khulna',
    originUpazila: 'Dumuria',
    targetHospital: hospJASH,
    targetDoctor: specTariqul,
    urgency: 'code_red',
    requiredBedType: 'icu',
    clinicalSummary: 'Compound tibia fracture with impending compartment syndrome. IV analgesics and splint applied. Immediate surgical theatre and ICU reservation required.',
    initialVitals: {
      bp: '95/60',
      heartRate: 114,
      spo2: 96,
      temp: 98.4,
      gcs: 14
    },
    recommendedScore: 88,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    transitStartedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'in_transit',
    ambulanceId: 'GOV-AMB-KHU-042',
    transitEstimatedMinutes: 65
  };

  // Patient 3: Admitted in Khulna Medical College Hospital from Dighalia (Dr. Tanvir Hossain & Dr. Sharmeen Akhter)
  const p3: Patient = {
    patient_id: 'SHJ-P-000003',
    identity_type: 'SASTHOJAL_TEST_ID',
    identity_number: 'TEST-P-000003',
    is_synthetic: true,
    full_name: 'Anisur Rahman',
    date_of_birth: '1975-06-12',
    age_years: 51,
    sex: 'Male',
    height_cm: 168,
    weight_kg: 68,
    blood_group: 'B+',
    division: 'Khulna Division',
    district: 'Khulna',
    upazila: 'Dighalia',
    current_problem: 'Perforated duodenal ulcer with localized peritonitis',
    problem_description: 'Emergency Graham patch omentopexy performed at Khulna Medical College Hospital. Recovering in surgical ward; preparing reverse directive.',
    symptom_duration: '2 days',
    known_allergies: 'None',
    chronic_conditions: ['Peptic Ulcer Disease'],
    last_checkup_date: '2026-05-02'
  };

  const ref3: TransferReferral = {
    id: 'DGHS-REF-2026-9210',
    patient: p3,
    localDoctor: upzDocTanvir,
    originHospitalName: upzDocTanvir.facility_name,
    originDivision: 'Khulna Division',
    originDistrict: 'Khulna',
    originUpazila: 'Dighalia',
    targetHospital: hospKMCH,
    targetDoctor: specSharmeen,
    urgency: 'code_red',
    requiredBedType: 'hdu',
    clinicalSummary: 'Acute abdomen with pneumoperitoneum. Graham patch repair completed. Sepsis controlled; preparing reverse referral protocol back to Dighalia UHC.',
    initialVitals: {
      bp: '120/80',
      heartRate: 84,
      spo2: 97,
      temp: 99.0,
      gcs: 15
    },
    recommendedScore: 94,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    transitStartedAt: new Date(Date.now() - 19 * 3600 * 1000).toISOString(),
    admittedAt: new Date(Date.now() - 17 * 3600 * 1000).toISOString(),
    status: 'admitted_city_hospital',
    ambulanceId: 'GOV-AMB-KHU-009',
    transitEstimatedMinutes: 30
  };

  // Patient 4: In Dhaka Division (Savar) - Managed by Dr. Sajjad Ahmed & Dr. Kazi Mahfuzur Rahman (DMCH)
  const p4: Patient = {
    patient_id: 'SHJ-P-000009',
    identity_type: 'SASTHOJAL_TEST_ID',
    identity_number: 'TEST-P-000009',
    is_synthetic: true,
    full_name: 'Mahmud Biswas',
    date_of_birth: '1978-04-12',
    age_years: 48,
    sex: 'Male',
    height_cm: 165,
    weight_kg: 71,
    blood_group: 'B+',
    division: 'Dhaka Division',
    district: 'Dhaka',
    upazila: 'Savar',
    current_problem: 'Acute Anterior STEMI status post-primary PCI with stent to LAD',
    problem_description: 'Coronary angioplasty with drug-eluting stent performed at Dhaka Medical College Hospital. Discharged to home in Savar under Savar Upazila Health Complex monitoring.',
    symptom_duration: '3 days',
    known_allergies: 'None',
    chronic_conditions: ['Type 2 Diabetes'],
    last_checkup_date: '2026-05-01'
  };

  const directive4: ReverseReferralDirective = {
    id: 'DGHS-REV-2026-5520',
    referralId: 'DGHS-REF-2026-9401',
    issuedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    cityDoctorId: specMahfuzur.doctor_id,
    cityDoctorName: specMahfuzur.full_name,
    cityDoctorSpecialty: specMahfuzur.specialty,
    cityFacilityName: hospDMCH.facility_name,
    localDoctorId: upzDocSajjad.doctor_id,
    localDoctorName: upzDocSajjad.full_name,
    localFacilityName: upzDocSajjad.facility_name,
    procedureSummary: 'Primary PCI with single drug-eluting stent (DES) to mid-LAD via right radial access. TIMI 3 flow achieved.',
    operativeNotes: '95% mid-LAD lesion crossed. Predilated with 2.5x12 balloon. 3.0x18mm DES deployed at 14 atm. Zero residual stenosis. Radial compression band removed after 4h.',
    dischargeDiagnosis: 'Post-AMI Day 3, status post-PCI to LAD. Hemodynamically stable, ECG demonstrates resolving ST elevations.',
    patientConditionAtDischarge: 'Stable',
    medications: [
      {
        name: 'Tab. Aspirin 75mg + Clopidogrel 75mg (Dual Antiplatelet)',
        dosage: '1 tablet once daily',
        frequency: 'Daily after lunch',
        duration: '12 months strictly',
        instructions: 'CRITICAL: Do NOT discontinue without cardiology consultation.'
      },
      {
        name: 'Tab. Atorvastatin 40mg',
        dosage: '1 tablet once daily',
        frequency: 'At bedtime',
        duration: 'Long term',
        instructions: 'Lipid stabilization.'
      },
      {
        name: 'Tab. Metoprolol Tartrate 25mg',
        dosage: 'Half tablet twice daily',
        frequency: '12-hourly with meals',
        duration: 'Ongoing',
        instructions: 'Monitor resting heart rate (target 60-70 bpm).'
      }
    ],
    localCareDirectives: {
      woundCare: 'Right radial puncture site: Keep clean and dry for 48 hours. Remove adhesive plaster. Inspect for hematoma or radial pseudoaneurysm.',
      dietaryInstructions: 'Low-salt (<3g/day), strictly oil-reduced cardiac diet. Avoid tobacco and sweetened tea.',
      activityMobility: 'Light indoor walking only. No strenuous physical labor or heavy arm lifting for 2 weeks.'
    },
    redFlagWarnings: [
      'Recurrent chest tightness, squeezing pressure, or radiating pain to jaw/arm',
      'Sudden shortness of breath, orthopnea, or bilateral pedal edema',
      'Resting heart rate <50 bpm or >110 bpm',
      'Bleeding from puncture site or tarry black stools'
    ],
    scheduledMilestones: [
      {
        dayLabel: 'Day 3 Post-Discharge (Radial Site & Vitals Audit)',
        scheduledDate: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Check BP and Pulse rate', 'Radial puncture site palpation', 'Medication adherence verification'],
        completed: true,
        completedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        doctorNotes: 'Patient visited Savar UHC. Radial artery pulse palpable, no hematoma. BP 118/74, Pulse 66 bpm regular. Patient taking DAPT reliably.',
        recordedVitals: {
          bpSystolic: 118,
          bpDiastolic: 74,
          heartRate: 66,
          spo2: 98,
          temperatureF: 98.4,
          woundCondition: 'clean_healing'
        }
      },
      {
        dayLabel: 'Day 7 Post-Discharge (ECG & Symptom Review)',
        scheduledDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['12-lead ECG review at Savar UHC', 'Check for chest tightness on exertion', 'Serum creatinine check if indicated'],
        completed: false
      },
      {
        dayLabel: 'Day 30 (Post-PCI 1-Month Audit)',
        scheduledDate: new Date(Date.now() + 27 * 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Functional cardiac status review', 'Lipid profile review', 'Referral to DMCH for routine echo review if indicated'],
        completed: false
      }
    ],
    chatMessages: [
      {
        id: 'msg-dhaka-01',
        senderDoctorId: specMahfuzur.doctor_id,
        senderName: specMahfuzur.full_name,
        senderRole: 'city_specialist',
        senderFacility: hospDMCH.facility_name,
        timestamp: new Date(Date.now() - 35 * 3600 * 1000).toISOString(),
        content: 'Dr. Sajjad, patient Mahmud Biswas has been discharged back to Savar following successful primary PCI to LAD. Please reinforce strict compliance with Dual Antiplatelet Therapy (Aspirin + Clopidogrel).'
      },
      {
        id: 'msg-dhaka-02',
        senderDoctorId: upzDocSajjad.doctor_id,
        senderName: upzDocSajjad.full_name,
        senderRole: 'upazila_doctor',
        senderFacility: upzDocSajjad.facility_name,
        timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        content: 'Thank you Dr. Mahfuzur. The patient reported to Savar UHC this morning. Radial site is pristine and resting pulse is 66 bpm on Metoprolol. Patient is resting comfortably at home in Savar.',
        isUrgent: false,
        attachmentType: 'vitals'
      }
    ]
  };

  const ref4: TransferReferral = {
    id: 'DGHS-REF-2026-9401',
    patient: p4,
    localDoctor: upzDocSajjad,
    originHospitalName: upzDocSajjad.facility_name,
    originDivision: 'Dhaka Division',
    originDistrict: 'Dhaka',
    originUpazila: 'Savar',
    targetHospital: hospDMCH,
    targetDoctor: specMahfuzur,
    urgency: 'code_red',
    requiredBedType: 'icu',
    clinicalSummary: 'Acute anterior STEMI. Primary PCI with DES to LAD completed. Transferred back home to Savar for Upazila Health Complex recovery monitoring.',
    initialVitals: {
      bp: '125/80',
      heartRate: 72,
      spo2: 98,
      temp: 98.6,
      gcs: 15
    },
    recommendedScore: 95,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    transitStartedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 30 * 60 * 1000).toISOString(),
    admittedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 80 * 60 * 1000).toISOString(),
    status: 'referred_back',
    ambulanceId: 'GOV-AMB-DHA-004',
    transitEstimatedMinutes: 45,
    reverseDirective: directive4
  };

  return [ref1, ref2, ref3, ref4];
}

class SasthojaalDataService {
  private doctors: Doctor[] = REGISTERED_DOCTORS;
  private hospitals: Hospital[] = FIVE_CITY_HOSPITALS;
  private patients: Patient[] = [];
  private transfers: TransferReferral[] = [];
  private currentDoctorId: string = 'DOC-UPZ-01'; // Default to Dr. Nabila Khan
  private isLoaded: boolean = false;
  private listeners: Array<() => void> = [];

  public async initialize(): Promise<{ doctors: Doctor[]; hospitals: Hospital[]; patients: Patient[]; transfers: TransferReferral[] }> {
    if (this.isLoaded) {
      return {
        doctors: this.doctors,
        hospitals: this.hospitals,
        patients: this.patients,
        transfers: this.transfers
      };
    }

    try {
      // Fetch patients dataset from workspace
      const patRes = await fetch('/assets/aistudio/patients_b62a1205.json').then((r) => r.json());
      const rawPatients = (patRes.patients || []) as any[];

      // Enhance each patient with their accurate official Bangladesh Division
      this.patients = rawPatients.map((p) => {
        const division = getDivisionForDistrict(p.district || 'Khulna');
        return {
          ...p,
          division
        } as Patient;
      });

      // The 5 city hospitals and 9 registered doctors are our official dataset
      this.hospitals = FIVE_CITY_HOSPITALS;
      this.doctors = REGISTERED_DOCTORS;

      // Check saved hospital bed adjustments
      const savedHosp = localStorage.getItem(STORAGE_KEYS.HOSPITALS_STATE);
      if (savedHosp) {
        try {
          const parsed = JSON.parse(savedHosp);
          if (Array.isArray(parsed) && parsed.length === 5) {
            this.hospitals = parsed;
          }
        } catch {
          // fallback to FIVE_CITY_HOSPITALS
        }
      }

      // Check saved transfers
      const savedTrans = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (savedTrans) {
        try {
          this.transfers = JSON.parse(savedTrans);
        } catch {
          this.transfers = createSeedReferrals(this.doctors, this.hospitals, this.patients);
          this.persistTransfers();
        }
      } else {
        this.transfers = createSeedReferrals(this.doctors, this.hospitals, this.patients);
        this.persistTransfers();
      }

      // Check authenticated doctor
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_DOCTOR_ID);
      if (savedAuth && this.doctors.some((d) => d.doctor_id === savedAuth)) {
        this.currentDoctorId = savedAuth;
      }

      this.isLoaded = true;
    } catch (err) {
      console.warn('Fallback loading dataset:', err);
      this.isLoaded = true;
    }

    return {
      doctors: this.doctors,
      hospitals: this.hospitals,
      patients: this.patients,
      transfers: this.transfers
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private persistTransfers() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(this.transfers));
    } catch (e) {
      console.warn('Failed to persist transfers', e);
    }
    this.notify();
  }

  private persistHospitals() {
    try {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS_STATE, JSON.stringify(this.hospitals));
    } catch (e) {
      console.warn('Failed to persist hospitals', e);
    }
    this.notify();
  }

  public getDoctors(): Doctor[] {
    return this.doctors;
  }

  public getHospitals(): Hospital[] {
    return this.hospitals;
  }

  public getPatients(): Patient[] {
    return this.patients;
  }

  public getTransfers(): TransferReferral[] {
    return this.transfers;
  }

  public getCurrentDoctor(): Doctor {
    const doc = this.doctors.find((d) => d.doctor_id === this.currentDoctorId);
    return doc || this.doctors[0];
  }

  public setCurrentDoctor(doctorId: string): boolean {
    const doc = this.doctors.find((d) => d.doctor_id === doctorId);
    if (!doc) return false;
    this.currentDoctorId = doctorId;
    localStorage.setItem(STORAGE_KEYS.AUTH_DOCTOR_ID, doctorId);
    this.notify();
    return true;
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_DOCTOR_ID);
    this.notify();
  }

  /**
   * Returns patients accessible to the given doctor:
   * "each local doctor can only access/see the patients in their own division in their platform."
   */
  public getPatientsForDoctor(doctor: Doctor): Patient[] {
    if (doctor.role === 'upazila_doctor') {
      return this.patients.filter((p) => p.division === doctor.division);
    }
    // City specialist can see patients referred to their hospital or within their division
    return this.patients;
  }

  /**
   * Returns transfers accessible to the doctor based on division & role
   */
  public getTransfersForDoctor(doctor: Doctor): TransferReferral[] {
    if (doctor.role === 'upazila_doctor') {
      // Upazila doctor sees cases originating in their division
      return this.transfers.filter((t) => t.originDivision === doctor.division);
    }
    // City specialist sees transfers targeted to their hospital or specialty
    return this.transfers.filter(
      (t) => t.targetDoctor.doctor_id === doctor.doctor_id || t.targetHospital.location.district === doctor.district
    );
  }

  /**
   * Dispatches a new emergency transfer from Upazila Doctor to City Specialist
   */
  public dispatchEmergencyTransfer(data: {
    patient: Patient;
    localDoctor: Doctor;
    targetHospital: Hospital;
    targetDoctor: Doctor;
    urgency: 'code_red' | 'code_amber' | 'code_yellow';
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
    transitEstimatedMinutes: number;
    ambulanceId?: string;
  }): TransferReferral {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `DGHS-REF-2026-${randomSuffix}`;

    const newTransfer: TransferReferral = {
      id: newId,
      patient: data.patient,
      localDoctor: data.localDoctor,
      originHospitalName: data.localDoctor.facility_name,
      originDivision: data.localDoctor.division,
      originDistrict: data.localDoctor.district,
      originUpazila: data.localDoctor.upazila || data.patient.upazila,
      targetHospital: data.targetHospital,
      targetDoctor: data.targetDoctor,
      urgency: data.urgency,
      requiredBedType: data.requiredBedType,
      clinicalSummary: data.clinicalSummary,
      initialVitals: data.initialVitals,
      recommendedScore: data.recommendedScore,
      createdAt: new Date().toISOString(),
      transitStartedAt: new Date().toISOString(),
      status: 'in_transit',
      ambulanceId: data.ambulanceId || `GOV-AMB-EMERG-${Math.floor(100 + Math.random() * 900)}`,
      transitEstimatedMinutes: data.transitEstimatedMinutes
    };

    // Deduct bed from city hospital
    const targetHospIdx = this.hospitals.findIndex((h) => h.hospital_id === data.targetHospital.hospital_id);
    if (targetHospIdx !== -1) {
      const hosp = this.hospitals[targetHospIdx];
      const bedProp = data.requiredBedType === 'icu' ? 'icu_beds' : data.requiredBedType === 'hdu' ? 'hdu_beds' : 'general_beds';
      if (hosp.capacity[bedProp].available > 0) {
        hosp.capacity[bedProp].available -= 1;
        hosp.capacity[bedProp].occupied += 1;
      }
      this.persistHospitals();
    }

    this.transfers.unshift(newTransfer);
    this.persistTransfers();
    return newTransfer;
  }

  /**
   * Updates transfer status through the referral pipeline
   */
  public updateTransferStatus(transferId: string, newStatus: TransferReferral['status']): TransferReferral | null {
    const idx = this.transfers.findIndex((t) => t.id === transferId);
    if (idx === -1) return null;

    const t = this.transfers[idx];
    t.status = newStatus;

    if (newStatus === 'admitted_city_hospital' && !t.admittedAt) {
      t.admittedAt = new Date().toISOString();
    }

    // When referred back home, free up the bed at the city hospital
    if ((newStatus === 'referred_back' || newStatus === 'recovered_closed') && t.status !== 'referred_back') {
      const hospIdx = this.hospitals.findIndex((h) => h.hospital_id === t.targetHospital.hospital_id);
      if (hospIdx !== -1) {
        const bedProp = t.requiredBedType === 'icu' ? 'icu_beds' : t.requiredBedType === 'hdu' ? 'hdu_beds' : 'general_beds';
        if (this.hospitals[hospIdx].capacity[bedProp].occupied > 0) {
          this.hospitals[hospIdx].capacity[bedProp].occupied -= 1;
          this.hospitals[hospIdx].capacity[bedProp].available += 1;
        }
        this.persistHospitals();
      }
    }

    this.persistTransfers();
    return t;
  }

  /**
   * Creates or updates a Reverse Referral Directive from City Specialist back to Upazila Doctor
   */
  public issueReverseDirective(
    transferId: string,
    directiveData: Omit<ReverseReferralDirective, 'id' | 'referralId' | 'issuedAt' | 'chatMessages'>
  ): ReverseReferralDirective | null {
    const idx = this.transfers.findIndex((t) => t.id === transferId);
    if (idx === -1) return null;

    const transfer = this.transfers[idx];
    const directiveId = `DGHS-REV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const directive: ReverseReferralDirective = {
      ...directiveData,
      id: directiveId,
      referralId: transfer.id,
      issuedAt: new Date().toISOString(),
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          senderDoctorId: directiveData.cityDoctorId,
          senderName: directiveData.cityDoctorName,
          senderRole: 'city_specialist',
          senderFacility: directiveData.cityFacilityName,
          timestamp: new Date().toISOString(),
          content: `Formal Post-Care Reverse Referral Directive issued for ${transfer.patient.full_name}. Home recovery plan initialized under Upazila Health Complex supervision.`
        }
      ]
    };

    transfer.reverseDirective = directive;
    transfer.status = 'referred_back';

    // Free bed at city hospital
    const hospIdx = this.hospitals.findIndex((h) => h.hospital_id === transfer.targetHospital.hospital_id);
    if (hospIdx !== -1) {
      const bedProp = transfer.requiredBedType === 'icu' ? 'icu_beds' : transfer.requiredBedType === 'hdu' ? 'hdu_beds' : 'general_beds';
      if (this.hospitals[hospIdx].capacity[bedProp].occupied > 0) {
        this.hospitals[hospIdx].capacity[bedProp].occupied -= 1;
        this.hospitals[hospIdx].capacity[bedProp].available += 1;
      }
      this.persistHospitals();
    }

    this.persistTransfers();
    return directive;
  }

  /**
   * Adds a secure chat message between the two authorized doctors
   */
  public addChatMessage(
    transferId: string,
    message: {
      senderDoctorId: string;
      senderName: string;
      senderRole: 'upazila_doctor' | 'city_specialist';
      senderFacility: string;
      content: string;
      isUrgent?: boolean;
      attachmentType?: 'vitals' | 'wound_photo_note' | 'lab_report';
    }
  ): DoctorChatMessage | null {
    const transfer = this.transfers.find((t) => t.id === transferId);
    if (!transfer || !transfer.reverseDirective) return null;

    // Strict access check: only the Upazila Doctor or City Specialist on this case can post!
    const isLocalDoc = message.senderDoctorId === transfer.localDoctor.doctor_id;
    const isCityDoc = message.senderDoctorId === transfer.targetDoctor.doctor_id || message.senderDoctorId === transfer.reverseDirective.cityDoctorId;
    if (!isLocalDoc && !isCityDoc) {
      console.warn('Unauthorized attempt to post in private tele-consultation channel');
      return null;
    }

    const newMsg: DoctorChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...message
    };

    transfer.reverseDirective.chatMessages.push(newMsg);
    this.persistTransfers();
    return newMsg;
  }

  /**
   * Completes an Upazila clinic follow-up milestone
   */
  public completeMilestone(
    transferId: string,
    milestoneIndex: number,
    data: {
      notes: string;
      vitals?: FollowUpMilestone['recordedVitals'];
    }
  ): boolean {
    const transfer = this.transfers.find((t) => t.id === transferId);
    if (!transfer || !transfer.reverseDirective) return false;

    const milestone = transfer.reverseDirective.scheduledMilestones[milestoneIndex];
    if (!milestone) return false;

    milestone.completed = true;
    milestone.completedAt = new Date().toISOString();
    milestone.doctorNotes = data.notes;
    milestone.recordedVitals = data.vitals;

    const allDone = transfer.reverseDirective.scheduledMilestones.every((m) => m.completed);
    if (allDone) {
      transfer.status = 'recovered_closed';
    }

    const alertMsg: DoctorChatMessage = {
      id: `msg-auto-${Date.now()}`,
      senderDoctorId: transfer.localDoctor.doctor_id,
      senderName: transfer.localDoctor.full_name,
      senderRole: 'upazila_doctor',
      senderFacility: transfer.originHospitalName,
      timestamp: new Date().toISOString(),
      content: `[Upazila Clinic Check-in Logged] ${milestone.dayLabel} completed. Vitals: BP ${data.vitals?.bpSystolic || '—'}/${data.vitals?.bpDiastolic || '—'}, SpO2 ${data.vitals?.spo2 || '—'}%, Wound: ${data.vitals?.woundCondition?.replace('_', ' ') || 'Normal'}. Notes: ${data.notes}`,
      attachmentType: 'vitals'
    };
    transfer.reverseDirective.chatMessages.push(alertMsg);

    this.persistTransfers();
    return true;
  }

  /**
   * Live simulation bed adjustment
   */
  public adjustBedCount(
    hospitalId: string,
    bedType: 'general_beds' | 'icu_beds' | 'hdu_beds',
    delta: number
  ): void {
    const hosp = this.hospitals.find((h) => h.hospital_id === hospitalId);
    if (!hosp) return;

    const bed = hosp.capacity[bedType];
    const newOccupied = Math.max(0, Math.min(bed.total, bed.occupied + delta));
    bed.occupied = newOccupied;
    bed.available = Math.max(0, bed.total - newOccupied);
    hosp.last_capacity_update = new Date().toISOString();

    this.persistHospitals();
  }

  public registerEmergencyPatient(patient: Patient): Patient {
    this.patients.unshift(patient);
    this.notify();
    return patient;
  }
}

export const dataService = new SasthojaalDataService();
