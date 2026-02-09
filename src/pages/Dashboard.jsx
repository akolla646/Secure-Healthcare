import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { User, Activity, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from './dashboards/AdminDashboard';
import PatientDashboard from './dashboards/PatientDashboard';
import NurseDashboard from './dashboards/NurseDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // ROLE SWITCHER
    if (user?.role === 'Admin') return <AdminDashboard />;
    if (user?.role === 'Patient') return <PatientDashboard />;
    if (user?.role === 'Nurse') return <NurseDashboard />;

    useEffect(() => {
        if (user?.role === 'Doctor') {
            fetchPatients();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchPatients = async () => {
        try {
            // Trying to fetch from API
            // const response = await api.get('/patients');
            // setPatients(response.data);

            // MOCK DATA for Demo purposes if API fails (or while backend is being built)
            // In a real scenario, we'd handle the error strictly.
            setPatients([
                { id: '1', name: 'John Doe', age: 45, lastVisit: '2023-10-15', status: 'Pending Review' },
                { id: '2', name: 'Jane Smith', age: 32, lastVisit: '2023-11-02', status: 'Stable' },
                { id: '3', name: 'Robert Brown', age: 60, lastVisit: '2023-09-20', status: 'Critical' },
                { id: '4', name: 'Emily Davis', age: 28, lastVisit: '2023-11-10', status: 'Checkup' },
            ]);
        } catch (err) {
            console.error("Failed to fetch patients", err);
            setError("Could not load patient list.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Doctor Dashboard
                    </h2>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="bg-white px-4 py-5 border-b border-slate-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Patient List</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading patients...</div>
                ) : error ? (
                    <div className="p-6 text-center text-red-500">{error}</div>
                ) : (
                    <ul className="divide-y divide-slate-200">
                        {patients.map((patient) => (
                            <li key={patient.id}>
                                <button
                                    onClick={() => navigate(`/patient/${patient.id}/diagnosis`)}
                                    className="w-full block hover:bg-slate-50 focus:outline-none transition duration-150 ease-in-out"
                                >
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                                                        <span className="font-medium leading-none text-primary-700">{patient.name.charAt(0)}</span>
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-primary-600 truncate">{patient.name}</div>
                                                    <div className="flex items-center text-sm text-slate-500">
                                                        <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                        <span className="truncate">Age: {patient.age}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                                    patient.status === 'Stable' ? 'bg-green-100 text-green-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {patient.status}
                                                </div>
                                                <ChevronRight className="ml-5 h-5 w-5 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
