/**
 * Vitals API Service
 * 
 * Frontend API layer for Sprint 2 vitals-intake endpoints.
 * Uses the shared axios client with auth interceptors.
 * 
 * @module api/vitalsApi
 */

import api from './client';

/**
 * Submit new vital signs for a patient
 * 
 * @param {Object} data - Vitals data
 * @param {string} data.patient_id - Patient UUID
 * @param {number} data.heart_rate - Heart rate (bpm)
 * @param {string} data.blood_pressure - Blood pressure (e.g., "120/80")
 * @param {number} data.temperature - Temperature (°C)
 * @param {number} data.spo2 - SpO2 percentage
 * @returns {Promise} Axios response with created vital record
 */
export const submitVitals = (data) => api.post('/api/vitals', data);

/**
 * Fetch all vitals history for a specific patient
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Promise} Axios response with vitals array
 */
export const fetchPatientVitals = (patientId) => api.get(`/api/vitals/${patientId}`);
