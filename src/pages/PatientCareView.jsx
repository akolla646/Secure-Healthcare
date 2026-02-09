import { useLocation, Link } from 'react-router-dom';
import { Printer, ArrowLeft, Heart, Calendar } from 'lucide-react';

const PatientCareView = () => {
    const { state } = useLocation();
    const plan = state?.plan;

    if (!plan) return (
        <div className="p-8 text-center">
            <p>No Care Plan loaded.</p>
            <Link to="/dashboard" className="text-primary-600">Back onto Dashboard</Link>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden my-8 print:shadow-none">
            {/* Header */}
            <div className="bg-primary-600 px-6 py-4 flex justify-between items-center print:bg-white print:text-black print:border-b">
                <h1 className="text-xl font-bold text-white print:text-black">Your Care Plan</h1>
                <div className="flex space-x-2 print:hidden">
                    <button onClick={() => window.print()} className="text-white hover:text-primary-100">
                        <Printer className="h-6 w-6" />
                    </button>
                    <Link to="/dashboard" className="text-white hover:text-primary-100">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Condition: {plan.conditionCode.split('-')[1] || plan.conditionCode}</h2>
                    <p className="text-slate-600">
                        This plan has been personalized for you based on your clinical history and latest diagnosis.
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Medications */}
                    <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                        <h3 className="flex items-center text-lg font-semibold text-blue-900 mb-3">
                            <Heart className="h-5 w-5 mr-2" />
                            Prescribed Medications
                        </h3>
                        {plan.medications.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                                {plan.medications.map((med, i) => (
                                    <li key={i}>
                                        <span className="font-medium">{med.name}</span>: {med.dosage}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-blue-800 italic">No medications currently prescribed.</p>
                        )}
                    </div>

                    {/* Lifestyle */}
                    <div className="bg-green-50 rounded-lg p-5 border border-green-100">
                        <h3 className="flex items-center text-lg font-semibold text-green-900 mb-3">
                            <Calendar className="h-5 w-5 mr-2" />
                            Lifestyle & Diet Goals
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-green-800">
                            {plan.diet.map((item, i) => (
                                <li key={'d-' + i}>{item.text}</li>
                            ))}
                            {plan.lifestyle.map((item, i) => (
                                <li key={'l-' + i}>{item.text}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
                    <p>Secure Healthcare System • Generated securely for your records</p>
                </div>
            </div>
        </div>
    );
};

export default PatientCareView;
