import { useState, useEffect } from 'react';
import { Calendar, FileText, ArrowRight, Beaker, CheckCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Modal from '../../components/Modal';

const PatientDashboard = () => {
    const { user } = useAuth();
    const [nextAppointment, setNextAppointment] = useState(null);
    const [labReports, setLabReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState(null);

    // Appointment Modal State
    const [viewingAppointment, setViewingAppointment] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Appointments
                const apptRes = await api.get('/appointments/my-appointments');
                if (apptRes.data && apptRes.data.length > 0) {
                    // Filter for future appointments or just take the first one (sorted by start time)
                    const future = apptRes.data.filter(a => new Date(a.scheduled_start) > new Date());
                    if (future.length > 0) {
                        setNextAppointment(future[0]);
                    }
                }

                // Fetch Lab Reports
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

    const handleViewReport = async (reportId) => {
        setLoadingReport(true);
        setIsModalOpen(true);
        setSelectedReport(null); // Clear previous
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

    const closeReportModal = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
        setError(null);
    };

    return (
        <div className="space-y-6">
            {/* Wellness Banner */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold">Welcome back, {user?.name}</h2>
                <p className="mt-2 opacity-90">
                    {nextAppointment
                        ? `You have an upcoming appointment on ${new Date(nextAppointment.scheduled_start).toLocaleDateString()}.`
                        : "You have no upcoming appointments."}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upcoming Appointment */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800">Next Appointment</h3>
                        <Calendar className="h-5 w-5 text-teal-500" />
                    </div>
                    {nextAppointment ? (
                        <>
                            <div className="p-3 bg-teal-50 rounded-md border border-teal-100 mb-3">
                                <div className="font-medium text-teal-900">{nextAppointment.doctor_name || 'Doctor'}</div>
                                <div className="text-sm text-teal-700">{nextAppointment.specialization || 'General'}</div>
                                <div className="text-xs text-teal-500 mt-1">
                                    {new Date(nextAppointment.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingAppointment(nextAppointment)}
                                className="w-full text-center text-sm text-teal-600 font-medium hover:text-teal-800"
                            >
                                View Details
                            </button>
                        </>
                    ) : (
                        <div className="text-slate-500 italic py-4">
                            No upcoming appointments.
                        </div>
                    )}
                </div>

                {/* Lab Reports */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800">Recent Lab Reports</h3>
                        <Beaker className="h-5 w-5 text-purple-500" />
                    </div>
                    {labReports.length > 0 ? (
                        <div className="space-y-3">
                            {labReports.slice(0, 3).map((report) => (
                                <div
                                    key={report.report_id}
                                    className="p-3 bg-purple-50 rounded-md border border-purple-100 cursor-pointer hover:bg-purple-100 transition"
                                    onClick={() => handleViewReport(report.report_id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-purple-900">{report.test_name}</div>
                                            <div className="text-xs text-purple-700 mt-1">
                                                {new Date(report.verified_at || report.ordered_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {report.verified && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {labReports.length > 3 && (
                                <button className="w-full text-center text-sm text-purple-600 font-medium hover:text-purple-800 mt-2">
                                    View All Reports
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-500 italic py-4">
                            No lab reports available.
                        </div>
                    )}
                </div>


                {/* Actions */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link to="/book-appointment" className="flex items-center justify-between w-full p-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-md transition border border-teal-100 bg-teal-50/50">
                                <span className="font-semibold text-teal-700">Book New Appointment</span>
                                <Calendar className="h-4 w-4 text-teal-600" />
                            </Link>
                            <Link to={`/patient/${user?.sub}/care-plan`} className="flex items-center justify-between w-full p-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-md transition">
                                <span>View my Care Plan</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <button className="flex items-center justify-between w-full p-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-md transition">
                                <span>Request Prescription Refill</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
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
                        {/* Header Info */}
                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-600">
                            <div><strong>Report ID:</strong> {selectedReport.report_id}</div>
                            <div><strong>Verified:</strong> {selectedReport.verified ? 'Yes' : 'No'}</div>
                        </div>

                        <div className="space-y-2">
                            {(() => {
                                // Helper to render a single row
                                const renderRow = (key, value) => (
                                    <div key={key} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                        <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="font-semibold text-slate-900 text-right">{value}</span>
                                    </div>
                                );

                                if (typeof selectedReport.result === 'string') {
                                    // Parse string: "Label: Value" per line
                                    return selectedReport.result.split('\n').map((line, idx) => {
                                        const parts = line.split(':');
                                        if (parts.length >= 2) {
                                            const label = parts[0].trim();
                                            const val = parts.slice(1).join(':').trim();
                                            return renderRow(label + `_${idx}`, val);
                                        }
                                        // As fallback for lines without colons, render as full width text
                                        return (
                                            <div key={idx} className="py-1 border-b border-slate-100 last:border-0 text-slate-700">
                                                {line}
                                            </div>
                                        );
                                    });
                                } else {
                                    // Object handling
                                    return Object.entries(selectedReport.result || {}).map(([key, value]) => {
                                        if (key === 'testName' || key === 'comments') return null;
                                        return renderRow(key, typeof value === 'object' ? JSON.stringify(value) : value);
                                    });
                                }
                            })()}
                        </div>

                        {/* Comments */}
                        {selectedReport.result?.comments && (
                            <div>
                                <h4 className="font-medium text-slate-900 border-b pb-1 mb-2">Comments</h4>
                                <p className="text-sm text-slate-600">{selectedReport.result.comments}</p>
                            </div>
                        )}

                        {/* Verification Badge */}
                        {selectedReport.verified && (
                            <div className="mt-4 flex items-center p-3 bg-green-50 text-green-700 rounded-md text-sm">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                <div>
                                    <span className="font-medium">Digitally Signed & Verified</span>
                                    <div className="text-xs opacity-75 mt-0.5">
                                        This report is cryptographically verifying by your doctor.
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
                                <div className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                        {viewingAppointment.status || 'SCHEDULED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default PatientDashboard;
