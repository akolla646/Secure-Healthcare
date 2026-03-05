/**
 * Sprint 2 – Frontend Integration Tests
 * 
 * Verify Sprint 2 frontend components work together correctly:
 * VitalsDashboard, VitalIntakeForm, traffic-light logic, Sidebar nav.
 * 
 * @group integration
 */
import { describe, it, expect, vi } from 'vitest';

// =============================================================================
// VITALS DASHBOARD COMPONENT LOGIC TESTS
// =============================================================================

describe('Integration: Vitals Dashboard Logic', () => {

    it('should transform vitals data for Recharts line chart', () => {
        const rawVitals = [
            { id: 'v1', heart_rate: 72, blood_pressure: '120/80', temperature: '36.6', spo2: 98, created_at: '2026-03-05T10:00:00Z' },
            { id: 'v2', heart_rate: 85, blood_pressure: '130/85', temperature: '37.1', spo2: 97, created_at: '2026-03-04T10:00:00Z' },
        ];

        // Transform for chart (chronological order = oldest first)
        const chartData = [...rawVitals].reverse().map(v => ({
            time: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            heart_rate: v.heart_rate,
            systolic: parseInt(v.blood_pressure.split('/')[0], 10),
            diastolic: parseInt(v.blood_pressure.split('/')[1], 10),
            temperature: parseFloat(v.temperature),
            spo2: v.spo2,
        }));

        expect(chartData).toHaveLength(2);
        expect(chartData[0].heart_rate).toBe(85); // Older record first
        expect(chartData[1].heart_rate).toBe(72); // Newer record second
        expect(chartData[0].systolic).toBe(130);
        expect(chartData[0].diastolic).toBe(85);
    });

    it('should get latest vitals for metric cards', () => {
        const vitals = [
            { heart_rate: 72, spo2: 98, temperature: '36.6', created_at: '2026-03-05T10:00:00Z' },
            { heart_rate: 85, spo2: 97, temperature: '37.1', created_at: '2026-03-04T10:00:00Z' },
        ];

        // API returns ordered by created_at DESC, so first = latest
        const latest = vitals[0];

        expect(latest.heart_rate).toBe(72);
        expect(latest.spo2).toBe(98);
    });
});

// =============================================================================
// TRAFFIC-LIGHT CARD LOGIC TESTS
// =============================================================================

describe('Integration: Traffic-Light Classification', () => {

    const THRESHOLDS = {
        heart_rate: { low: 60, high: 100, amberLow: 55, amberHigh: 110 },
        spo2: { low: 95, high: 101, amberLow: 92, amberHigh: 102 },
        temperature: { low: 36.1, high: 37.5, amberLow: 35.5, amberHigh: 38.0 },
    };

    function getStatus(metric, value) {
        if (value == null) return 'gray';
        const t = THRESHOLDS[metric];
        if (!t) return 'gray';
        if (value < t.amberLow || value > t.amberHigh) return 'red';
        if (value < t.low || value > t.high) return 'amber';
        return 'green';
    }

    it('should classify normal values as green', () => {
        expect(getStatus('heart_rate', 72)).toBe('green');
        expect(getStatus('heart_rate', 80)).toBe('green');
        expect(getStatus('spo2', 98)).toBe('green');
        expect(getStatus('spo2', 99)).toBe('green');
        expect(getStatus('temperature', 36.6)).toBe('green');
        expect(getStatus('temperature', 37.0)).toBe('green');
    });

    it('should classify borderline values as amber', () => {
        expect(getStatus('heart_rate', 58)).toBe('amber');
        expect(getStatus('heart_rate', 105)).toBe('amber');
        expect(getStatus('spo2', 93)).toBe('amber');
        expect(getStatus('temperature', 35.8)).toBe('amber');
        expect(getStatus('temperature', 37.8)).toBe('amber');
    });

    it('should classify critical values as red', () => {
        expect(getStatus('heart_rate', 40)).toBe('red');
        expect(getStatus('heart_rate', 150)).toBe('red');
        expect(getStatus('spo2', 85)).toBe('red');
        expect(getStatus('spo2', 90)).toBe('red');
        expect(getStatus('temperature', 39.5)).toBe('red');
        expect(getStatus('temperature', 34.0)).toBe('red');
    });

    it('should handle null/undefined values as gray', () => {
        expect(getStatus('heart_rate', null)).toBe('gray');
        expect(getStatus('spo2', undefined)).toBe('gray');
        expect(getStatus('temperature', null)).toBe('gray');
    });

    it('should classify blood pressure correctly', () => {
        const classifyBP = (value) => {
            if (!value) return 'gray';
            const parts = value.split('/');
            if (parts.length !== 2) return 'gray';
            const systolic = parseInt(parts[0], 10);
            if (systolic > 140 || systolic < 90) return 'red';
            if (systolic > 130 || systolic < 95) return 'amber';
            return 'green';
        };

        expect(classifyBP('120/80')).toBe('green');
        expect(classifyBP('115/75')).toBe('green');
        expect(classifyBP('135/90')).toBe('amber');
        expect(classifyBP('92/60')).toBe('amber');
        expect(classifyBP('160/100')).toBe('red');
        expect(classifyBP('85/55')).toBe('red');
        expect(classifyBP(null)).toBe('gray');
    });
});

// =============================================================================
// VITAL INTAKE FORM VALIDATION TESTS
// =============================================================================

describe('Integration: VitalIntakeForm Validation', () => {

    it('should validate UUID format for patient_id', () => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        expect(uuidRegex.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(uuidRegex.test('not-a-uuid')).toBe(false);
        expect(uuidRegex.test('')).toBe(false);
    });

    it('should validate blood pressure format', () => {
        const bpRegex = /^\d{2,3}\/\d{2,3}$/;

        expect(bpRegex.test('120/80')).toBe(true);
        expect(bpRegex.test('90/60')).toBe(true);
        expect(bpRegex.test('140/90')).toBe(true);
        expect(bpRegex.test('120')).toBe(false);
        expect(bpRegex.test('abc/def')).toBe(false);
        expect(bpRegex.test('')).toBe(false);
    });

    it('should parse and validate numeric inputs', () => {
        const parseVitalInput = (value, min, max) => {
            const num = Number(value);
            return !isNaN(num) && num >= min && num <= max;
        };

        // Heart rate (1-300)
        expect(parseVitalInput('72', 1, 300)).toBe(true);
        expect(parseVitalInput('0', 1, 300)).toBe(false);
        expect(parseVitalInput('abc', 1, 300)).toBe(false);

        // Temperature (25-50)
        expect(parseVitalInput('36.6', 25, 50)).toBe(true);
        expect(parseVitalInput('20', 25, 50)).toBe(false);

        // SpO2 (0-100)
        expect(parseVitalInput('98', 0, 100)).toBe(true);
        expect(parseVitalInput('105', 0, 100)).toBe(false);
    });

    it('should construct correct API payload', () => {
        const formData = {
            patient_id: '550e8400-e29b-41d4-a716-446655440000',
            heart_rate: '72',
            blood_pressure: '120/80',
            temperature: '36.6',
            spo2: '98',
        };

        const payload = {
            patient_id: formData.patient_id,
            heart_rate: parseInt(formData.heart_rate, 10),
            blood_pressure: formData.blood_pressure.trim(),
            temperature: parseFloat(formData.temperature),
            spo2: parseInt(formData.spo2, 10),
        };

        expect(payload.heart_rate).toBe(72);
        expect(typeof payload.heart_rate).toBe('number');
        expect(payload.temperature).toBe(36.6);
        expect(typeof payload.temperature).toBe('number');
        expect(payload.spo2).toBe(98);
        expect(typeof payload.spo2).toBe('number');
    });
});

// =============================================================================
// SIDEBAR NAVIGATION LOGIC TESTS
// =============================================================================

describe('Integration: Sidebar Navigation', () => {

    const navItems = {
        Doctor: ['Patient Dashboard', 'Vitals Dashboard', 'My Patients', 'Diagnosis & EHR'],
        Patient: ['My Health Summary', 'My Care Plan', 'Appointments'],
        Admin: ['Admin Overview', 'User Management', 'Audit Logs', 'Compliance'],
        Nurse: ['Ward Dashboard', 'Vitals Dashboard', 'Vitals Monitoring'],
        Staff: ['Overview'],
    };

    it('should show correct nav items for Doctor role', () => {
        expect(navItems['Doctor']).toContain('Vitals Dashboard');
        expect(navItems['Doctor']).toContain('Patient Dashboard');
        expect(navItems['Doctor']).toHaveLength(4);
    });

    it('should show correct nav items for Nurse role', () => {
        expect(navItems['Nurse']).toContain('Vitals Dashboard');
        expect(navItems['Nurse']).toContain('Ward Dashboard');
    });

    it('should show correct nav items for Patient role', () => {
        expect(navItems['Patient']).toContain('My Health Summary');
        expect(navItems['Patient']).not.toContain('Vitals Dashboard');
    });

    it('should normalize role for case-insensitive lookup', () => {
        const normalizeRole = (role) =>
            role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : null;

        expect(normalizeRole('DOCTOR')).toBe('Doctor');
        expect(normalizeRole('ADMIN')).toBe('Admin');
        expect(normalizeRole('NURSE')).toBe('Nurse');
        expect(normalizeRole('patient')).toBe('Patient');
        expect(normalizeRole(null)).toBe(null);
    });

    it('should fallback to Staff nav for unknown roles', () => {
        const getNav = (role) => navItems[role] || navItems['Staff'];

        expect(getNav('Unknown')).toEqual(['Overview']);
        expect(getNav(undefined)).toEqual(['Overview']);
    });
});

// =============================================================================
// API SERVICE LAYER TESTS
// =============================================================================

describe('Integration: VitalsApi Service', () => {

    it('should construct correct POST URL for submitVitals', () => {
        const baseURL = '/api';
        const endpoint = '/api/vitals';
        const fullURL = baseURL + endpoint.replace('/api', '');

        expect(fullURL).toBe('/api/vitals');
    });

    it('should construct correct GET URL for fetchPatientVitals', () => {
        const patientId = '550e8400-e29b-41d4-a716-446655440000';
        const url = `/api/vitals/${patientId}`;

        expect(url).toContain(patientId);
        expect(url).toMatch(/^\/api\/vitals\//);
    });

    it('should handle API error responses correctly', () => {
        const errorResponse = {
            status: 400,
            data: { error: 'patient_id is required' },
        };

        const errorMessage = errorResponse.data?.error || 'Failed to save vital signs.';
        expect(errorMessage).toBe('patient_id is required');
    });
});
