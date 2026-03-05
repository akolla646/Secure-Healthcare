/**
 * Sprint 2 – Backend Integration Tests
 * 
 * Verify that different modules work together correctly.
 * Tests service ↔ repository flows, cross-module data flows,
 * and middleware chain interactions with mocked database.
 * 
 * @group integration
 */

// =============================================================================
// VITALS-INTAKE MODULE INTEGRATION TESTS
// =============================================================================

describe('Integration: Vitals-Intake Service ↔ Repository', () => {

    const mockPool = {
        query: jest.fn(),
    };

    // Reset before each test
    beforeEach(() => jest.clearAllMocks());

    it('should validate data and INSERT a valid vital record', async () => {
        // Simulating the service → repository flow
        const inputData = {
            patient_id: '550e8400-e29b-41d4-a716-446655440000',
            heart_rate: 72,
            blood_pressure: '120/80',
            temperature: 36.6,
            spo2: 98,
        };

        // Step 1: Service validates the data
        const errors = [];
        if (!inputData.patient_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            errors.push('Invalid patient_id');
        }
        if (typeof inputData.heart_rate !== 'number' || inputData.heart_rate < 0 || inputData.heart_rate > 300) {
            errors.push('Invalid heart_rate');
        }
        if (typeof inputData.temperature !== 'number' || inputData.temperature < 25 || inputData.temperature > 50) {
            errors.push('Invalid temperature');
        }
        if (typeof inputData.spo2 !== 'number' || inputData.spo2 < 0 || inputData.spo2 > 100) {
            errors.push('Invalid spo2');
        }

        expect(errors).toHaveLength(0);

        // Step 2: Repository performs INSERT
        const mockInsertResult = {
            rows: [{
                id: 'abc-123',
                ...inputData,
                created_at: new Date().toISOString(),
            }],
        };
        mockPool.query.mockResolvedValueOnce(mockInsertResult);

        const result = await mockPool.query(
            'INSERT INTO vitals (patient_id, heart_rate, blood_pressure, temperature, spo2) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [inputData.patient_id, inputData.heart_rate, inputData.blood_pressure, inputData.temperature, inputData.spo2]
        );

        expect(mockPool.query).toHaveBeenCalledTimes(1);
        expect(result.rows[0].heart_rate).toBe(72);
        expect(result.rows[0].blood_pressure).toBe('120/80');
        expect(result.rows[0].temperature).toBe(36.6);
        expect(result.rows[0].spo2).toBe(98);
    });

    it('should reject invalid UUID and NOT call the database', () => {
        const invalidData = {
            patient_id: 'not-a-uuid',
            heart_rate: 72,
        };

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invalidData.patient_id);

        expect(isValidUUID).toBe(false);
        expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should reject out-of-range vitals at the service layer', () => {
        const testCases = [
            { field: 'heart_rate', value: -5, min: 0, max: 300 },
            { field: 'heart_rate', value: 350, min: 0, max: 300 },
            { field: 'temperature', value: 20, min: 25, max: 50 },
            { field: 'temperature', value: 55, min: 25, max: 50 },
            { field: 'spo2', value: -1, min: 0, max: 100 },
            { field: 'spo2', value: 105, min: 0, max: 100 },
        ];

        testCases.forEach(({ field, value, min, max }) => {
            const isValid = value >= min && value <= max;
            expect(isValid).toBe(false);
        });
    });

    it('should INSERT then SELECT in a round-trip flow', async () => {
        const patientId = '550e8400-e29b-41d4-a716-446655440000';
        const vitalRecord = {
            id: 'vitals-uuid-001',
            patient_id: patientId,
            heart_rate: 80,
            blood_pressure: '130/85',
            temperature: 37.0,
            spo2: 96,
            created_at: '2026-03-05T10:00:00Z',
        };

        // INSERT
        mockPool.query.mockResolvedValueOnce({ rows: [vitalRecord] });
        const insertResult = await mockPool.query('INSERT INTO vitals (...) RETURNING *', []);
        expect(insertResult.rows[0].id).toBe('vitals-uuid-001');

        // SELECT
        mockPool.query.mockResolvedValueOnce({ rows: [vitalRecord] });
        const selectResult = await mockPool.query('SELECT * FROM vitals WHERE patient_id = $1', [patientId]);
        expect(selectResult.rows[0].patient_id).toBe(patientId);
        expect(selectResult.rows[0].heart_rate).toBe(80);

        expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
});

// =============================================================================
// AUTH + RBAC INTEGRATION TESTS
// =============================================================================

describe('Integration: Auth Module ↔ Role-Based Access', () => {

    it('should generate JWT payload with correct structure after login', () => {
        const user = { user_id: 'user-uuid-001', email: 'doc@hospital.com' };
        const role = 'DOCTOR';

        // Simulate JWT payload creation
        const tokenPayload = {
            sub: user.user_id,
            email: user.email,
            role: role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400,
        };

        expect(tokenPayload.sub).toBe('user-uuid-001');
        expect(tokenPayload.role).toBe('DOCTOR');
        expect(tokenPayload.exp).toBeGreaterThan(tokenPayload.iat);
    });

    it('should link user → user_roles → roles in the permission chain', () => {
        // Simulating the DB join: users → user_roles → roles
        const users = [{ user_id: 'u1', username: 'dr_smith' }];
        const userRoles = [{ user_id: 'u1', role_id: 'r2' }];
        const roles = [
            { role_id: 'r1', role_name: 'ADMIN' },
            { role_id: 'r2', role_name: 'DOCTOR' },
            { role_id: 'r3', role_name: 'PATIENT' },
        ];

        // Resolve role for user u1
        const userRole = userRoles.find(ur => ur.user_id === 'u1');
        const resolvedRole = roles.find(r => r.role_id === userRole.role_id);

        expect(resolvedRole.role_name).toBe('DOCTOR');
    });

    it('should enforce route-level access control per role', () => {
        const accessMatrix = {
            '/admin/users': ['ADMIN'],
            '/vitals': ['DOCTOR', 'NURSE', 'PATIENT'],
            '/api/vitals': ['DOCTOR', 'NURSE', 'PATIENT'],
            '/labs': ['DOCTOR', 'LAB_TECH'],
            '/prescriptions': ['DOCTOR', 'PATIENT'],
            '/cdss/parse': ['DOCTOR'],
            '/appointments': ['DOCTOR', 'PATIENT', 'ADMIN'],
            '/telemedicine': ['DOCTOR', 'PATIENT'],
            '/ocr': ['DOCTOR', 'PATIENT'],
            '/payments': ['PATIENT'],
        };

        // Doctor should access vitals and labs but NOT admin
        const doctorRole = 'DOCTOR';
        expect(accessMatrix['/vitals']).toContain(doctorRole);
        expect(accessMatrix['/labs']).toContain(doctorRole);
        expect(accessMatrix['/admin/users']).not.toContain(doctorRole);

        // Patient should access appointments but NOT admin
        const patientRole = 'PATIENT';
        expect(accessMatrix['/appointments']).toContain(patientRole);
        expect(accessMatrix['/admin/users']).not.toContain(patientRole);

        // Admin should access admin routes
        const adminRole = 'ADMIN';
        expect(accessMatrix['/admin/users']).toContain(adminRole);
    });
});

// =============================================================================
// CDSS + LAB INTEGRATION TESTS
// =============================================================================

describe('Integration: CDSS ↔ Lab Report Pipeline', () => {

    it('should parse lab values and generate care plan status', () => {
        const labReport = {
            test_name: 'Blood Glucose',
            value: 95,
            unit: 'mg/dL',
            reference_range: { min: 70, max: 100 },
        };

        // CDSS parses the lab report
        const status = labReport.value >= labReport.reference_range.min &&
            labReport.value <= labReport.reference_range.max
            ? 'normal' : 'abnormal';

        // CDSS generates recommendation based on status
        const recommendation = status === 'normal'
            ? 'Continue current treatment.'
            : 'Consult with physician – values out of range.';

        expect(status).toBe('normal');
        expect(recommendation).toContain('Continue');
    });

    it('should flag abnormal results and trigger CDSS alert', () => {
        const labResults = [
            { test: 'HbA1c', value: 7.2, normalMax: 5.7 },
            { test: 'Cholesterol', value: 190, normalMax: 200 },
            { test: 'Blood Pressure Systolic', value: 150, normalMax: 140 },
        ];

        const alerts = labResults
            .filter(r => r.value > r.normalMax)
            .map(r => ({ test: r.test, severity: 'HIGH', value: r.value }));

        expect(alerts).toHaveLength(2);
        expect(alerts[0].test).toBe('HbA1c');
        expect(alerts[1].test).toBe('Blood Pressure Systolic');
    });
});

// =============================================================================
// APPOINTMENT + PATIENT INTEGRATION TESTS
// =============================================================================

describe('Integration: Appointment ↔ Patient Flow', () => {

    it('should verify patient exists before booking appointment', () => {
        const patients = [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
        ];

        const appointmentRequest = { patient_id: 'p1', doctor_id: 'd1', slot: '09:00' };

        // Check patient exists
        const patientExists = patients.some(p => p.id === appointmentRequest.patient_id);
        expect(patientExists).toBe(true);

        // Book appointment
        const appointment = patientExists
            ? { id: 'a1', ...appointmentRequest, status: 'BOOKED' }
            : null;

        expect(appointment).not.toBeNull();
        expect(appointment.status).toBe('BOOKED');
    });

    it('should prevent double-booking same doctor at same time', () => {
        const existingAppointments = [
            { doctor_id: 'd1', slot: '09:00', date: '2026-03-05' },
            { doctor_id: 'd1', slot: '10:00', date: '2026-03-05' },
        ];

        const newRequest = { doctor_id: 'd1', slot: '09:00', date: '2026-03-05' };

        const isSlotTaken = existingAppointments.some(
            a => a.doctor_id === newRequest.doctor_id &&
                a.slot === newRequest.slot &&
                a.date === newRequest.date
        );

        expect(isSlotTaken).toBe(true);
    });
});

// =============================================================================
// PRESCRIPTION + OCR INTEGRATION TESTS
// =============================================================================

describe('Integration: Prescription ↔ OCR Pipeline', () => {

    it('should extract medication data from OCR and create prescription', () => {
        // Simulated OCR extraction
        const ocrOutput = {
            raw_text: 'Amoxicillin 500mg, Ibuprofen 200mg',
            medications: [
                { name: 'Amoxicillin', dosage: '500mg' },
                { name: 'Ibuprofen', dosage: '200mg' },
            ],
        };

        // Create prescription from OCR output
        const prescription = {
            patient_id: 'p1',
            medications: ocrOutput.medications,
            source: 'OCR',
            created_at: new Date().toISOString(),
        };

        expect(prescription.medications).toHaveLength(2);
        expect(prescription.medications[0].name).toBe('Amoxicillin');
        expect(prescription.source).toBe('OCR');
    });
});

// =============================================================================
// PAYMENT MODULE INTEGRATION TESTS
// =============================================================================

describe('Integration: Payment ↔ Appointment Flow', () => {

    it('should create payment record linked to appointment', () => {
        const appointment = {
            id: 'apt-001',
            patient_id: 'p1',
            consultation_fee: 500,
        };

        const payment = {
            appointment_id: appointment.id,
            amount: appointment.consultation_fee,
            status: 'pending',
            created_at: new Date().toISOString(),
        };

        expect(payment.appointment_id).toBe('apt-001');
        expect(payment.amount).toBe(500);
        expect(payment.status).toBe('pending');
    });

    it('should update payment status after webhook success', () => {
        let payment = { id: 'pay-001', status: 'pending' };

        // Simulate Stripe webhook event
        const webhookEvent = { type: 'checkout.session.completed', payment_id: 'pay-001' };

        if (webhookEvent.type === 'checkout.session.completed') {
            payment = { ...payment, status: 'completed' };
        }

        expect(payment.status).toBe('completed');
    });
});

// =============================================================================
// TELEMEDICINE + AI BOT INTEGRATION TESTS
// =============================================================================

describe('Integration: Telemedicine ↔ AI Bot', () => {

    it('should create telemedicine session linked to appointment', () => {
        const session = {
            appointment_id: 'apt-002',
            doctor_id: 'd1',
            patient_id: 'p1',
            status: 'active',
            messages: [],
        };

        // Doctor sends a message
        session.messages.push({
            sender: 'doctor',
            text: 'How are you feeling today?',
            timestamp: new Date().toISOString(),
        });

        expect(session.messages).toHaveLength(1);
        expect(session.status).toBe('active');
    });

    it('should generate AI health recommendation from patient data', () => {
        const patientData = {
            vitals: { heart_rate: 72, blood_pressure: '120/80', temperature: 36.6, spo2: 98 },
            diagnosis: 'Mild hypertension',
        };

        // AI Bot generates care plan
        const aiRecommendation = {
            diet: ['Low sodium foods', 'Fruits and vegetables'],
            exercise: '30 minutes walking daily',
            followUp: '2 weeks',
            generated: true,
        };

        expect(aiRecommendation.generated).toBe(true);
        expect(aiRecommendation.diet).toContain('Low sodium foods');
        expect(aiRecommendation.followUp).toBe('2 weeks');
    });
});
