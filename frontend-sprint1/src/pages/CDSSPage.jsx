import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import CarePlanDisplay from '../components/CarePlanDisplay';

const CDSSPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [diagnosisText, setDiagnosisText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [carePlan, setCarePlan] = useState(null);
    const [reasoning, setReasoning] = useState(null);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.txt')) {
            setError('Please upload a .txt file');
            return;
        }

        setFile(selectedFile);
        setError(null);

        // Read file content
        const reader = new FileReader();
        reader.onload = (event) => {
            setDiagnosisText(event.target.result);
        };
        reader.onerror = () => {
            setError('Failed to read file');
        };
        reader.readAsText(selectedFile);
    };

    const handleGeneratePlan = async () => {
        if (!diagnosisText.trim()) {
            setError('Please upload a diagnosis file first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/care-plan/generate', {
                diagnosisText: diagnosisText
            });

            if (response.data.success) {
                setCarePlan(response.data.carePlan);
                setReasoning(response.data.reasoning);
            } else {
                setError(response.data.error || 'Failed to generate care plan');
            }
        } catch (err) {
            console.error('Care plan generation error:', err);
            if (err.response?.data?.supportedDiagnoses) {
                const supported = err.response.data.supportedDiagnoses
                    .map(d => d.name)
                    .join(', ');
                setError(`${err.response.data.error}\n\nSupported diagnoses: ${supported}`);
            } else {
                setError(err.response?.data?.error || 'Failed to generate care plan. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setDiagnosisText('');
        setCarePlan(null);
        setReasoning(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center text-slate-600 hover:text-slate-900 transition"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Dashboard
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="h-7 w-7 text-teal-600" />
                        Clinical Decision Support System
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Upload your diagnosis file to generate a personalized care and diet plan.
                    </p>
                </div>

                {!carePlan ? (
                    /* Upload Section */
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        <div className="max-w-xl mx-auto">
                            {/* File Upload Area */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-slate-400'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".txt"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="diagnosis-file"
                                />
                                <label htmlFor="diagnosis-file" className="cursor-pointer">
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="h-12 w-12 text-teal-500 mb-3" />
                                            <p className="font-medium text-teal-700">{file.name}</p>
                                            <p className="text-sm text-teal-600 mt-1">File loaded successfully</p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleReset();
                                                }}
                                                className="mt-3 text-sm text-slate-500 hover:text-slate-700"
                                            >
                                                Choose different file
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="h-12 w-12 text-slate-400 mb-3" />
                                            <p className="font-medium text-slate-700">
                                                Drop your diagnosis file here
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                or click to browse (.txt files only)
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Preview */}
                            {diagnosisText && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                        Diagnosis Content Preview
                                    </h3>
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-40 overflow-y-auto">
                                        <pre className="text-sm text-slate-600 whitespace-pre-wrap font-mono">
                                            {diagnosisText}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                                        <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Generate Button */}
                            <button
                                onClick={handleGeneratePlan}
                                disabled={!diagnosisText || loading}
                                className="mt-6 w-full flex items-center justify-center py-3 px-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Generating Care Plan...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-5 w-5 mr-2" />
                                        Generate Care & Diet Plan
                                    </>
                                )}
                            </button>

                            <p className="mt-4 text-xs text-slate-500 text-center">
                                Your uploaded diagnosis file will be analyzed to generate personalized
                                care recommendations and dietary guidelines.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Care Plan Display */
                    <div className="space-y-6">
                        <button
                            onClick={handleReset}
                            className="flex items-center text-teal-600 hover:text-teal-700 font-medium"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Diagnosis
                        </button>

                        <CarePlanDisplay
                            carePlan={carePlan}
                            reasoning={reasoning}
                        />

                        <div className="text-center text-xs text-slate-400 mt-8">
                            Generated by SecureMed CDSS • Based on Clinical Knowledge Graph
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CDSSPage;
