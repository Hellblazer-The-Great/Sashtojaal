import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateDistanceKm,
  estimateTransitMinutes,
  inferClinicalNeeds,
  rankHospitalRecommendations
} from './transferLogic.ts';
import { Hospital, Patient, Doctor } from '../types/index.ts';

test('estimateDistanceKm calculates realistic distances between districts and upazilas', () => {
  // Dumuria to Khulna City
  const dumuriaToKhulna = estimateDistanceKm('Khulna', 'Dumuria', 'Khulna');
  assert.equal(dumuriaToKhulna, 28);

  // Koyra (southern delta) to Khulna City
  const koyraToKhulna = estimateDistanceKm('Khulna', 'Koyra', 'Khulna');
  assert.equal(koyraToKhulna, 95);

  // Khulna to Jashore
  const khulnaToJashore = estimateDistanceKm('Khulna', null, 'Jashore');
  assert.equal(khulnaToJashore, 65);

  // Khulna to Dhaka via expressway
  const khulnaToDhaka = estimateDistanceKm('Khulna', null, 'Dhaka');
  assert.equal(khulnaToDhaka, 215);
});

test('estimateTransitMinutes accounts for emergency urgency tiers', () => {
  const redTransit = estimateTransitMinutes(60, 'code_red');
  const amberTransit = estimateTransitMinutes(60, 'code_amber');

  assert.ok(redTransit > 0);
  assert.ok(amberTransit >= redTransit, 'Code amber should take equal or longer than code red siren dispatch');
});

test('inferClinicalNeeds maps clinical conditions to correct specialty and bed type', () => {
  const cardiac = inferClinicalNeeds('Acute Myocardial Infarction with ST elevation');
  assert.equal(cardiac.requiredSpecialty, 'Cardiology');
  assert.equal(cardiac.defaultBedType, 'icu');
  assert.equal(cardiac.urgency, 'code_red');

  const stroke = inferClinicalNeeds('Sudden onset left-sided hemiplegia and severe headache');
  assert.equal(stroke.requiredSpecialty, 'Neurosurgery');
  assert.equal(stroke.defaultBedType, 'icu');

  const respiratory = inferClinicalNeeds('Severe asthma with respiratory failure');
  assert.equal(respiratory.defaultBedType, 'hdu');
});

test('rankHospitalRecommendations prioritizes hospital with matching specialty and available beds', () => {
  const samplePatient: Patient = {
    patient_id: 'TEST-P-1',
    identity_type: 'TEST',
    identity_number: 'P-1',
    is_synthetic: true,
    full_name: 'Patient Testing',
    date_of_birth: '1970-01-01',
    age_years: 55,
    sex: 'Male',
    height_cm: 170,
    weight_kg: 70,
    blood_group: 'B+',
    district: 'Khulna',
    upazila: 'Dumuria',
    current_problem: 'Severe chest pain radiating to left arm',
    problem_description: 'Suspected acute coronary syndrome',
    symptom_duration: '2 hours',
    known_allergies: 'None',
    chronic_conditions: ['Hypertension'],
    last_checkup_date: '2026-04-01'
  };

  const sampleHospitals: Hospital[] = [
    {
      hospital_id: 'HOSP-1',
      facility_name: 'Khulna Medical College Hospital',
      facility_type: 'government_city_hospital',
      ownership: 'government',
      is_synthetic_record: true,
      location: {
        country: 'Bangladesh',
        division: 'Khulna',
        district: 'Khulna',
        upazila: null,
        address: 'Khulna'
      },
      service_level: 'district_or_city_referral',
      departments: ['Cardiology', 'Emergency', 'General Surgery'],
      specialties_available: ['Cardiology'],
      capacity: {
        general_beds: { total: 500, occupied: 450, available: 50 },
        icu_beds: { total: 10, occupied: 7, available: 3 },
        hdu_beds: { total: 10, occupied: 8, available: 2 }
      },
      services: ['emergency', 'surgery', 'inpatient'],
      referral_capabilities: ['upazila_health_complex'],
      contact: { phone: '123', email: 'test@hosp.bd' },
      operational_status: 'operational',
      last_capacity_update: new Date().toISOString()
    },
    {
      hospital_id: 'HOSP-2',
      facility_name: 'Distant Hospital with No ICU Beds',
      facility_type: 'government_city_hospital',
      ownership: 'government',
      is_synthetic_record: true,
      location: {
        country: 'Bangladesh',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: null,
        address: 'Dhaka'
      },
      service_level: 'district_or_city_referral',
      departments: ['Cardiology'],
      specialties_available: ['Cardiology'],
      capacity: {
        general_beds: { total: 200, occupied: 150, available: 50 },
        icu_beds: { total: 10, occupied: 10, available: 0 }, // ZERO ICU beds
        hdu_beds: { total: 5, occupied: 5, available: 0 }
      },
      services: ['emergency', 'surgery'],
      referral_capabilities: ['upazila_health_complex'],
      contact: { phone: '456', email: 'dhaka@hosp.bd' },
      operational_status: 'operational',
      last_capacity_update: new Date().toISOString()
    }
  ];

  const sampleDoctors: Doctor[] = [
    {
      doctor_id: 'DOC-1',
      identity_type: 'TEST',
      identity_number: 'D-1',
      is_synthetic: true,
      full_name: 'Dr. Sharmeen Cardiologist',
      role: 'capital_specialist',
      facility_name: 'Khulna Medical College Hospital',
      district: 'Khulna',
      upazila: null,
      service_area: 'capital_referral',
      specialty: 'Cardiology',
      qualification: 'MBBS, MD Cardiology',
      registration_number: 'BMDC-C-999',
      contact: 'test',
      availability: '24/7',
      is_active: true
    }
  ];

  const ranked = rankHospitalRecommendations(
    samplePatient,
    sampleHospitals,
    sampleDoctors,
    'icu',
    'Cardiology',
    'code_red'
  );

  assert.equal(ranked.length, 2);
  // Khulna hospital must rank #1 because it has available ICU beds and is close (Dumuria to Khulna is 28km)
  assert.equal(ranked[0].hospital.hospital_id, 'HOSP-1');
  assert.ok(ranked[0].hasRequiredBed);
  assert.ok(ranked[0].score.totalScore > ranked[1].score.totalScore);
  assert.equal(ranked[0].assignedDoctor?.doctor_id, 'DOC-1');
});
