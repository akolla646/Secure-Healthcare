import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ScanLine, Upload, FileImage, AlertCircle, CheckCircle2,
    Pill, Stethoscope, Sparkles, Loader2, Trash2, Eye,
    ArrowLeft, Clipboard, ChevronDown, ChevronUp, Zap,
    FileText, User, Calendar, Activity
} from 'lucide-react';
import CarePlanDisplay from '../components/CarePlanDisplay';

/**
 * PrescriptionOCR Page
 * 
 * Premium prescription scanner with OCR-powered text extraction.
 * Allows users to upload prescription images, extract medications
 * and diagnosis codes, then generate AI-powered care plans.
 * 
 * Features:
 * - Drag-and-drop / click image upload
 * - Tesseract.js OCR extraction with confidence scoring
 * - Intelligent text cleaning and normalization
 * - Medication detection with dosage/frequency parsing
 * - ICD-10 diagnosis code extraction
 * - CDSS AI integration for care plan generation
 */
const PrescriptionOCR = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const API_BASE = '/api';

    // Helper: get auth token from localStorage
    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });

    // Upload state
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // OCR state
    const [ocrStatus, setOcrStatus] = useState('idle'); // idle | uploading | success | error
    const [ocrResult, setOcrResult] = useState(null);
    const [ocrError, setOcrError] = useState(null);

    // UI state
    const [showRawText, setShowRawText] = useState(false);
    const [showCleanedText, setShowCleanedText] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview | medications | diagnosis | patient

    // AI Integration state
    const [selectedDiagnosisCode, setSelectedDiagnosisCode] = useState('');
    const [generating, setGenerating] = useState(false);
    const [carePlan, setCarePlan] = useState(null);
    const [reasoning, setReasoning] = useState(null);
    const [aiError, setAiError] = useState(null);

    // ======================================================================
    // FILE HANDLING
    // ======================================================================

    const handleFile = useCallback((file) => {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
        if (!allowedTypes.includes(file.type)) {
            setOcrError('Please upload an image file (JPEG, PNG, WebP, BMP, or TIFF).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setOcrError('File is too large. Maximum size is 10MB.');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setOcrResult(null);
        setOcrError(null);
        setOcrStatus('idle');
        setCarePlan(null);
        setReasoning(null);
        setAiError(null);
        setSelectedDiagnosisCode('');
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleFileInput = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    const clearFile = useCallback(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        setOcrResult(null);
        setOcrError(null);
        setOcrStatus('idle');
        setCarePlan(null);
        setReasoning(null);
        setAiError(null);
        setSelectedDiagnosisCode('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [previewUrl]);

    // ======================================================================
    // OCR UPLOAD
    // ======================================================================

    const handleExtract = async () => {
        if (!selectedFile) return;

        setOcrStatus('uploading');
        setOcrError(null);
        setOcrResult(null);

        try {
            const formData = new FormData();
            formData.append('prescriptionImage', selectedFile);

            const response = await fetch(`${API_BASE}/ocr/upload-prescription`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setOcrStatus('success');
                setOcrResult(data.data);
                // Auto-select first diagnosis code if available
                if (data.data.diagnosisCodes && data.data.diagnosisCodes.length > 0) {
                    setSelectedDiagnosisCode(data.data.diagnosisCodes[0]);
                }
            } else {
                setOcrStatus('error');
                setOcrError(data.error || 'OCR extraction failed.');
            }
        } catch (err) {
            setOcrStatus('error');
            setOcrError('Failed to connect to server. Please ensure the backend is running.');
        }
    };

    // ======================================================================
    // AI CARE PLAN GENERATION
    // ======================================================================

    const handleGenerateCarePlan = async () => {
        if (!selectedDiagnosisCode) {
            setAiError('Please select a diagnosis code first.');
            return;
        }

        setGenerating(true);
        setAiError(null);
        setCarePlan(null);
        setReasoning(null);

        try {
            const response = await fetch(`${API_BASE}/ocr/generate-plan-from-prescription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    diagnosisCode: selectedDiagnosisCode,
                    patientId: ocrResult?.patientInfo?.id,
                    patientName: ocrResult?.patientInfo?.name,
                    medications: ocrResult?.medications || [],
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCarePlan(data.data);
                setReasoning(data.reasoning);
            } else {
                setAiError(data.error || 'Failed to generate care plan.');
            }
        } catch (err) {
            setAiError('Failed to connect to server. Please ensure the backend is running.');
        } finally {
            setGenerating(false);
        }
    };

    // ======================================================================
    // HELPER RENDERERS
    // ======================================================================

    const getQualityColor = (quality) => {
        switch (quality) {
            case 'good': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            case 'fair': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
            case 'poor': return 'text-red-400 bg-red-500/20 border-red-500/30';
            default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
        }
    };

    const getConfidenceBadge = (confidence) => {
        if (confidence >= 80) return { label: 'High Confidence', color: 'text-emerald-400 bg-emerald-500/15' };
        if (confidence >= 60) return { label: 'Medium Confidence', color: 'text-amber-400 bg-amber-500/15' };
        return { label: 'Low Confidence', color: 'text-red-400 bg-red-500/15' };
    };

    // ======================================================================
    // RENDER
    // ======================================================================

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen bg-slate-50">

            <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center text-slate-600 hover:text-slate-900 transition mb-4 group"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white shadow-sm rounded-2xl border border-slate-200">
                            <ScanLine className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Prescription Scanner
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Upload a prescription image — our AI extracts medications, dosages & generates care plans
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ============================================================ */}
                    {/* LEFT COLUMN: Upload + Preview */}
                    {/* ============================================================ */}
                    <div className="space-y-6">
                        {/* Upload Zone */}
                        <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Upload className="h-5 w-5 text-indigo-600" />
                                Upload Prescription Image
                            </h2>

                            {!selectedFile ? (
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-12
                                        ${dragActive
                                            ? 'border-indigo-400 bg-indigo-50 scale-[1.02]'
                                            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/tiff"
                                        onChange={handleFileInput}
                                        className="hidden"
                                        id="prescription-file-input"
                                    />
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                            <FileImage className="h-8 w-8 text-indigo-500" />
                                        </div>
                                        <p className="text-slate-700 font-medium mb-1">
                                            {dragActive ? 'Drop your image here' : 'Click or drag to upload'}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Supports JPEG, PNG, WebP, BMP, TIFF — Max 10MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Image Preview */}
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                        <img
                                            src={previewUrl}
                                            alt="Prescription preview"
                                            className="w-full max-h-80 object-contain"
                                        />
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <button
                                                onClick={clearFile}
                                                className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-lg shadow-sm border border-slate-200 transition-colors"
                                                title="Remove image"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm shadow-sm border border-slate-200 rounded-lg px-3 py-1.5">
                                            <p className="text-xs text-slate-700 font-mono">{selectedFile.name}</p>
                                            <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>

                                    {/* Extract Button */}
                                    <button
                                        onClick={handleExtract}
                                        disabled={ocrStatus === 'uploading'}
                                        className={`
                                            w-full py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-3 transition-all duration-300
                                            ${ocrStatus === 'uploading'
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 border border-indigo-700 hover:scale-[1.01]'
                                            }
                                        `}
                                    >
                                        {ocrStatus === 'uploading' ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                Extracting with AI OCR...
                                            </>
                                        ) : ocrStatus === 'success' ? (
                                            <>
                                                <ScanLine className="h-6 w-6" />
                                                Re-scan Prescription
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-6 w-6" />
                                                Extract with AI OCR
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* OCR Error */}
                        {ocrError && (
                            <div className="bg-red-50 rounded-lg border border-red-200 p-5 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800 mb-1">Extraction Failed</p>
                                    <p className="text-sm text-red-600">{ocrError}</p>
                                </div>
                            </div>
                        )}

                        {/* OCR Stats / Quality Overview */}
                        {ocrResult && (
                            <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-6">
                                <h3 className="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-600" />
                                    Extraction Quality
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {/* Confidence */}
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                        <p className="text-2xl font-bold text-slate-900">{Math.round(ocrResult.ocr.confidence)}%</p>
                                        <p className="text-xs text-slate-500 mt-1">Confidence</p>
                                    </div>
                                    {/* Quality */}
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${getQualityColor(ocrResult.quality)}`}>
                                            {ocrResult.quality?.toUpperCase()}
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1">Quality</p>
                                    </div>
                                    {/* Words */}
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                        <p className="text-2xl font-bold text-slate-900">{ocrResult.ocr.wordCount}</p>
                                        <p className="text-xs text-slate-500 mt-1">Words</p>
                                    </div>
                                    {/* Medications */}
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                        <p className="text-2xl font-bold text-indigo-600">{ocrResult.medications?.length || 0}</p>
                                        <p className="text-xs text-slate-500 mt-1">Meds Found</p>
                                    </div>
                                </div>

                                {/* Corrections Applied */}
                                {ocrResult.corrections && ocrResult.corrections.length > 0 && (
                                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <p className="text-xs font-medium text-amber-400 mb-1">
                                            {ocrResult.corrections.length} auto-corrections applied
                                        </p>
                                        <p className="text-xs text-amber-300/60">
                                            {ocrResult.corrections.slice(0, 5).join(' • ')}
                                            {ocrResult.corrections.length > 5 && ` +${ocrResult.corrections.length - 5} more`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ============================================================ */}
                    {/* RIGHT COLUMN: Results */}
                    {/* ============================================================ */}
                    <div className="space-y-6">
                        {ocrStatus === 'uploading' && (
                            <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-12">
                                <div className="text-center">
                                    <div className="relative mx-auto w-20 h-20 mb-6">
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
                                        <ScanLine className="absolute inset-0 m-auto h-8 w-8 text-indigo-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Processing Prescription</h3>
                                    <p className="text-slate-500 text-sm">Running AI-powered OCR extraction...</p>
                                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Reading image</span>
                                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Extracting text</span>
                                        <span className="flex items-center gap-1"><Pill className="h-3 w-3" /> Finding meds</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {ocrResult && (
                            <>
                                {/* Tabs */}
                                <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                                    {[
                                        { id: 'overview', label: 'Text', icon: FileText },
                                        { id: 'medications', label: 'Medications', icon: Pill },
                                        { id: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
                                        { id: 'patient', label: 'Patient', icon: User },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                                }`}
                                        >
                                            <tab.icon className="h-4 w-4" />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-6">
                                    {/* Overview / Text Tab */}
                                    {activeTab === 'overview' && (
                                        <div className="space-y-4">
                                            {/* Cleaned Text */}
                                            <div>
                                                <button
                                                    onClick={() => setShowCleanedText(!showCleanedText)}
                                                    className="flex items-center justify-between w-full text-left mb-2"
                                                >
                                                    <h4 className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Cleaned Text
                                                    </h4>
                                                    {showCleanedText ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                                </button>
                                                {showCleanedText && (
                                                    <div className="relative">
                                                        <pre className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto border border-slate-200 leading-relaxed">
                                                            {ocrResult.cleanedText || 'No text extracted'}
                                                        </pre>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(ocrResult.cleanedText || '')}
                                                            className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                                                            title="Copy text"
                                                        >
                                                            <Clipboard className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Raw Text (Collapsible) */}
                                            <div>
                                                <button
                                                    onClick={() => setShowRawText(!showRawText)}
                                                    className="flex items-center justify-between w-full text-left mb-2"
                                                >
                                                    <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        Raw OCR Output
                                                    </h4>
                                                    {showRawText ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                                </button>
                                                {showRawText && (
                                                    <pre className="bg-slate-50 rounded-lg p-4 text-xs text-slate-500 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-200">
                                                        {ocrResult.rawText || 'No raw text'}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Medications Tab */}
                                    {activeTab === 'medications' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <Pill className="h-5 w-5 text-indigo-600" />
                                                Extracted Medications
                                                <span className="ml-auto text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                                                    {ocrResult.medications?.length || 0} found
                                                </span>
                                            </h3>

                                            {ocrResult.medications && ocrResult.medications.length > 0 ? (
                                                <div className="space-y-3">
                                                    {ocrResult.medications.map((med, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                                                                        <Pill className="h-4 w-4 text-indigo-600" />
                                                                    </div>
                                                                    <h4 className="font-semibold text-slate-900">{med.name}</h4>
                                                                </div>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${med.confidence === 'high'
                                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                    {med.confidence} confidence
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                                <div>
                                                                    <span className="text-slate-500 text-xs block">Dosage</span>
                                                                    <span className="text-slate-700 font-mono">{med.dosage}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 text-xs block">Frequency</span>
                                                                    <span className="text-slate-700">{med.frequency}</span>
                                                                </div>
                                                            </div>
                                                            {med.rawLine && (
                                                                <p className="mt-2 text-xs text-slate-500 italic border-t border-slate-200 pt-2">
                                                                    Source: "{med.rawLine}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-slate-500">
                                                    <Pill className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                                                    <p className="text-sm">No medications detected in the prescription.</p>
                                                    <p className="text-xs mt-1 text-slate-400">Try uploading a clearer image.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Diagnosis Tab */}
                                    {activeTab === 'diagnosis' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <Stethoscope className="h-5 w-5 text-teal-600" />
                                                Diagnosis Codes (ICD-10)
                                            </h3>

                                            {ocrResult.diagnosisCodes && ocrResult.diagnosisCodes.length > 0 ? (
                                                <div className="space-y-3">
                                                    {ocrResult.diagnosisCodes.map((code, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => setSelectedDiagnosisCode(code)}
                                                            className={`
                                                                p-4 rounded-xl border cursor-pointer transition-all duration-200
                                                                ${selectedDiagnosisCode === code
                                                                    ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-200 text-teal-900'
                                                                    : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                                                                }
                                                            `}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-mono font-bold text-lg text-teal-700">{code}</span>
                                                                    {selectedDiagnosisCode === code && (
                                                                        <CheckCircle2 className="h-5 w-5 text-teal-600" />
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-slate-500">Click to select</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="text-center py-6 text-slate-500">
                                                        <Stethoscope className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                                                        <p className="text-sm">No diagnosis codes detected automatically.</p>
                                                        <p className="text-xs mt-1 text-slate-400">You can manually enter a code below.</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-slate-700 mb-2">Enter Diagnosis Code Manually</label>
                                                        <input
                                                            type="text"
                                                            value={selectedDiagnosisCode}
                                                            onChange={(e) => setSelectedDiagnosisCode(e.target.value.toUpperCase())}
                                                            placeholder="e.g. E11, I10, J45"
                                                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-mono placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors shadow-sm"
                                                        />
                                                        <p className="text-xs text-slate-500 mt-1">Supported: E11 (Diabetes), I10 (Hypertension), I50 (Heart Failure), J45 (Asthma), E03 (Thyroid)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Patient Tab */}
                                    {activeTab === 'patient' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <User className="h-5 w-5 text-cyan-600" />
                                                Patient Information
                                            </h3>

                                            {ocrResult.patientInfo ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { label: 'Name', value: ocrResult.patientInfo.name, icon: User },
                                                        { label: 'Patient ID', value: ocrResult.patientInfo.id, icon: Clipboard },
                                                        { label: 'Age', value: ocrResult.patientInfo.age, icon: Calendar },
                                                        { label: 'Gender', value: ocrResult.patientInfo.gender, icon: User },
                                                        { label: 'Date', value: ocrResult.patientInfo.date, icon: Calendar },
                                                        { label: 'Doctor', value: ocrResult.patientInfo.doctor, icon: Stethoscope },
                                                    ].map((field, idx) => (
                                                        <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <field.icon className="h-3.5 w-3.5 text-slate-500" />
                                                                <span className="text-xs text-slate-500">{field.label}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-900 font-medium">
                                                                {field.value || <span className="text-slate-400 italic">Not detected</span>}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-slate-500">
                                                    <User className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                                                    <p className="text-sm">No patient information detected.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* ============================================ */}
                                {/* AI Care Plan Generation */}
                                {/* ============================================ */}
                                <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-6 shadow-sm mt-6">
                                    <h3 className="text-lg font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-indigo-500" />
                                        AI-Powered Care Plan
                                    </h3>
                                    <p className="text-sm text-indigo-700 mb-4">
                                        Generate a personalized care plan from the extracted prescription data
                                    </p>

                                    {selectedDiagnosisCode && (
                                        <div className="flex items-center gap-2 mb-4 p-2 bg-white rounded-lg border border-indigo-200">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span className="text-sm text-slate-700">
                                                Selected code: <span className="font-mono font-bold text-indigo-600">{selectedDiagnosisCode}</span>
                                            </span>
                                        </div>
                                    )}

                                    {!selectedDiagnosisCode && !ocrResult.diagnosisCodes?.length && (
                                        <div className="mb-4">
                                            <label className="block text-sm text-slate-700 mb-2">Enter Diagnosis Code</label>
                                            <input
                                                type="text"
                                                value={selectedDiagnosisCode}
                                                onChange={(e) => setSelectedDiagnosisCode(e.target.value.toUpperCase())}
                                                placeholder="e.g. E11, I10, J45"
                                                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 font-mono placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors shadow-sm"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleGenerateCarePlan}
                                        disabled={!selectedDiagnosisCode || generating}
                                        className={`
                                            w-full py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-3 transition-all duration-300
                                            ${(!selectedDiagnosisCode || generating)
                                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 border border-indigo-700 hover:scale-[1.01]'
                                            }
                                        `}
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                Generating Care Plan...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-6 w-6" />
                                                Generate AI Care Plan
                                            </>
                                        )}
                                    </button>

                                    {aiError && (
                                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-red-700">{aiError}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Placeholder when no results */}
                        {ocrStatus === 'idle' && !ocrResult && (
                            <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-12">
                                <div className="text-center">
                                    <div className="mx-auto w-20 h-20 mb-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                        <ScanLine className="h-10 w-10 text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Results Yet</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                        Upload a prescription image and click "Extract with AI OCR" to see results here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================================ */}
                {/* CARE PLAN DISPLAY (Full Width) */}
                {/* ============================================================ */}
                {carePlan && reasoning && (
                    <div className="mt-8">
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <span className="text-emerald-800 font-medium">Care plan generated from prescription OCR data</span>
                            {ocrResult?.medications?.length > 0 && (
                                <span className="ml-auto text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full border border-emerald-200">
                                    {ocrResult.medications.length} medications referenced
                                </span>
                            )}
                        </div>
                        <CarePlanDisplay carePlan={carePlan} reasoning={reasoning} />
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center text-xs text-slate-600">
                    Powered by Tesseract.js OCR • SecureMed CDSS AI Engine
                </div>
            </div>
        </div>
    );
};

export default PrescriptionOCR;
