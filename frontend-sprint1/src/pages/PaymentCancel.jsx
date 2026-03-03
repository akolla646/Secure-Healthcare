import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <XCircle className="h-10 w-10 text-red-600" />
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Payment Cancelled</h2>
                <p className="text-slate-600 mb-8">
                    You have cancelled the payment process. No charges were made to your account.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 text-base font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancel;
