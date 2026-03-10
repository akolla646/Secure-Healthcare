// ============================================================
// TelemedicinePage.jsx
// Entry page for the telemedicine feature.
// Accessed via route: /telemedicine/:appointmentId
//
// Responsibilities:
//   - Resolve appointment details and check access
//   - Enforce the appointment start-time gate
//     (users cannot enter before scheduled_start)
//   - Find or create the telemedicine session
//   - Render TelemedicineChat once a session_id is available
// ============================================================

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import client from '../api/client';
import TelemedicineChat from '../components/TelemedicineChat';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TelemedicinePage = () => {
    // appointmentId comes from the URL: /telemedicine/:appointmentId
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Currently logged-in user (doctor or patient)

    // sessionId is resolved from the backend after appointment validation
    const [sessionId, setSessionId] = useState(null);
    // Full appointment object (includes scheduled_start, scheduled_end, hasPastAppointments)
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                // Call the combined endpoint that returns:
                //   session          → existing shared session (null if first visit)
                //   appointment      → timing details
                //   hasPastAppointments → whether chat is permanently unlocked
                const res = await client.get(`/telemedicine/appointment/${appointmentId}`);
                const { session, appointment: fetchedAppointment, hasPastAppointments } = res.data.data;

                // Attach hasPastAppointments onto the appointment object so it can
                // be passed as a single prop to TelemedicineChat
                fetchedAppointment.hasPastAppointments = hasPastAppointments;
                setAppointment(fetchedAppointment);

                // --- Time Gate ---
                // Prevent users from entering before the appointment starts
                const now = new Date();
                const startTime = new Date(fetchedAppointment.scheduled_start);

                if (now < startTime) {
                    // Show a friendly error with the exact scheduled time
                    setError(`This session is not available yet. Your appointment is scheduled for ${startTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`);
                    setLoading(false);
                    return;
                }

                if (session) {
                    // A session already exists for this doctor-patient pair → reuse it
                    setSessionId(session.session_id);
                } else {
                    // First visit: create a new session for this appointment
                    // (In routes.js, POST /session is DOCTOR-only, but here both
                    //  doctor and patient attempt to create — the server handles it)
                    try {
                        const createRes = await client.post('/telemedicine/session', { appointmentId });
                        setSessionId(createRes.data.data.session_id);
                    } catch (createErr) {
                        setError('Failed to start telemedicine session.');
                    }
                }
            } catch (err) {
                // Map HTTP status codes to user-friendly error messages
                if (err.response?.status === 404) {
                    setError('Appointment not found.');
                } else if (err.response?.status === 403) {
                    setError('You are not authorized to view this appointment.');
                } else {
                    setError('Failed to load telemedicine session.');
                }
            } finally {
                setLoading(false);
            }
        };

        // Only run if appointmentId present in URL
        if (appointmentId) {
            fetchSession();
        }
    }, [appointmentId, user]);

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            {/* Back navigation button */}
            <div className="w-full max-w-2xl mb-4 flex justify-start">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-teal-600 hover:text-teal-700 font-medium transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </button>
            </div>

            {/* Conditional rendering based on load state */}
            {loading ? (
                // Show spinner while resolving session
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
            ) : error ? (
                // Show error card (time gate, 404, 403, etc.)
                <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center">
                    <div className="text-red-500 mb-4 text-xl font-semibold">Session Unavailable</div>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                    >
                        Return to Dashboard
                    </button>
                </div>
            ) : sessionId && appointment ? (
                // Once session is resolved, render the chat + video component
                <div className="w-full flex justify-center">
                    <TelemedicineChat sessionId={sessionId} appointment={appointment} />
                </div>
            ) : null}
        </div>
    );
};

export default TelemedicinePage;
