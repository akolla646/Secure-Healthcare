const telemedicineRepo = require("./telemedicine.repository");

exports.createSession = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.user.user_id;

        if (!appointmentId) {
            return res.status(400).json({ success: false, error: "Missing appointmentId" });
        }

        const appointment = await telemedicineRepo.getAppointmentDetails(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, error: "Appointment not found" });
        }

        if (appointment.doctor_user_id !== userId && appointment.patient_user_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized: Appointment does not belong to you" });
        }

        // 3. Find or create a shared session uniquely for this Doctor-Patient pair
        let session = await telemedicineRepo.getSessionByParticipants(
            appointment.doctor_user_id,
            appointment.patient_user_id
        );

        // 4. Create a new session ONLY if one doesn't already exist for this pair
        if (!session) {
            session = await telemedicineRepo.createSession(
                appointment.appointment_id,
                appointment.doctor_user_id,
                appointment.patient_user_id
            );
        }

        res.status(201).json({ success: true, data: session });
    } catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({ success: false, error: "Failed to create telemedicine session" });
    }
};

exports.getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.user_id;

        const session = await telemedicineRepo.getSessionById(sessionId);

        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        if (session.doctor_id !== userId && session.patient_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized access to session" });
        }

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        console.error("Get session error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch session" });
    }
};

exports.getSessionByAppointmentId = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.user_id;

        const appointment = await telemedicineRepo.getAppointmentDetails(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, error: "Appointment not found" });
        }

        if (appointment.doctor_user_id !== userId && appointment.patient_user_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized access" });
        }

        // 3. Fetch the shared session for this Doctor-Patient pair (instead of per appointment)
        const session = await telemedicineRepo.getSessionByParticipants(
            appointment.doctor_user_id,
            appointment.patient_user_id
        );

        // 4. Check if they have concluded at least one appointment (required to unlock chat)
        const pastAppointmentsCount = await telemedicineRepo.getPastAppointmentsCount(
            appointment.doctor_user_id,
            appointment.patient_user_id
        );

        res.status(200).json({
            success: true,
            data: {
                session: session || null,
                appointment,
                hasPastAppointments: pastAppointmentsCount > 0
            }
        });
    } catch (error) {
        console.error("Get session by appointment error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch session" });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.user_id;

        const session = await telemedicineRepo.getSessionById(sessionId);

        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        if (session.doctor_id !== userId && session.patient_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized access to messages" });
        }

        const messages = await telemedicineRepo.getMessagesBySession(sessionId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch messages" });
    }
};
