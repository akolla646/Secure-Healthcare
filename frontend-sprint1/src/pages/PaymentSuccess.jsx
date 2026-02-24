import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import api from '../api/client';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            if (sessionId) {
                try {
                    // We call the backend to manually check the Stripe session status
                    // This prevents race conditions where the user clicks "Return to Dashboard"
                    // before the Stripe Webhook has had time to reach our server.
                    await api.get(`/payments/verify-session?session_id=${sessionId}`);
                } catch (err) {
                    console.error("Failed to verify session proactively", err);
                }
            }
            setVerifying(false);
        };
        verifySession();
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {verifying ? "Verifying Payment..." : "Payment Successful!"}
                </h2>
                <p className="text-slate-600 mb-8">
                    {verifying
                        ? "Please wait a moment while we confirm your transaction."
                        : "Your transaction has been completed successfully. You will receive a confirmation email shortly."}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/30"
                    >
                        Return to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </button>

                    <p className="text-xs text-slate-400 mt-4">
                        Transaction ID: {sessionId ? `${sessionId.slice(0, 8)}...` : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
