/**
 * Nurse Dashboard Component
 * 
 * Interface for Nurses to monitor patient status and daily tasks.
 * Currently serves as a visual prototype/mockup demonstrating potential features:
 * - Patient Assignments
 * - Critical Alerts
 * - Shift Management
 * - Rounds Checklist
 */

import { ClipboardList, Activity, Clock, UserCheck } from 'lucide-react';

const NurseDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Nurse Dashboard
                    </h2>
                </div>
            </div>
            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Assigned Patients Count */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                            <ClipboardList className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Assigned Patients</dt>
                                <dd className="text-lg font-medium text-slate-900">12</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Critical Alerts Count */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                            <Activity className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Critical Alerts</dt>
                                <dd className="text-lg font-medium text-slate-900">2</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Rounds Progress */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Rounds Complete</dt>
                                <dd className="text-lg font-medium text-slate-900">85%</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Shift Time Remaining */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Shift Remaining</dt>
                                <dd className="text-lg font-medium text-slate-900">3h 20m</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Tasks List (Mock Data) */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Upcoming Rounds / Meds</h3>
                </div>
                <ul className="divide-y divide-slate-200">
                    {[1, 2, 3].map(i => (
                        <li key={i} className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition duration-150 ease-in-out cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Room 30{i} - Bed 1</p>
                                    <p className="text-sm text-slate-500">Medication: Insulin 10 units</p>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Due in {i * 15} mins
                                    </span>
                                    <button className="ml-4 text-primary-600 hover:text-primary-900 text-sm font-medium">Log Vitals</button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default NurseDashboard;
