import { useState, useEffect, useCallback } from 'react';
import {
    Heart,
    Thermometer,
    Droplet,
    Activity,
    TrendingUp,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { fetchPatientVitals } from '../api/vitalsApi';

const VitalsSummary = ({ patientId }) => {
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadVitals = useCallback(async () => {
        if (!patientId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await fetchPatientVitals(patientId);
            setVitals(response.data?.data?.vitals || []);
        } catch (err) {
            console.error('Failed to fetch vitals', err);
            setError('Could not load health trends.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        loadVitals();
    }, [loadVitals]);

    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        // If the date string doesn't end with Z or have a timezone offset (+/-), 
        // append Z to treat it as UTC.
        const hasTZ = dateStr.endsWith('Z') || dateStr.includes('+') || (dateStr.split('-').length > 3);
        const normalized = hasTZ ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
        return new Date(normalized);
    };

    const chartData = [...vitals]
        .reverse()
        .map((v) => {
            const date = parseDate(v.created_at);
            return {
                time: date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                heart_rate: v.heart_rate,
                systolic: v.blood_pressure ? parseInt(v.blood_pressure.split('/')[0], 10) : null,
                diastolic: v.blood_pressure ? parseInt(v.blood_pressure.split('/')[1], 10) : null,
                temperature: v.temperature ? parseFloat(v.temperature) : null,
                spo2: v.spo2,
            };
        });

    const latest = vitals[0] || null;
    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-100">
                <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
            </div>
        );
    }

    if (!patientId) {
        return (
            <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                Please re-login to synchronize your health data.
            </div>
        );
    }

    if (!loading && vitals.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-teal-50 rounded-full">
                    <Activity className="h-8 w-8 text-teal-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">No health data yet</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        Your health trends will appear here once your vitals are recorded during your visits.
                    </p>
                </div>
            </div>
        );
    }

    const MetricCard = ({ icon: Icon, label, value, unit, colorClass }) => (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                <Icon className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold text-slate-900">
                    {value || '--'} <span className="text-sm font-normal text-slate-400">{unit}</span>
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-500" />
                    My Health Trends
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                    Last updated: {parseDate(latest.created_at).toLocaleString()}
                </span>
            </div>

            {/* Metric Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Heart}
                    label="Heart Rate"
                    value={latest.heart_rate}
                    unit="bpm"
                    colorClass="bg-rose-500"
                />
                <MetricCard
                    icon={Activity}
                    label="Blood Pressure"
                    value={latest.blood_pressure}
                    unit=""
                    colorClass="bg-violet-500"
                />
                <MetricCard
                    icon={Thermometer}
                    label="Temp"
                    value={latest.temperature}
                    unit="°C"
                    colorClass="bg-amber-500"
                />
                <MetricCard
                    icon={Droplet}
                    label="SpO2"
                    value={latest.spo2}
                    unit="%"
                    colorClass="bg-sky-500"
                />
            </div>

            {/* Main Chart Container */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Pulse & BP History</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="HR" />
                            <Line type="monotone" dataKey="systolic" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Sys BP" />
                            <Line type="monotone" dataKey="diastolic" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" name="Dia BP" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Temp & SpO2 Trends</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[34, 42]} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[80, 100]} />
                            <Tooltip />
                            <Legend iconType="circle" />
                            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={3} name="Temp (°C)" />
                            <Line yAxisId="right" type="monotone" dataKey="spo2" stroke="#0ea5e9" strokeWidth={3} name="SpO2 (%)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default VitalsSummary;
