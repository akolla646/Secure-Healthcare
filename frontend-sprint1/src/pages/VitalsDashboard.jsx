import { useState, useCallback } from 'react';
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
    heart_rate: { low: 60, high: 100, unit: 'bpm', label: 'Heart Rate' },
    spo2: { low: 95, high: 101, unit: '%', label: 'SpO2' },
    temperature: { low: 36.1, high: 37.5, unit: '°C', label: 'Temperature' },
};

/**
 * Determine traffic-light status for a metric
 * @returns {'green' | 'amber' | 'red'}
 */
function getStatus(metric, value) {
    if (value == null) return 'gray';
    const t = THRESHOLDS[metric];
    if (!t) return 'gray';
    if (value < t.low || value > t.high) return 'red';
    if (value <= t.low + 3 || value >= t.high - 2) return 'amber';
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
    const [patientId, setPatientId] = useState('');
    const [searchId, setSearchId] = useState('');
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        loadVitals(searchId);
    };

    const handleFormSuccess = () => {
        // Re-fetch vitals after a new record is submitted
        if (patientId) {
            loadVitals(patientId);
        }
    };

    // Prepare chart data (reversed to chronological order for line chart)
    const chartData = [...vitals]
        .reverse()
        .map((v) => {
            const date = new Date(v.created_at);
            return {
                time: date.toLocaleDateString('en-US', {
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
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
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
            <form onSubmit={handleSearch} className="flex gap-3 items-center">
                <div className="relative flex-grow max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Enter Patient UUID to load vitals..."
                        className="w-full pl-12 pr-4 py-3 text-sm border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !searchId}
                    className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md disabled:opacity-50 transition-all"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Load Vitals'
                    )}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Two-Column Layout: Dashboard + Form */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Charts and Cards (2/3 width) */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Metric Cards */}
                    {latest && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                metric="heart_rate"
                                value={latest.heart_rate}
                                unit="bpm"
                            />
                            <BPCard value={latest.blood_pressure} />
                            <MetricCard
                                metric="temperature"
                                value={latest.temperature ? parseFloat(latest.temperature) : null}
                                unit="°C"
                            />
                            <MetricCard
                                metric="spo2"
                                value={latest.spo2}
                                unit="%"
                            />
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
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="time"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="heart_rate"
                                        stroke="#f43f5e"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#f43f5e' }}
                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                        name="Heart Rate (bpm)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="systolic"
                                        stroke="#8b5cf6"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#8b5cf6' }}
                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                        name="Systolic BP"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="diastolic"
                                        stroke="#a78bfa"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ r: 3, fill: '#a78bfa' }}
                                        name="Diastolic BP"
                                    />
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
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="time"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                        domain={[34, 42]}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                        domain={[80, 100]}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="temperature"
                                        stroke="#f59e0b"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#f59e0b' }}
                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                        name="Temperature (°C)"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="spo2"
                                        stroke="#0ea5e9"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#0ea5e9' }}
                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                        name="SpO2 (%)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && vitals.length === 0 && patientId && (
                        <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm font-medium">
                                No vitals found for this patient.
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                Use the form to record the first set of vitals.
                            </p>
                        </div>
                    )}

                    {!loading && !patientId && (
                        <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm font-medium">
                                Enter a Patient UUID above to view vitals dashboard.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Vital Intake Form (1/3 width) */}
                <div className="xl:col-span-1">
                    <div className="sticky top-6">
                        <VitalIntakeForm
                            patientId={patientId}
                            onSuccess={handleFormSuccess}
                        />

                        {/* Vitals History Table */}
                        {vitals.length > 0 && (
                            <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-700">
                                        Recent Records ({vitals.length})
                                    </h4>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-slate-500 font-medium">Date</th>
                                                <th className="px-3 py-2 text-center text-slate-500 font-medium">HR</th>
                                                <th className="px-3 py-2 text-center text-slate-500 font-medium">BP</th>
                                                <th className="px-3 py-2 text-center text-slate-500 font-medium">Temp</th>
                                                <th className="px-3 py-2 text-center text-slate-500 font-medium">SpO2</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vitals.slice(0, 20).map((v) => (
                                                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                                        {new Date(v.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className={`px-3 py-2.5 text-center font-semibold ${v.heart_rate > 100 ? 'text-red-600' : 'text-slate-700'
                                                        }`}>
                                                        {v.heart_rate || '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center text-slate-700 font-semibold">
                                                        {v.blood_pressure || '—'}
                                                    </td>
                                                    <td className={`px-3 py-2.5 text-center font-semibold ${v.temperature && parseFloat(v.temperature) > 37.5 ? 'text-red-600' : 'text-slate-700'
                                                        }`}>
                                                        {v.temperature ? parseFloat(v.temperature).toFixed(1) : '—'}
                                                    </td>
                                                    <td className={`px-3 py-2.5 text-center font-semibold ${v.spo2 && v.spo2 < 95 ? 'text-red-600' : 'text-slate-700'
                                                        }`}>
                                                        {v.spo2 || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VitalsDashboard;
