import { useState, useCallback, useEffect } from 'react';
import { fetchPatientVitals } from '../api/vitalsApi';
import VitalIntakeForm from '../components/VitalIntakeForm';
import {
    Heart,
    Thermometer,
    Droplet,
    Activity,
    Search,
    Loader2,
    AlertTriangle,
    TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

// =============================================================================
// TRAFFIC-LIGHT THRESHOLDS
// =============================================================================

const THRESHOLDS = {
    heart_rate: { low: 60, high: 100, amberLow: 55, amberHigh: 110, unit: 'bpm', label: 'Heart Rate' },
    spo2: { low: 95, high: 101, amberLow: 92, amberHigh: 102, unit: '%', label: 'SpO2' },
    temperature: { low: 36.1, high: 37.5, amberLow: 35.5, amberHigh: 38.0, unit: '°C', label: 'Temperature' },
};

/**
 * Determine traffic-light status for a metric
 * Red = outside amber range, Amber = between amber and normal, Green = within normal
 * @returns {'green' | 'amber' | 'red'}
 */
function getStatus(metric, value) {
    if (value == null) return 'gray';
    const t = THRESHOLDS[metric];
    if (!t) return 'gray';
    if (value < t.amberLow || value > t.amberHigh) return 'red';
    if (value < t.low || value > t.high) return 'amber';
    return 'green';
}

const STATUS_STYLES = {
    green: {
        bg: 'bg-emerald-50 border-emerald-300',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800',
        dot: 'bg-emerald-500',
        label: 'Normal',
    },
    amber: {
        bg: 'bg-amber-50 border-amber-300',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        dot: 'bg-amber-500',
        label: 'Caution',
    },
    red: {
        bg: 'bg-red-50 border-red-300',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800',
        dot: 'bg-red-500',
        label: 'Critical',
    },
    gray: {
        bg: 'bg-slate-50 border-slate-200',
        text: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-600',
        dot: 'bg-slate-400',
        label: 'N/A',
    },
};

const METRIC_ICONS = {
    heart_rate: <Heart className="h-6 w-6 text-rose-500" />,
    spo2: <Droplet className="h-6 w-6 text-sky-500" />,
    temperature: <Thermometer className="h-6 w-6 text-amber-500" />,
    blood_pressure: <Activity className="h-6 w-6 text-violet-500" />,
};

// =============================================================================
// METRIC CARD COMPONENT
// =============================================================================

function MetricCard({ metric, value, unit }) {
    const status = getStatus(metric, value);
    const styles = STATUS_STYLES[status];

    return (
        <div
            className={`relative p-5 rounded-2xl border-2 ${styles.bg} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/80 shadow-sm">
                    {METRIC_ICONS[metric]}
                </div>
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles.badge}`}
                >
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${styles.dot}`}></span>
                    {styles.label}
                </span>
            </div>
            <p className={`text-3xl font-extrabold ${styles.text} tracking-tight`}>
                {value != null ? value : '—'}
                <span className="text-sm font-normal ml-1 opacity-70">{unit}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
                {THRESHOLDS[metric]?.label || metric}
            </p>
        </div>
    );
}

// =============================================================================
// BLOOD PRESSURE CARD (Special - text field)
// =============================================================================

function BPCard({ value }) {
    let status = 'gray';
    if (value) {
        const parts = value.split('/');
        if (parts.length === 2) {
            const systolic = parseInt(parts[0], 10);
            if (systolic > 140 || systolic < 90) status = 'red';
            else if (systolic > 130 || systolic < 95) status = 'amber';
            else status = 'green';
        }
    }
    const styles = STATUS_STYLES[status];

    return (
        <div
            className={`relative p-5 rounded-2xl border-2 ${styles.bg} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/80 shadow-sm">
                    {METRIC_ICONS.blood_pressure}
                </div>
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles.badge}`}
                >
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${styles.dot}`}></span>
                    {styles.label}
                </span>
            </div>
            <p className={`text-3xl font-extrabold ${styles.text} tracking-tight`}>
                {value || '—'}
                <span className="text-sm font-normal ml-1 opacity-70">mmHg</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Blood Pressure</p>
        </div>
    );
}

// =============================================================================
// CUSTOM TOOLTIP FOR CHARTS
// =============================================================================

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200 p-4 max-w-xs">
            <p className="text-xs text-slate-500 font-medium mb-2">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

const VitalsDashboard = () => {
    const { user } = useAuth();
    const isPatient = user?.role?.toUpperCase() === 'PATIENT';
    const [patientId, setPatientId] = useState('');
    const [searchText, setSearchText] = useState(''); // The displayed text (name)
    const [searchId, setSearchId] = useState('');     // The resolved UUID for API calls
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [patientOptions, setPatientOptions] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Fetch patients list for doctors/nurses
    useEffect(() => {
        const fetchPatientsList = async () => {
            if (['DOCTOR', 'ADMIN', 'NURSE'].includes(user?.role?.toUpperCase())) {
                try {
                    const response = await api.get('/patients');
                    const data = Array.isArray(response.data) ? response.data : [];
                    setPatientOptions(data);
                } catch (err) {
                    console.error('Failed to fetch patients list', err);
                }
            } else if (user?.role?.toUpperCase() === 'PATIENT') {
                // If patient, load their own vitals automatically
                const pid = user.sub || user.patient_id || '';
                setSearchId(pid);
                loadVitals(pid);
            }
        };
        fetchPatientsList();
    }, [user]);

    const loadVitals = useCallback(async (id) => {
        const targetId = id || searchId;
        if (!targetId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetchPatientVitals(targetId);
            setVitals(response.data?.data?.vitals || []);
            setPatientId(targetId);
        } catch (err) {
            console.error('Failed to fetch vitals', err);
            setError(err.response?.data?.error || 'Failed to load vitals.');
            setVitals([]);
        } finally {
            setLoading(false);
        }
    }, [searchId]);

    const handleSearch = (e) => {
        e.preventDefault();
        const idToLoad = searchId || searchText;
        if (idToLoad) loadVitals(idToLoad);
    };

    const getPatientName = (p) => p.full_name_encrypted || p.full_name || 'Unknown';

    const getFilteredPatients = () => {
        if (!searchText) return patientOptions;
        return patientOptions.filter(p =>
            getPatientName(p).toLowerCase().includes(searchText.toLowerCase()) ||
            p.patient_id.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    const handleFormSuccess = () => {
        // Re-fetch vitals after a new record is submitted
        if (patientId) {
            loadVitals(patientId);
        }
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        // If the date string doesn't end with Z or have a timezone offset (+/-), 
        // append Z to treat it as UTC.
        const hasTZ = dateStr.endsWith('Z') || dateStr.includes('+') || (dateStr.split('-').length > 3);
        const normalized = hasTZ ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
        return new Date(normalized);
    };

    // Prepare chart data (reversed to chronological order for line chart)
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
                systolic: v.blood_pressure
                    ? parseInt(v.blood_pressure.split('/')[0], 10)
                    : null,
                diastolic: v.blood_pressure
                    ? parseInt(v.blood_pressure.split('/')[1], 10)
                    : null,
                temperature: v.temperature ? parseFloat(v.temperature) : null,
                spo2: v.spo2,
            };
        });

    // Get the latest vitals for metric cards
    const latest = vitals.length > 0 ? vitals[0] : null;

    return (
        <div className="min-h-screen py-2 space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-teal-500 rounded-xl shadow-lg">
                            <TrendingUp className="h-7 w-7 text-white" />
                        </div>
                        Vitals Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Monitor patient health trends in real-time
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            {!isPatient && (
                <form onSubmit={handleSearch} className="flex gap-3 items-center">
                    <div className="relative flex-grow max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setSearchId(''); // clear resolved ID when user types
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 300)}
                            placeholder="Search by patient name..."
                            className="w-full pl-12 pr-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow bg-white"
                        />

                        {/* Autocomplete Dropdown */}
                        {isDropdownOpen && patientOptions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getFilteredPatients().length > 0 ? (
                                    getFilteredPatients().map(p => (
                                        <div
                                            key={p.patient_id}
                                            className="px-4 py-3 hover:bg-teal-50 hover:border-l-2 hover:border-teal-500 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // prevent onBlur from closing dropdown before click fires
                                                setSearchText(getPatientName(p));
                                                setSearchId(p.patient_id);
                                                setIsDropdownOpen(false);
                                                loadVitals(p.patient_id);
                                            }}
                                        >
                                            <div className="font-semibold text-slate-900">{getPatientName(p)}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">{p.patient_id}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No matching patients found.</div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading || (!searchId && !searchText)}
                        className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md disabled:opacity-50 transition-all"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Load Vitals'
                        )}
                    </button>
                </form>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Dashboard Content based on Role */}
            {isPatient ? (
                /* PATIENT VIEW: Charts and Metrics only */
                <div className="space-y-8">
                    {/* Metric Cards */}
                    {latest && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard metric="heart_rate" value={latest.heart_rate} unit="bpm" />
                            <BPCard value={latest.blood_pressure} />
                            <MetricCard metric="temperature" value={latest.temperature ? parseFloat(latest.temperature) : null} unit="°C" />
                            <MetricCard metric="spo2" value={latest.spo2} unit="%" />
                        </div>
                    )}

                    {/* Heart Rate & Blood Pressure Line Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Heart className="h-5 w-5 text-rose-500" />
                                Heart Rate & Blood Pressure Trends
                            </h3>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                    <Line type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6, strokeWidth: 2 }} name="Heart Rate (bpm)" />
                                    <Line type="monotone" dataKey="systolic" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6, strokeWidth: 2 }} name="Systolic BP" />
                                    <Line type="monotone" dataKey="diastolic" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#a78bfa' }} name="Diastolic BP" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Temperature & SpO2 Line Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Thermometer className="h-5 w-5 text-amber-500" />
                                Temperature & SpO2 Trends
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} domain={[34, 42]} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} domain={[80, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6, strokeWidth: 2 }} name="Temperature (°C)" />
                                    <Line yAxisId="right" type="monotone" dataKey="spo2" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 6, strokeWidth: 2 }} name="SpO2 (%)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {!loading && vitals.length === 0 && (
                        <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm font-medium">No vitals history found.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* DOCTOR / NURSE VIEW: Intake Form and Table only */
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1">
                        <div className="sticky top-6">
                            <VitalIntakeForm patientId={patientId} onSuccess={handleFormSuccess} />
                        </div>
                    </div>

                    <div className="xl:col-span-2">
                        {vitals.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-700">Recent Records ({vitals.length})</h4>
                                </div>
                                <div className="max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-slate-500 font-medium">Date & Time</th>
                                                <th className="px-6 py-3 text-center text-slate-500 font-medium">Heart Rate</th>
                                                <th className="px-6 py-3 text-center text-slate-500 font-medium">Blood Pressure</th>
                                                <th className="px-6 py-3 text-center text-slate-500 font-medium">Temp (°C)</th>
                                                <th className="px-6 py-3 text-center text-slate-500 font-medium">SpO2 (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vitals.map((v) => (
                                                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                        {parseDate(v.created_at).toLocaleString('en-US', {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className={`px-6 py-4 text-center font-semibold ${v.heart_rate > 100 ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {v.heart_rate || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-slate-700 font-semibold">
                                                        {v.blood_pressure || '—'}
                                                    </td>
                                                    <td className={`px-6 py-4 text-center font-semibold ${v.temperature && parseFloat(v.temperature) > 37.5 ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {v.temperature ? parseFloat(v.temperature).toFixed(1) : '—'}
                                                    </td>
                                                    <td className={`px-6 py-4 text-center font-semibold ${v.spo2 && v.spo2 < 95 ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {v.spo2 || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!loading && !patientId && (
                            <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm font-medium">Search for a patient to start recording vitals.</p>
                            </div>
                        )}

                        {!loading && vitals.length === 0 && patientId && (
                            <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm font-medium">No vitals found for this patient.</p>
                                <p className="text-slate-400 text-xs mt-1">Use the form to record the first set of vitals.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VitalsDashboard;
