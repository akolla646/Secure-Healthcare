/**
 * Patient Dashboard Component
 * 
 * The main portal for patients to interact with their healthcare data.
 * Features:
 * - Upcoming Appointments: List and View details.
 * - Lab Reports: View list, see details, and download as text file.
 * - Quick Actions: Shortcuts to common tasks.
 * - Wellness Banner: Personalized greeting.
 */

import { useState, useEffect } from 'react';
import { Calendar, FileText, ArrowRight, Beaker, CheckCircle, Lock, Download, Loader2, Clock, MessageSquare, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { createCheckoutSession } from '../../api/client';
import Modal from '../../components/Modal';
import VitalsSummary from '../../components/VitalsSummary';

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [appointments, setAppointments] = useState([]);
    const [labReports, setLabReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State for Lab Reports
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState(null);

    // Modal State for Appointments
    const [viewingAppointment, setViewingAppointment] = useState(null);
    const [viewingSlip, setViewingSlip] = useState(null);

    // Modal State for GDPR Data Erasure
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Fetch initial dashboard data

    // Fetch initial dashboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Appointments
                const apptRes = await api.get('/appointments/my-appointments');
                if (apptRes.data && apptRes.data.length > 0) {
                    // Filter for future and today's appointments and sort by date
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const future = apptRes.data
                        .filter(a => new Date(a.scheduled_start) >= today)
                        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
                    setAppointments(future);
                }

                // 2. Fetch Lab Reports
                const labsRes = await api.get('/labs/my-reports');
                setLabReports(labsRes.data || []);

            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);



    const handlePayNow = async (appointment) => {
        try {
            // Initiate Stripe Checkout
            const response = await createCheckoutSession({
                amount: appointment.consultation_fee || 300, // Default to ₹300 if not set
                description: `Consultation with ${appointment.doctor_name}`,
                userId: user.sub || user.user_id,
                appointmentId: appointment.appointment_id // Link payment to appointment
            });

            // Redirect to Stripe
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (err) {
            console.error("Payment initiation failed", err);
            alert("Failed to initiate payment. Please try again.");
        }
    };

    /**
     * Fetch full details for a selected lab report and open the modal.
     */
    const handleViewReport = async (reportId) => {
        setLoadingReport(true);
        setIsModalOpen(true);
        setSelectedReport(null);
        setError(null);

        try {
            const response = await api.get(`/labs/reports/${reportId}`);
            setSelectedReport(response.data);
        } catch (err) {
            console.error("Failed to fetch report details", err);
            setError(err.response?.data?.error || "Failed to load report details.");
        } finally {
            setLoadingReport(false);
        }
    };

    /**
     * Generates a text file of the lab report and triggers a download.
     */
    const handleDownloadReport = async (e, report) => {
        e.stopPropagation();
        setDownloadingId(report.report_id);

        try {
            let fullReport = report;

            // Ensure we have full details (in case we are downloading from list view)
            if (!report.result) {
                const response = await api.get(`/labs/reports/${report.report_id}`);
                fullReport = response.data;
            }

            // Construct the file content
            const lines = [];
            lines.push(`LAB REPORT`);
            lines.push(`==========================================`);
            lines.push(`Report ID: ${fullReport.report_id}`);
            lines.push(`Test Name: ${fullReport.test_name || fullReport.result?.testName || 'Unknown Test'}`);
            lines.push(`Date: ${new Date(fullReport.verified_at || fullReport.ordered_at).toLocaleString()}`);
            lines.push(`Patient: ${user.name} (ID: ${user.sub})`);
            lines.push(`==========================================`);
            lines.push(``);
            lines.push(`RESULTS:`);

            // Handle different result formats (string or object)
            if (typeof fullReport.result === 'string') {
                lines.push(fullReport.result);
            } else if (typeof fullReport.result === 'object') {
                Object.entries(fullReport.result || {}).forEach(([key, value]) => {
                    if (key === 'testName') return;
                    lines.push(`${key}: ${JSON.stringify(value)}`);
                });
            }

            // Verification Details
            if (fullReport.verified) {
                lines.push(``);
                lines.push(`[VERIFIED] This report has been digitally signed by the doctor.`);
                if (fullReport.diagnosis) {
                    lines.push(``);
                    lines.push(`DIAGNOSIS / DOCTOR'S COMMENTS:`);
                    lines.push(fullReport.diagnosis);
                }
            } else {
                lines.push(``);
                lines.push(`[PENDING VERIFICATION] results are preliminary.`);
            }

            // Trigger Download
            const testName = fullReport.test_name || fullReport.result?.testName || 'Unknown_Test';
            const fileContent = lines.join('\n');
            const blob = new Blob([fileContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lab_Report_${testName.replace(/\s+/g, '_')}_${fullReport.report_id}.txt`;
            document.body.appendChild(a);
            a.click(); // Programmatic click
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Failed to download report", err);
            alert("Failed to download report. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    /**
     * Handles GDPR Right to Erasure request
     */
    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            await api.delete('/patients/me/erasure');
            setIsDeleteModalOpen(false);
            alert("Your account has been successfully deleted in compliance with GDPR. You will now be logged out.");
            logout();
            navigate('/login');
        } catch (err) {
            console.error("Failed to delete account", err);
            alert(err.response?.data?.error || "Failed to process the erasure request. Please try again later.");
            setDeletingAccount(false);
        }
    };

    const closeReportModal = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
        setError(null);
    };

    const nextAppointment = appointments[0] || null;

    return (
        <div className="space-y-6">
            {/* Wellness Banner */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold">Welcome back, {user?.name}</h2>
                <p className="mt-2 opacity-90">
                    {nextAppointment
                        ? `You have ${appointments.length} upcoming appointment${appointments.length > 1 ? 's' : ''}.`
                        : "You have no upcoming appointments."}
                </p>
            </div>

            {/* Vitals Trends Summary */}
            <VitalsSummary patientId={user?.sub || user?.patient_id} />

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column - Upcoming Appointments */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-slate-900">Upcoming Appointments</h3>
                        <Calendar className="h-5 w-5 text-teal-500" />
                    </div>

                    {appointments.length > 0 ? (
                        <ul className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto w-full">
                            {appointments.map((appointment, index) => (
                                <li
                                    key={appointment.appointment_id || index}
                                    className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition duration-150 ease-in-out cursor-pointer"
                                    onClick={() => setViewingAppointment(appointment)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-teal-600 truncate">
                                                {appointment.doctor_name || 'Doctor'}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {appointment.specialization || 'General'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-slate-100 text-slate-800">
                                                {new Date(appointment.scheduled_start).toLocaleDateString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-slate-400 flex items-center justify-end mt-1">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(appointment.scheduled_start).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    {appointment.reason && (
                                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {appointment.reason}
                                        </div>
                                    )}

                                    {/* Pay Now Button (Only for scheduled appointments that are not paid/cancelled) */}
                                    {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && appointment.status !== 'PAID' && (
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePayNow(appointment);
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Pay Now
                                            </button>
                                        </div>
                                    )}

                                    {/* Paid Status & Slip View */}
                                    {appointment.status === 'PAID' && (
                                        <div className="mt-3 flex justify-between items-center px-1">
                                            <span className="text-xs font-semibold text-teal-700 flex items-center">
                                                <CheckCircle className="h-3 w-3 mr-1" /> Paid
                                            </span>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setViewingSlip(appointment);
                                                    }}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    View Slip
                                                </button>
                                                <Link
                                                    to={`/telemedicine/${appointment.appointment_id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    <MessageSquare className="h-3 w-3 mr-1.5" />
                                                    Join call
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </li>

                            ))}
                        </ul>
                    ) : (
                        <div className="text-slate-500 italic py-8 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            No upcoming appointments.
                        </div>
                    )}

                    <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 w-full text-center">
                        <Link
                            to="/book-appointment"
                            className="font-medium text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        >
                            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                            Book New Appointment
                        </Link>
                    </div>
                </div>

                {/* Right Column - Lab Reports & Quick Actions */}
                <div className="space-y-6">
                    {/* Lab Reports Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="bg-white px-4 py-5 sm:px-6 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-slate-900">Recent Lab Reports</h3>
                            <Beaker className="h-5 w-5 text-purple-600" />
                        </div>
                        {labReports.length > 0 ? (
                            <ul className="divide-y divide-slate-200 max-h-[250px] overflow-y-auto w-full">
                                {labReports.map((report) => (
                                    <li
                                        key={report.report_id}
                                        className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition duration-150 ease-in-out cursor-pointer"
                                        onClick={() => handleViewReport(report.report_id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-sm font-medium text-purple-600 truncate">{report.test_name}</div>
                                                <div className="text-sm text-slate-500 mt-1">
                                                    {new Date(report.verified_at || report.ordered_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {report.verified && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Verified
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => handleDownloadReport(e, report)}
                                                    disabled={downloadingId === report.report_id}
                                                    className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                                                    title="Download Report"
                                                >
                                                    {downloadingId === report.report_id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-slate-500 italic py-6 text-center">
                                <Beaker className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                No lab reports available.
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="bg-white px-4 py-5 sm:px-6 border-b border-slate-200">
                            <h3 className="text-lg leading-6 font-medium text-slate-900">Quick Actions</h3>
                        </div>
                        <ul className="divide-y divide-slate-200">
                            <li className="px-4 py-4 hover:bg-slate-50 transition duration-150 ease-in-out">
                                <Link
                                    to="/ai-bot"
                                    className="flex items-center justify-between w-full text-left text-sm text-purple-700"
                                >
                                    <div className="flex items-center font-medium">
                                        <Sparkles className="h-5 w-5 mr-3 text-purple-500" />
                                        Launch AI Care Advisor
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-purple-400" />
                                </Link>
                            </li>
                            <li className="px-4 py-4 hover:bg-slate-50 transition duration-150 ease-in-out">
                                <Link
                                    to={`/patient/${user?.sub}/care-plan`}
                                    className="flex items-center justify-between w-full text-left text-sm text-slate-600"
                                >
                                    <span className="font-medium">View my Care Plan</span>
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                </Link>
                            </li>
                            {/* GDPR Data Erasure */}
                            <li className="px-4 py-4 hover:bg-red-50 transition duration-150 ease-in-out">
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="flex items-center justify-between w-full text-left text-sm text-red-600"
                                >
                                    <div className="flex items-center font-medium">
                                        <Trash2 className="h-5 w-5 mr-3 text-red-500" />
                                        Request Data Erasure (Delete Account)
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-red-400" />
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Report Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeReportModal}
                title={loadingReport ? 'Loading Report...' : selectedReport?.result?.testName || 'Lab Report Details'}
            >
                {loadingReport ? (
                    <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : selectedReport ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 flex-grow mr-4">
                                <div><strong>Report ID:</strong> {selectedReport.report_id}</div>
                                <div><strong>Verified:</strong> {selectedReport.verified ? 'Yes' : 'No'}</div>
                            </div>
                            <button
                                onClick={(e) => handleDownloadReport(e, selectedReport)}
                                disabled={downloadingId === selectedReport.report_id}
                                className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                            >
                                {downloadingId === selectedReport.report_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Download
                            </button>
                        </div>

                        {/* Result Content Rendering */}
                        <div className="space-y-2">
                            {(() => {
                                const renderRow = (key, value) => (
                                    <div key={key} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                        <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="font-semibold text-slate-900 text-right">{value}</span>
                                    </div>
                                );

                                if (typeof selectedReport.result === 'string') {
                                    return selectedReport.result.split('\n').map((line, idx) => {
                                        const parts = line.split(':');
                                        if (parts.length >= 2) {
                                            const label = parts[0].trim();
                                            const val = parts.slice(1).join(':').trim();
                                            return renderRow(label + `_${idx}`, val);
                                        }
                                        return (
                                            <div key={idx} className="py-1 border-b border-slate-100 last:border-0 text-slate-700">
                                                {line}
                                            </div>
                                        );
                                    });
                                } else {
                                    return Object.entries(selectedReport.result || {}).map(([key, value]) => {
                                        if (key === 'testName' || key === 'comments') return null;
                                        return renderRow(key, typeof value === 'object' ? JSON.stringify(value) : value);
                                    });
                                }
                            })()}
                        </div>

                        {selectedReport.result?.comments && (
                            <div>
                                <h4 className="font-medium text-slate-900 border-b pb-1 mb-2">Lab Tech Comments</h4>
                                <p className="text-sm text-slate-600">{selectedReport.result.comments}</p>
                            </div>
                        )}

                        {selectedReport.diagnosis && (
                            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                                <h4 className="font-medium text-blue-900 border-b border-blue-200 pb-1 mb-2">Doctor's Diagnosis / Comments</h4>
                                <p className="text-sm text-blue-800">{selectedReport.diagnosis}</p>
                            </div>
                        )}

                        {selectedReport.verified && (
                            <div className="mt-4 flex items-center p-3 bg-green-50 text-green-700 rounded-md text-sm">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                <div>
                                    <span className="font-medium">Digitally Signed & Verified</span>
                                    <div className="text-xs opacity-75 mt-0.5">
                                        This report is cryptographically verified by your doctor.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : error ? (
                    <div className="text-center py-6 text-red-500">
                        {error}
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-500">
                        Failed to load report details.
                    </div>
                )}
            </Modal>

            {/* Appointment Detail Modal */}
            <Modal
                isOpen={!!viewingAppointment}
                onClose={() => setViewingAppointment(null)}
                title="Appointment Details"
            >
                {/* Modal logic same as before... */}
                {viewingAppointment && (
                    <div className="space-y-4">
                        <div className="bg-teal-50 p-4 rounded-md border border-teal-100">
                            <h4 className="font-semibold text-teal-900 text-lg">{viewingAppointment.doctor_name || 'Unknown Doctor'}</h4>
                            <div className="text-teal-700">{viewingAppointment.specialization || 'General Practice'}</div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</label>
                                <div className="text-slate-900 font-medium flex items-center mt-1">
                                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                    {new Date(viewingAppointment.scheduled_start).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 pl-6">
                                    Duration: {(new Date(viewingAppointment.scheduled_end) - new Date(viewingAppointment.scheduled_start)) / 60000} mins
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason for Visit</label>
                                <div className="text-slate-900 bg-slate-50 p-3 rounded mt-1 border border-slate-100">
                                    {viewingAppointment.reason || "No reason specified."}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                                <div className="mt-1 flex justify-between items-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                        {viewingAppointment.status || 'SCHEDULED'}
                                    </span>

                                    <Link
                                        to={`/telemedicine/${viewingAppointment.appointment_id}`}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-1.5" />
                                        Join Telemedicine Consult
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payment Slip Modal */}
            <Modal
                isOpen={!!viewingSlip}
                onClose={() => setViewingSlip(null)}
                title="Payment Slip"
            >
                {viewingSlip && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 text-center relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-200 rounded-full opacity-20"></div>
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-emerald-200 rounded-full opacity-20"></div>

                            <div className="relative z-10 mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4 shadow-sm border border-emerald-200">
                                <CheckCircle className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h4 className="relative z-10 font-bold text-emerald-900 text-2xl tracking-tight">Payment Successful</h4>
                            <p className="relative z-10 text-emerald-700 text-sm mt-1 font-medium">Thank you for your payment.</p>
                        </div>

                        <div className="border-t border-b border-slate-100 py-5 space-y-4 px-2">
                            <div className="flex justify-between items-start text-sm">
                                <span className="text-slate-500 font-medium">Service</span>
                                <span className="font-semibold text-slate-800 text-right">Consultation with<br />{viewingSlip.doctor_name || 'Doctor'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Date</span>
                                <span className="font-semibold text-slate-800">
                                    {new Date(viewingSlip.scheduled_start).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Status</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-widest shadow-sm">
                                    Paid
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Reference Code</span>
                                <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded shadow-inner tracking-wider">
                                    {viewingSlip.appointment_id?.split('-')[0].toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-xl flex justify-between items-center border border-slate-200 shadow-inner">
                            <span className="font-semibold text-slate-500 uppercase tracking-widest text-xs">Total Amount</span>
                            <span className="font-black text-emerald-700 text-3xl tracking-tight leading-none text-shadow-sm">
                                ₹{viewingSlip.consultation_fee || '300.00'}
                            </span>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Account Confirmation Modal (GDPR) */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !deletingAccount && setIsDeleteModalOpen(false)}
                title="Request Data Erasure"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800 flex items-start">
                        <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-red-900 mb-1">Warning: Irreversible Action</h4>
                            <p className="text-sm">
                                You are about to invoke your Right to Erasure under GDPR. This will:
                            </p>
                            <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-1 text-red-700">
                                <li>Permanently delete your login account.</li>
                                <li>Anonymize all Personally Identifiable Information (PII) including your name and demographic data.</li>
                                <li>Medical records (like lab results and appointments) will be anonymized but retained for legal/medical compliance.</li>
                            </ul>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">
                        Once completed, you will immediately lose access to your account and historical data cannot be restored. Are you absolutely sure you want to proceed?
                    </p>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deletingAccount}
                            className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        >
                            {deletingAccount ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Erasing Data...
                                </>
                            ) : (
                                "Yes, Delete My Data"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

        </div >
    );
};

export default PatientDashboard;
