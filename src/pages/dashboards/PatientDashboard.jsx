import { Activity, Calendar, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PatientDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Wellness Banner */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold">Welcome back, {user?.name}</h2>
                <p className="mt-2 opacity-90">Your health records are up to date. You have 1 upcoming appointment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vitals Summary */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800">Latest Vitals</h3>
                        <Activity className="h-5 w-5 text-teal-500" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm text-slate-500">Blood Pressure</div>
                            <div className="text-xl font-bold text-slate-900">120/80 <span className="text-sm font-normal text-green-600">Normal</span></div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">Heart Rate</div>
                            <div className="text-xl font-bold text-slate-900">72 <span className="text-xs text-slate-400">bpm</span></div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Appointment */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800">Next Appointment</h3>
                        <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-100 mb-3">
                        <div className="font-medium text-blue-900">Dr. Sarah Connor</div>
                        <div className="text-sm text-blue-700">General Checkup</div>
                        <div className="text-xs text-blue-500 mt-1">Tomorrow, 10:00 AM</div>
                    </div>
                    <button className="w-full text-center text-sm text-teal-600 font-medium hover:text-teal-800">
                        View Calendar
                    </button>
                </div>

                {/* Actions */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
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

            {/* Consent Banner (Mock) */}
            <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between text-slate-300 text-sm">
                <div>
                    <span className="font-semibold text-white">Data Consent:</span> You have granted access to Dr. Sarah Connor.
                </div>
                <button className="text-white underline hover:text-teal-300">Manage Settings</button>
            </div>
        </div>
    );
};

export default PatientDashboard;
