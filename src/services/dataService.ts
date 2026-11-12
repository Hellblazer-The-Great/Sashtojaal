import { Doctor, Hospital, Patient, TransferReferral, ReverseReferralDirective, DoctorChatMessage, FollowUpMilestone } from '../types/index.ts';

const STORAGE_KEYS = {
  TRANSFERS: 'sasthojaal_transfers_v1',
  HOSPITALS_STATE: 'sasthojaal_hospitals_state_v1',
  ACTIVE_DOCTOR: 'sasthojaal_active_doctor_v1'
};

// Initial Seed Referrals to demonstrate all life-cycle states immediately
function createSeedReferrals(doctors: Doctor[], hospitals: Hospital[], patients: Patient[]): TransferReferral[] {
  const localDoc1 = doctors.find((d) => d.doctor_id === 'SHJ-D-L-001') || doctors[0]; // Dr. Nabila Khan (Dumuria UHC, Khulna)
  const localDoc2 = doctors.find((d) => d.doctor_id === 'SHJ-D-L-002') || doctors[1]; // Dr. Sumaiya Das (Dighalia UHC)
  const cityDoc1 = doctors.find((d) => d.doctor_id === 'SHJ-D-C-002') || doctors[doctors.length - 2]; // Dr. Nabila Das (Cardiology)
  const cityDoc2 = doctors.find((d) => d.doctor_id === 'SHJ-D-C-001') || doctors[doctors.length - 1]; // Dr. Sharmeen Talukder (Internal Med)
  const cityDoc3 = doctors.find((d) => d.doctor_id === 'SHJ-D-C-003') || doctors[doctors.length - 3]; // Dr. Nayeem Akter (Neurology)

  const hospKhulnaMed = hospitals.find((h) => h.facility_name.includes('Khulna') || h.hospital_id === 'SHJ-H-C-001') || hospitals[hospitals.length - 4];
  const hospAbuNaser = hospitals.find((h) => h.facility_name.includes('Abu Naser') || h.hospital_id === 'SHJ-H-C-003') || hospitals[hospitals.length - 3];
  const hospDMCH = hospitals.find((h) => h.facility_name.includes('Dhaka Medical') || h.hospital_id === 'SHJ-H-C-004') || hospitals[hospitals.length - 2];

  const p1 = patients[0] || {
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
    district: 'Khulna',
    upazila: 'Dumuria',
    current_problem: 'Acute Inferior STEMI & cardiogenic shock',
    problem_description: 'Sudden severe crushing retrosternal chest pain with diaphoresis, hypotension (BP 85/50), ST elevations in II, III, aVF.',
    symptom_duration: '90 minutes',
    known_allergies: 'Penicillin',
    chronic_conditions: ['Hypertension', 'Type 2 Diabetes'],
    last_checkup_date: '2026-04-13'
  };

  const p2 = patients[1] || {
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
    district: 'Khulna',
    upazila: 'Dumuria',
    current_problem: 'Complicated Cholelithiasis with acute suppurative perforation',
    problem_description: 'Underwent emergency open subtotal cholecystectomy and peritoneal washout at tertiary center. Discharged with abdominal drain and subcostal surgical suture line.',
    symptom_duration: '4 days',
    known_allergies: 'None recorded',
    chronic_conditions: ['Hypothyroidism'],
    last_checkup_date: '2026-04-10'
  };

  const p3 = patients[2] || {
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
    district: 'Khulna',
    upazila: 'Koyra',
    current_problem: 'Severe Polytrauma with epidural hemorrhage (EDH)',
    problem_description: 'Motorcycle crash with right temporal skull fracture and deteriorating GCS (8/15). Requires urgent neurosurgical craniotomy and ICU ventilation.',
    symptom_duration: '3 hours',
    known_allergies: 'None',
    chronic_conditions: ['None'],
    last_checkup_date: '2026-05-02'
  };

  const p4 = patients[3] || {
    patient_id: 'SHJ-P-000004',
    identity_type: 'SASTHOJAL_TEST_ID',
    identity_number: 'TEST-P-000004',
    is_synthetic: true,
    full_name: 'Fatema Khatun',
    date_of_birth: '1984-11-20',
    age_years: 42,
    sex: 'Female',
    height_cm: 152,
    weight_kg: 58,
    blood_group: 'AB+',
    district: 'Khulna',
    upazila: 'Dacope',
    current_problem: 'Acute Respiratory Distress Syndrome (ARDS) secondary to severe pneumonia',
    problem_description: 'SpO2 84% on room air, high fever (103F), bilateral crepitations. Non-responsive to primary nebulization and IV Ceftriaxone.',
    symptom_duration: '24 hours',
    known_allergies: 'Sulfa drugs',
    chronic_conditions: ['Bronchial Asthma'],
    last_checkup_date: '2026-04-25'
  };

  // Seed 1: Active in Transit
  const referral1: TransferReferral = {
    id: 'DGHS-REF-2026-9104',
    patient: p1,
    localDoctor: localDoc1,
    originHospitalName: localDoc1.facility_name,
    originDistrict: 'Khulna',
    originUpazila: 'Dumuria',
    targetHospital: hospAbuNaser,
    targetDoctor: cityDoc1,
    urgency: 'code_red',
    requiredBedType: 'icu',
    clinicalSummary: 'Acute Inferior STEMI with hemodynamic collapse. IV inotropes started, oxygen delivered at 6 L/min via mask. Emergency Cath Lab & ICU admission needed.',
    initialVitals: {
      bp: '85/50',
      heartRate: 112,
      spo2: 89,
      temp: 98.4,
      gcs: 14
    },
    recommendedScore: 94,
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    transitStartedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'in_transit',
    ambulanceId: 'GOV-AMB-KHU-042',
    transitEstimatedMinutes: 45
  };

  // Seed 2: Post-Treatment Reverse Referral Directive Issued (The Heart of the App!)
  const directiveSeed: ReverseReferralDirective = {
    id: 'DGHS-REV-2026-4011',
    referralId: 'DGHS-REF-2026-8842',
    issuedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    cityDoctorId: cityDoc2.doctor_id,
    cityDoctorName: cityDoc2.full_name,
    cityDoctorSpecialty: 'General & Hepatobiliary Surgery',
    cityFacilityName: hospKhulnaMed.facility_name,
    localDoctorId: localDoc1.doctor_id,
    localDoctorName: localDoc1.full_name,
    localFacilityName: localDoc1.facility_name,
    procedureSummary: 'Emergency open subtotal cholecystectomy + subhepatic closed suction Blake drain insertion for gangrenous ruptured cholecystitis.',
    operativeNotes: 'Extensive subhepatic adhesions dissected. Cystic duct stump secured with 2-0 silk. Peritoneal cavity lavaged with 2L warm normal saline. Drain placed in Morrison pouch.',
    dischargeDiagnosis: 'Post-operative Day 4: Acute gangrenous cholecystitis status post-cholecystectomy; hemodynamically stable, afebrile, tolerating soft bland diet.',
    patientConditionAtDischarge: 'Stable',
    medications: [
      {
        name: 'Tab. Cefuroxime Axetil 500mg',
        dosage: '1 tablet twice daily',
        frequency: '12-hourly after meals',
        duration: '5 more days (complete 7-day course)',
        instructions: 'Do not miss doses. Monitor for loose stools or rash.'
      },
      {
        name: 'Tab. Paracetamol 500mg',
        dosage: '1-2 tablets',
        frequency: 'Every 8 hours as needed for surgical pain',
        duration: '7 days',
        instructions: 'Max 4 grams in 24 hours. Avoid combining with other acetaminophen products.'
      },
      {
        name: 'Cap. Esomeprazole 20mg',
        dosage: '1 capsule daily',
        frequency: 'Morning 30 min before breakfast',
        duration: '14 days',
        instructions: 'Gastroprotection.'
      }
    ],
    localCareDirectives: {
      woundCare: 'Keep subcostal dressing clean and dry. Inspect incision for redness, swelling, or purulent exudate every 48 hours. Clean with Povidone-Iodine solution and apply sterile gauze.',
      drainManagement: 'Measure Blake drain output every 24 hours in the Upazila clinic. If 24h serosanguinous output is <25ml for 2 consecutive days, local doctor is authorized to remove the drain.',
      sutureRemovalDate: 'Post-op Day 10 (3 days from today). Remove alternate staples first.',
      dietaryInstructions: 'Low-fat, high-protein soft diet. Avoid ghee, mustard oil, and deep-fried local sweets. Plenty of warm fluids.',
      activityMobility: 'Encourage gentle ambulation inside the house. No heavy lifting (>5 kg) or agricultural field work for 6 weeks.'
    },
    redFlagWarnings: [
      'High-grade fever (>101°F) accompanied by chills or rigors',
      'Sudden increase in abdominal pain with distension or rebound tenderness',
      'Sudden surge in drain output containing fresh bright red blood (>100ml/hr) or frank bile',
      'Wound gaping or dehiscence with bowel loops visible',
      'Persistent vomiting or inability to tolerate oral fluids'
    ],
    scheduledMilestones: [
      {
        dayLabel: 'Day 3 Post-Discharge (Clinic Inspection)',
        scheduledDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Incision site inspection', 'Drain output quantification', 'Vitals check (BP, SpO2, Temp)'],
        completed: true,
        completedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
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
        recommendedChecks: ['Remove alternate sutures/staples', 'Assessment of fascial healing', 'LFT liver enzymes review if requested'],
        completed: false
      },
      {
        dayLabel: 'Day 30 (Final Long-Term Recovery Audit)',
        scheduledDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
        recommendedChecks: ['Abdominal wall integrity check (incisional hernia rule out)', 'Dietary normalisation check', 'Discharge from active follow-up registry'],
        completed: false
      }
    ],
    chatMessages: [
      {
        id: 'msg-01',
        senderDoctorId: cityDoc2.doctor_id,
        senderName: cityDoc2.full_name,
        senderRole: 'capital_specialist',
        senderFacility: hospKhulnaMed.facility_name,
        timestamp: new Date(Date.now() - 47 * 3600 * 1000).toISOString(),
        content: 'Dr. Nabila, patient Sohana Chowdhury was discharged today in stable condition. We successfully controlled the acute biliary sepsis. The patient is very relieved to recover at her village home in Dumuria. Please inspect her Blake drain output over the next 48 hours.'
      },
      {
        id: 'msg-02',
        senderDoctorId: localDoc1.doctor_id,
        senderName: localDoc1.full_name,
        senderRole: 'local_doctor',
        senderFacility: localDoc1.facility_name,
        timestamp: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
        content: 'Thank you Dr. Sharmeen. The patient reported to Dumuria UHC this morning. Drain output is minimal (15ml) and wound looks clean without signs of leakage. Patient is grateful she did not have to rent a hotel in Khulna city for 2 weeks.',
        isUrgent: false,
        attachmentType: 'vitals'
      },
      {
        id: 'msg-03',
        senderDoctorId: cityDoc2.doctor_id,
        senderName: cityDoc2.full_name,
        senderRole: 'capital_specialist',
        senderFacility: hospKhulnaMed.facility_name,
        timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        content: 'Excellent clinical news. If tomorrow morning the 24-hour collection remains under 20ml, you may safely pull the drain at your health complex and apply a sterile pressure dressing. Keep me posted on any spikes.'
      }
    ]
  };

  const referral2: TransferReferral = {
    id: 'DGHS-REF-2026-8842',
    patient: p2,
    localDoctor: localDoc1,
    originHospitalName: localDoc1.facility_name,
    originDistrict: 'Khulna',
    originUpazila: 'Dumuria',
    targetHospital: hospKhulnaMed,
    targetDoctor: cityDoc2,
    urgency: 'code_amber',
    requiredBedType: 'hdu',
    clinicalSummary: 'Emergency surgical management for ruptured acute cholecystitis with localized peritonitis. Treatment completed; returned home under Upazila Health Complex monitored recovery.',
    initialVitals: {
      bp: '110/70',
      heartRate: 98,
      spo2: 95,
      temp: 101.2,
      gcs: 15
    },
    recommendedScore: 91,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    transitStartedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000 + 40 * 60 * 1000).toISOString(),
    admittedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000 + 100 * 60 * 1000).toISOString(),
    status: 'referred_back',
    ambulanceId: 'GOV-AMB-KHU-018',
    transitEstimatedMinutes: 40,
    reverseDirective: directiveSeed
  };

  // Seed 3: Admitted in Tertiary Hospital undergoing Neurosurgical treatment
  const referral3: TransferReferral = {
    id: 'DGHS-REF-2026-9210',
    patient: p3,
    localDoctor: localDoc2,
    originHospitalName: localDoc2.facility_name,
    originDistrict: 'Khulna',
    originUpazila: 'Koyra',
    targetHospital: hospAbuNaser,
    targetDoctor: cityDoc3,
    urgency: 'code_red',
    requiredBedType: 'icu',
    clinicalSummary: 'Severe head trauma with epidural hematoma. Urgent decompression craniotomy performed. Currently in Neuro-ICU on mechanical ventilator support.',
    initialVitals: {
      bp: '150/95',
      heartRate: 58,
      spo2: 91,
      temp: 99.1,
      gcs: 8
    },
    recommendedScore: 96,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    transitStartedAt: new Date(Date.now() - 13 * 3600 * 1000).toISOString(),
    admittedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    status: 'in_treatment',
    ambulanceId: 'GOV-AMB-DELTA-003',
    transitEstimatedMinutes: 160
  };

  // Seed 4: Pending Dispatch (Newly submitted emergency case)
  const referral4: TransferReferral = {
    id: 'DGHS-REF-2026-9302',
    patient: p4,
    localDoctor: localDoc1,
    originHospitalName: localDoc1.facility_name,
    originDistrict: 'Khulna',
    originUpazila: 'Dacope',
    targetHospital: hospDMCH,
    targetDoctor: cityDoc2,
    urgency: 'code_red',
    requiredBedType: 'hdu',
    clinicalSummary: 'Severe respiratory distress secondary to bilobar pneumonia. SpO2 84% on O2 6L. Patient requires high-flow nasal cannula or non-invasive ventilatory support in HDU.',
    initialVitals: {
      bp: '135/88',
      heartRate: 118,
      spo2: 84,
      temp: 103.0,
      gcs: 14
    },
    recommendedScore: 88,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: 'pending_dispatch',
    transitEstimatedMinutes: 210
  };

  return [referral1, referral2, referral3, referral4];
}

class SasthojaalDataService {
  private doctors: Doctor[] = [];
  private hospitals: Hospital[] = [];
  private patients: Patient[] = [];
  private transfers: TransferReferral[] = [];
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
      // Fetch datasets
      const [docRes, hospRes, patRes] = await Promise.all([
        fetch('/assets/aistudio/doctors_bc76a0e5.json').then((r) => r.json()),
        fetch('/assets/aistudio/hospitals_a4fd0a18.json').then((r) => r.json()),
        fetch('/assets/aistudio/patients_b62a1205.json').then((r) => r.json())
      ]);

      this.doctors = (docRes.doctors || []) as Doctor[];
      const rawHospitals = (hospRes.hospitals || []) as Hospital[];
      this.patients = (patRes.patients || []) as Patient[];

      // Check localStorage for saved hospital bed state adjustments
      const savedHospState = localStorage.getItem(STORAGE_KEYS.HOSPITALS_STATE);
      if (savedHospState) {
        try {
          this.hospitals = JSON.parse(savedHospState);
        } catch {
          this.hospitals = rawHospitals;
        }
      } else {
        this.hospitals = rawHospitals;
      }

      // Check localStorage for transfers
      const savedTransfers = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (savedTransfers) {
        try {
          this.transfers = JSON.parse(savedTransfers);
        } catch {
          this.transfers = createSeedReferrals(this.doctors, this.hospitals, this.patients);
          this.persistTransfers();
        }
      } else {
        this.transfers = createSeedReferrals(this.doctors, this.hospitals, this.patients);
        this.persistTransfers();
      }

      this.isLoaded = true;
    } catch (err) {
      console.warn('Failed to load assets via fetch, falling back to minimal bootstrap:', err);
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

  public getTransferById(id: string): TransferReferral | undefined {
    return this.transfers.find((t) => t.id === id);
  }

  /**
   * Dispatches a new emergency transfer referral
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

    // Deduct bed from target hospital
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

    if (newStatus === 'admitted_tertiary' && !t.admittedAt) {
      t.admittedAt = new Date().toISOString();
    }

    // If case has been referred back or closed, free up the bed at target hospital
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
   * Creates or updates a Reverse Referral Directive from City Specialist back to Local Upazila Doctor
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
          senderRole: 'capital_specialist',
          senderFacility: directiveData.cityFacilityName,
          timestamp: new Date().toISOString(),
          content: `Formal Post-Care Reverse Referral Directive issued for ${transfer.patient.full_name}. Please review operative notes, medication schedules, and follow-up milestones.`
        }
      ]
    };

    transfer.reverseDirective = directive;
    transfer.status = 'referred_back';

    // Free tertiary bed
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
   * Sends a secure doctor-to-doctor message on a case
   */
  public addChatMessage(
    transferId: string,
    message: {
      senderDoctorId: string;
      senderName: string;
      senderRole: 'local_doctor' | 'capital_specialist';
      senderFacility: string;
      content: string;
      isUrgent?: boolean;
      attachmentType?: 'vitals' | 'wound_photo_note' | 'lab_report';
    }
  ): DoctorChatMessage | null {
    const transfer = this.transfers.find((t) => t.id === transferId);
    if (!transfer || !transfer.reverseDirective) return null;

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
   * Completes a local follow-up milestone (e.g. Day 3, Day 7, Day 14)
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

    // Check if all milestones are completed -> marks case as recovered
    const allDone = transfer.reverseDirective.scheduledMilestones.every((m) => m.completed);
    if (allDone) {
      transfer.status = 'recovered_closed';
    }

    // Auto-notify city specialist via chat
    const alertMsg: DoctorChatMessage = {
      id: `msg-auto-${Date.now()}`,
      senderDoctorId: transfer.localDoctor.doctor_id,
      senderName: transfer.localDoctor.full_name,
      senderRole: 'local_doctor',
      senderFacility: transfer.originHospitalName,
      timestamp: new Date().toISOString(),
      content: `[Upazila Health Complex Check-in Logged] ${milestone.dayLabel} completed. Vitals: BP ${data.vitals?.bpSystolic || '—'}/${data.vitals?.bpDiastolic || '—'}, SpO2 ${data.vitals?.spo2 || '—'}%, Wound condition: ${data.vitals?.woundCondition?.replace('_', ' ') || 'Normal'}. Notes: ${data.notes}`,
      attachmentType: 'vitals'
    };
    transfer.reverseDirective.chatMessages.push(alertMsg);

    this.persistTransfers();
    return true;
  }

  /**
   * Adjusts bed capacity for live demo simulation
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

  /**
   * Adds an emergency patient dynamically
   */
  public registerEmergencyPatient(patient: Patient): Patient {
    this.patients.unshift(patient);
    this.notify();
    return patient;
  }
}

export const dataService = new SasthojaalDataService();
