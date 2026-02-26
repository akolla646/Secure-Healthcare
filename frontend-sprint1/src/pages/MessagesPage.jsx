import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, Loader2, Clock } from 'lucide-react';

const MessagesPage = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                let res;
                if (user?.role?.toUpperCase() === 'PATIENT') {
                    res = await client.get('/appointments/my-appointments');
                } else if (user?.role?.toUpperCase() === 'DOCTOR') {
                    res = await client.get('/appointments/doctor');
                } else {
                    setLoading(false);
                    return;
                }

                // Sort by descending start date (newest first)
                const data = res.data.sort((a, b) => new Date(b.scheduled_start) - new Date(a.scheduled_start));

                const isPatient = user?.role?.toUpperCase() === 'PATIENT';
                const uniqueContacts = [];
                const seenIds = new Set();

                // Group the appointments strictly by unique Doctor/Patient pairs
                // so the user only sees ONE chat row representing their shared conversation,
                // instead of 5 rows if they have 5 upcoming appointments with the exact same doctor.
                for (const appt of data) {
                    const contactId = isPatient ? appt.doctor_id : appt.patient_id;
                    if (!seenIds.has(contactId)) {
                        seenIds.add(contactId);
                        uniqueContacts.push(appt);
                    }
                }

                setAppointments(uniqueContacts);
            } catch (err) {
                console.error("Failed to fetch appointments for messages", err);
                setError("Failed to load your consultations.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAppointments();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                <p className="text-red-500 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center text-slate-800">
                    <MessageSquare className="w-6 h-6 mr-3 text-teal-600" />
                    My Consultations & Messages
                </h1>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                {appointments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
                        <p>You have no past or upcoming consultations.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {appointments.map((appt) => {
                            const isPatient = user?.role?.toUpperCase() === 'PATIENT';
                            const otherPartyName = isPatient ? appt.doctor_name : appt.patient_name;

                            let title = otherPartyName || 'Unknown';
                            if (isPatient && !title.toLowerCase().startsWith('dr.')) {
                                title = `Dr. ${title}`;
                            } else if (!isPatient && title !== 'Unknown') {
                                title = `Patient: ${title}`;
                            }

                            const startDate = new Date(appt.scheduled_start);
                            const now = new Date();
                            const isPast = startDate < now;

                            return (
                                <li key={appt.appointment_id} className="hover:bg-slate-50 transition-colors">
                                    <Link to={`/telemedicine/${appt.appointment_id}`} className="flex items-center p-5">
                                        <div className="flex-shrink-0 mr-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                                                ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-teal-100 text-teal-700'}`}>
                                                {otherPartyName ? otherPartyName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {title || 'Unknown'}
                                            </p>
                                            <div className="flex items-center mt-1 text-xs text-slate-500 space-x-4">
                                                <span className="flex items-center">
                                                    <Calendar className="w-3.5 h-3.5 mr-1" />
                                                    {startDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {appt.status && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase
                                                        ${appt.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                                                            appt.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' :
                                                                'bg-blue-100 text-blue-700'}`}>
                                                        {appt.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end pl-4">
                                            <MessageSquare className={`w-5 h-5 ${isPast ? 'text-blue-500' : 'text-slate-300'}`} />
                                            {isPast ? (
                                                <span className="text-[10px] text-blue-600 font-medium mt-1">Open Chat</span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-medium mt-1">Upcoming</span>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
