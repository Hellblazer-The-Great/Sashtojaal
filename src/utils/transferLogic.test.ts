import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateDistanceKm,
  estimateTransitMinutes,
  inferClinicalNeeds,
  rankHospitalRecommendations,
  getDivisionForDistrict
} from './transferLogic.ts';
import { Hospital, Patient, Doctor } from '../types/index.ts';

test('getDivisionForDistrict maps Bangladesh districts to official divisions', () => {
  assert.equal(getDivisionForDistrict('Khulna'), 'Khulna Division');
  assert.equal(getDivisionForDistrict('Jashore'), 'Khulna Division');
  assert.equal(getDivisionForDistrict('Dhaka'), 'Dhaka Division');
  assert.equal(getDivisionForDistrict('Chattogram'), 'Chattogram Division');
  assert.equal(getDivisionForDistrict('Rajshahi'), 'Rajshahi Division');
});

test('estimateDistanceKm calculates realistic distances between Upazilas and City Hospitals', () => {
  // Dumuria to Khulna City Hospital
  const dumuriaToKhulna = estimateDistanceKm('Khulna', 'Dumuria', 'Khulna');
  assert.equal(dumuriaToKhulna, 28);

  // Khulna to Jashore
  const khulnaToJashore = estimateDistanceKm('Khulna', null, 'Jashore');
  assert.equal(khulnaToJashore, 65);

  // Khulna to Dhaka
  const khulnaToDhaka = estimateDistanceKm('Khulna', null, 'Dhaka');
  assert.equal(khulnaToDhaka, 215);
});

test('inferClinicalNeeds maps clinical conditions to correct specialty and bed type', () => {
  const cardiac = inferClinicalNeeds('Acute Myocardial Infarction with ST elevation');
  assert.equal(cardiac.requiredSpecialty, 'Cardiology');
  assert.equal(cardiac.defaultBedType, 'icu');
  assert.equal(cardiac.urgency, 'code_red');

  const stroke = inferClinicalNeeds('Sudden onset left-sided hemiplegia and severe headache');
  assert.equal(stroke.requiredSpecialty, 'Neurology');
  assert.equal(stroke.defaultBedType, 'icu');

  const fracture = inferClinicalNeeds('Open compound fracture of right tibia from accident');
  assert.equal(fracture.requiredSpecialty, 'Orthopaedics');
  assert.equal(fracture.defaultBedType, 'hdu');
});

test('rankHospitalRecommendations prioritizes city hospital with available beds and matching specialist', () => {
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
    division: 'Khulna Division',
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
      hospital_id: 'HOSP-KMCH',
      facility_name: 'Khulna Medical College Hospital',
      facility_type: 'city_hospital',
      ownership: 'government',
      is_synthetic_record: true,
      location: {
        country: 'Bangladesh',
        division: 'Khulna Division',
        district: 'Khulna',
        upazila: null,
        address: 'Khulna'
      },
      service_level: 'city_hospital',
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
      hospital_id: 'HOSP-DMCH',
      facility_name: 'Dhaka Medical College Hospital',
      facility_type: 'city_hospital',
      ownership: 'government',
      is_synthetic_record: true,
      location: {
        country: 'Bangladesh',
        division: 'Dhaka Division',
        district: 'Dhaka',
        upazila: null,
        address: 'Dhaka'
      },
      service_level: 'city_hospital',
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
      doctor_id: 'DOC-KMCH-1',
      identity_type: 'TEST',
      identity_number: 'D-1',
      is_synthetic: true,
      full_name: 'Dr. Sharmeen Akhter',
      role: 'city_specialist',
      facility_name: 'Khulna Medical College Hospital',
      division: 'Khulna Division',
      district: 'Khulna',
      upazila: null,
      service_area: 'city_hospital',
      specialty: 'Cardiology',
      qualification: 'MBBS, FCPS',
      registration_number: 'BMDC-A-41290',
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
  assert.equal(ranked[0].hospital.hospital_id, 'HOSP-KMCH');
  assert.ok(ranked[0].hasRequiredBed);
  assert.ok(ranked[0].score.totalScore > ranked[1].score.totalScore);
  assert.equal(ranked[0].assignedDoctor?.doctor_id, 'DOC-KMCH-1');
});
