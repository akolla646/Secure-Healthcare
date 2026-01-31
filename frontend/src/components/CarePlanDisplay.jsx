import { useState } from 'react';

/**
 * CarePlanDisplay Component
 * Displays the generated care plan with treatments, diet, and explainability
 */
function CarePlanDisplay({ carePlan, reasoning }) {
    const [activeTab, setActiveTab] = useState('treatments');

    if (!carePlan) return null;

    const tabs = [
        { id: 'treatments', label: 'Treatments', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { id: 'diet', label: 'Diet Plan', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'reasoning', label: 'Explainability', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'warnings', label: 'Warnings', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ];

    return (
        <div className="glass-card overflow-hidden fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600/20 to-violet-600/20 p-6 border-b border-slate-700/50">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Generated Care Plan
                        </h2>
                        <p className="text-slate-400 mt-1">
                            For: <span className="text-white">{carePlan.patientName}</span> •
                            Diagnosis: <span className="text-sky-400">{carePlan.diagnosis.name}</span>
                        </p>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                        <p>Generated: {new Date(carePlan.generatedAt).toLocaleString()}</p>
                        <p className="text-xs">Rules Applied: {reasoning.totalRules}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-700/50 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id
                                ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-500/10'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                            }
            `}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                        </svg>
                        {tab.label}
                        {tab.id === 'warnings' && carePlan.warnings.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                {carePlan.warnings.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {/* Treatments Tab */}
                {activeTab === 'treatments' && (
                    <div className="space-y-6">
                        {/* Recommended Treatments */}
                        <div>
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-4">
                                Recommended Treatments ({carePlan.treatments.length})
                            </h3>
                            {carePlan.treatments.length > 0 ? (
                                <div className="space-y-3">
                                    {carePlan.treatments.map((treatment, index) => (
                                        <div
                                            key={treatment.id}
                                            className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-emerald-500 slide-in"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-white font-medium">{treatment.name}</h4>
                                                    {treatment.examples && (
                                                        <p className="text-sm text-slate-400 mt-1">
                                                            Examples: {treatment.examples.join(', ')}
                                                        </p>
                                                    )}
                                                    {treatment.dosage && (
                                                        <p className="text-sm text-sky-400 mt-1">
                                                            Dosage: {treatment.dosage}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`
                          px-2 py-1 text-xs rounded font-medium
                          ${treatment.priority === 1 ? 'bg-emerald-500/20 text-emerald-400' : ''}
                          ${treatment.priority === 2 ? 'bg-sky-500/20 text-sky-400' : ''}
                          ${treatment.priority >= 3 ? 'bg-slate-500/20 text-slate-400' : ''}
                        `}>
                                                    Priority {treatment.priority}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500">No treatments recommended</p>
                            )}
                        </div>

                        {/* Excluded Treatments */}
                        {carePlan.excludedTreatments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-4">
                                    Excluded Treatments ({carePlan.excludedTreatments.length})
                                </h3>
                                <div className="space-y-3">
                                    {carePlan.excludedTreatments.map((treatment, index) => (
                                        <div
                                            key={treatment.id}
                                            className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-red-500 opacity-75"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-slate-300 font-medium line-through">{treatment.name}</h4>
                                                    <p className="text-sm text-red-400 mt-1">
                                                        ⚠️ Excluded: {treatment.exclusionReason}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monitoring Requirements */}
                        {carePlan.monitoring.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wide mb-4">
                                    Monitoring Required
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {carePlan.monitoring.map((item, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full text-sm"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Diet Tab */}
                {activeTab === 'diet' && (
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-4">
                            Dietary Recommendations ({carePlan.dietPlan.length})
                        </h3>
                        {carePlan.dietPlan.length > 0 ? (
                            <div className="space-y-3">
                                {carePlan.dietPlan.map((diet, index) => (
                                    <div
                                        key={diet.id}
                                        className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-emerald-500 slide-in"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-white font-medium">{diet.name}</h4>
                                                <p className="text-sm text-slate-400 mt-1">{diet.description}</p>
                                            </div>
                                            <span className={`
                        px-2 py-1 text-xs rounded font-medium
                        ${diet.priority === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}
                      `}>
                                                Priority {diet.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">No specific dietary recommendations</p>
                        )}
                    </div>
                )}

                {/* Reasoning/Explainability Tab */}
                {activeTab === 'reasoning' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wide">
                                Decision Reasoning Path
                            </h3>
                            <span className="text-sm text-slate-400">
                                Total Rules Applied: {reasoning.totalRules}
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {reasoning.paths.map((path, index) => (
                                <div
                                    key={index}
                                    className={`
                    bg-slate-800/50 rounded-lg p-4 slide-in
                    ${path.category === 'exclusion' ? 'border-l-4 border-red-500' : ''}
                    ${path.category === 'inclusion' ? 'border-l-4 border-emerald-500' : ''}
                    ${path.category === 'dietary' ? 'border-l-4 border-sky-500' : ''}
                    ${path.category === 'warning' ? 'border-l-4 border-amber-500' : ''}
                    ${path.category === 'monitoring' ? 'border-l-4 border-violet-500' : ''}
                    ${path.category === 'lab_finding' ? 'border-l-4 border-blue-500' : ''}
                  `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded font-mono">
                                            {path.ruleId}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-white">{path.reason}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                <span className="capitalize">{path.category.replace('_', ' ')}</span>
                                                <span>{new Date(path.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Warnings Tab */}
                {activeTab === 'warnings' && (
                    <div>
                        <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">
                            Clinical Warnings & Alerts
                        </h3>
                        {carePlan.warnings.length > 0 ? (
                            <div className="space-y-3">
                                {carePlan.warnings.map((warning, index) => (
                                    <div
                                        key={index}
                                        className={`
                      rounded-lg p-4 slide-in
                      ${warning.severity === 'high'
                                                ? 'bg-red-500/10 border border-red-500/30'
                                                : 'bg-amber-500/10 border border-amber-500/30'
                                            }
                    `}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <svg
                                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div className="flex-1">
                                                <p className={`font-medium ${warning.severity === 'high' ? 'text-red-300' : 'text-amber-300'}`}>
                                                    {warning.message}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    <span className="capitalize">{warning.type.replace('_', ' ')}</span>
                                                    <span className={`
                            px-2 py-0.5 rounded
                            ${warning.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}
                          `}>
                                                        {warning.severity} severity
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 text-emerald-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-slate-400">No warnings or alerts for this care plan</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CarePlanDisplay;
