import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { submitVitals } from '../api/vitalsApi';
import {
    Heart,
    Thermometer,
    Droplet,
    Activity,
    Save,
    CheckCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';

/**
 * VitalIntakeForm Component
 * 
 * A form for entering and submitting patient vital signs.
 * Validates data types and hits the POST /api/vitals endpoint.
 * On successful submission, calls onSuccess to refresh parent dashboard.
 * 
 * @param {Object} props
 * @param {string} props.patientId - Pre-filled patient UUID
 * @param {Function} props.onSuccess - Callback after successful submission
 */
const VitalIntakeForm = ({ patientId, onSuccess }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            patient_id: patientId || '',
            heart_rate: '',
            blood_pressure: '',
            temperature: '',
            spo2: '',
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSuccessMsg(null);

        try {
            const payload = {
                patient_id: data.patient_id,
                heart_rate: parseInt(data.heart_rate, 10),
                blood_pressure: data.blood_pressure.trim(),
                temperature: parseFloat(data.temperature),
                spo2: parseInt(data.spo2, 10),
            };

            await submitVitals(payload);
            setSuccessMsg('Vital signs recorded successfully!');
            reset({
                patient_id: data.patient_id,
                heart_rate: '',
                blood_pressure: '',
                temperature: '',
                spo2: '',
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to submit vitals', err);
            setSubmitError(
                err.response?.data?.error || 'Failed to save vital signs.'
            );
        } finally {
            setIsSubmitting(false);
            // Auto-dismiss success message after 4 seconds
            setTimeout(() => setSuccessMsg(null), 4000);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-slate-200/60">
            {/* Header */}
            <div className="px-6 py-4 bg-teal-600 flex items-center">
                <Activity className="h-5 w-5 text-white mr-2" />
                <h3 className="text-lg font-semibold text-white tracking-wide">
                    Record Vital Signs
                </h3>
            </div>

            <div className="px-6 py-6">
                {/* Success Message */}
                {successMsg && (
                    <div className="mb-5 bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center border border-emerald-200 animate-pulse">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">{successMsg}</span>
                    </div>
                )}

                {/* Error Message */}
                {submitError && (
                    <div className="mb-5 bg-red-50 text-red-700 p-4 rounded-xl flex items-center border border-red-200">
                        <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">{submitError}</span>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                    {/* Patient ID */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Patient ID (UUID)
                        </label>
                        <input
                            {...register('patient_id', {
                                required: 'Patient ID is required',
                                pattern: {
                                    value:
                                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                                    message: 'Must be a valid UUID',
                                },
                            })}
                            type="text"
                            placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                            className="block w-full px-4 py-2.5 shadow-sm text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
                        />
                        {errors.patient_id && (
                            <span className="text-xs text-red-500 mt-1">
                                {errors.patient_id.message}
                            </span>
                        )}
                    </div>

                    {/* Heart Rate */}
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5">
                            <Heart className="h-4 w-4 mr-1.5 text-rose-500" />
                            Heart Rate (bpm)
                        </label>
                        <input
                            {...register('heart_rate', {
                                required: 'Required',
                                min: { value: 1, message: 'Must be at least 1' },
                                max: { value: 300, message: 'Must be at most 300' },
                            })}
                            type="number"
                            placeholder="72"
                            className="block w-full px-4 py-2.5 shadow-sm text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
                        />
                        {errors.heart_rate && (
                            <span className="text-xs text-red-500 mt-1">
                                {errors.heart_rate.message}
                            </span>
                        )}
                    </div>

                    {/* Blood Pressure */}
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5">
                            <Activity className="h-4 w-4 mr-1.5 text-violet-500" />
                            Blood Pressure
                        </label>
                        <input
                            {...register('blood_pressure', {
                                required: 'Required',
                                pattern: {
                                    value: /^\d{2,3}\/\d{2,3}$/,
                                    message: 'Format: 120/80',
                                },
                            })}
                            type="text"
                            placeholder="120/80"
                            className="block w-full px-4 py-2.5 shadow-sm text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
                        />
                        {errors.blood_pressure && (
                            <span className="text-xs text-red-500 mt-1">
                                {errors.blood_pressure.message}
                            </span>
                        )}
                    </div>

                    {/* Temperature */}
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5">
                            <Thermometer className="h-4 w-4 mr-1.5 text-amber-500" />
                            Temperature (°C)
                        </label>
                        <input
                            {...register('temperature', {
                                required: 'Required',
                                min: { value: 25, message: 'Min 25°C' },
                                max: { value: 50, message: 'Max 50°C' },
                            })}
                            type="number"
                            step="0.1"
                            placeholder="36.6"
                            className="block w-full px-4 py-2.5 shadow-sm text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
                        />
                        {errors.temperature && (
                            <span className="text-xs text-red-500 mt-1">
                                {errors.temperature.message}
                            </span>
                        )}
                    </div>

                    {/* SpO2 */}
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5">
                            <Droplet className="h-4 w-4 mr-1.5 text-sky-500" />
                            SpO2 (%)
                        </label>
                        <input
                            {...register('spo2', {
                                required: 'Required',
                                min: { value: 0, message: 'Min 0%' },
                                max: { value: 100, message: 'Max 100%' },
                            })}
                            type="number"
                            placeholder="98"
                            className="block w-full px-4 py-2.5 shadow-sm text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
                        />
                        {errors.spo2 && (
                            <span className="text-xs text-red-500 mt-1">
                                {errors.spo2.message}
                            </span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-all duration-200"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Submit Vital Signs
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VitalIntakeForm;
