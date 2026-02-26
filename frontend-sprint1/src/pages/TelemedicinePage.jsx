import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import client from '../api/client';
import TelemedicineChat from '../components/TelemedicineChat';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TelemedicinePage = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [sessionId, setSessionId] = useState(null);
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                // Fetch existing session and appointment info
                // We also receive `hasPastAppointments` which tells us if the chat is unlocked
                const res = await client.get(`/telemedicine/appointment/${appointmentId}`);
                const { session, appointment: fetchedAppointment, hasPastAppointments } = res.data.data;
                fetchedAppointment.hasPastAppointments = hasPastAppointments;
                setAppointment(fetchedAppointment);

                const now = new Date();
                const startTime = new Date(fetchedAppointment.scheduled_start);

                if (now < startTime) {
                    setError(`This session is not available yet. Your appointment is scheduled for ${startTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`);
                    setLoading(false);
                    return;
                }

                if (session) {
                    setSessionId(session.session_id);
                } else {
                    // If session doesn't exist, create it (both doctor and patient can initiate)
                    try {
                        const createRes = await client.post('/telemedicine/session', { appointmentId });
                        setSessionId(createRes.data.data.session_id);
                    } catch (createErr) {
                        setError('Failed to start telemedicine session.');
                    }
                }
            } catch (err) {
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

        if (appointmentId) {
            fetchSession();
        }
    }, [appointmentId, user]);

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-2xl mb-4 flex justify-start">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-teal-600 hover:text-teal-700 font-medium transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
            ) : error ? (
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
                <div className="w-full flex justify-center">
                    <TelemedicineChat sessionId={sessionId} appointment={appointment} />
                </div>
            ) : null}
        </div>
    );
};

export default TelemedicinePage;
