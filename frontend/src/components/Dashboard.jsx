import { useState } from 'react';
import PatientContext from './PatientContext';
import CarePlanDisplay from './CarePlanDisplay';

/**
 * Dashboard Component
 * Main interface for doctors to select patients and generate care plans
 */
function Dashboard({ patients, diagnoses, apiBase }) {
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
    const [patientDetails, setPatientDetails] = useState(null);
    const [carePlan, setCarePlan] = useState(null);
    const [reasoning, setReasoning] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Handle patient selection
    const handlePatientChange = async (e) => {
        const patientId = e.target.value;
        setSelectedPatientId(patientId);
        setCarePlan(null);
        setReasoning(null);
        setError(null);

        if (!patientId) {
            setPatientDetails(null);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/patients/${patientId}`);
            const data = await response.json();

            if (data.success) {
                setPatientDetails(data.data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch patient details');
        } finally {
            setLoading(false);
        }
    };

    // Handle care plan generation
    const handleGenerateCarePlan = async () => {
        if (!selectedPatientId || !selectedDiagnosis) {
            setError('Please select both a patient and a diagnosis');
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const response = await fetch(`${apiBase}/generate-care-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId: selectedPatientId,
                    diagnosisCode: selectedDiagnosis,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCarePlan(data.data);
                setReasoning(data.reasoning);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to generate care plan. Please ensure the backend server is running.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Selection Panel */}
            <div className="glass-card p-6 fade-in">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Patient Selection
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Patient Selector */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Select Patient</label>
                        <select
                            value={selectedPatientId}
                            onChange={handlePatientChange}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        >
                            <option value="">-- Select a Patient --</option>
                            {patients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.name} (ID: {patient.id}) - Age: {patient.age}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Diagnosis Selector */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Select Diagnosis</label>
                        <select
                            value={selectedDiagnosis}
                            onChange={(e) => setSelectedDiagnosis(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            disabled={!selectedPatientId}
                        >
                            <option value="">-- Select a Diagnosis --</option>
                            {diagnoses.map((diagnosis) => (
                                <option key={diagnosis.code} value={diagnosis.code}>
                                    [{diagnosis.code}] {diagnosis.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleGenerateCarePlan}
                        disabled={!selectedPatientId || !selectedDiagnosis || generating}
                        className={`
              px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300
              ${(!selectedPatientId || !selectedDiagnosis || generating)
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:from-sky-400 hover:to-violet-400 shadow-lg hover:shadow-sky-500/25'
                            }
            `}
                    >
                        {generating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate Care Plan
                            </>
                        )}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Patient Context Panel */}
            {loading && (
                <div className="glass-card p-6 text-center">
                    <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-2">Loading patient details...</p>
                </div>
            )}

            {patientDetails && !loading && (
                <PatientContext patient={patientDetails} />
            )}

            {/* Care Plan Display */}
            {carePlan && reasoning && (
                <CarePlanDisplay carePlan={carePlan} reasoning={reasoning} />
            )}
        </div>
    );
}

export default Dashboard;
