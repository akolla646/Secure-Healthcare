import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader2, Activity, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';

const ForgotPassword = () => {
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { forgotPassword } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const result = await forgotPassword(data.username);
            if (result.success) {
                setSuccessMessage('Password reset OTP has been sent to your registered email.');
                // Optional: delay redirect to let user read message
                setTimeout(() => {
                    navigate('/reset-password', { state: { email: data.username } }); // Passing username as email for next step (backend treats them similarly for lookup)
                }, 1500);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Visual / Brand (Same as Login) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-blue-600/20 z-10" />
                <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />

                <div className="relative z-20 flex flex-col justify-center px-12 text-white">
                    <div className="mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-teal-500 rounded-lg">
                                <Activity className="h-8 w-8 text-white" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight">SecureMed</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold max-w-lg leading-tight">
                        Account Recovery
                    </h1>
                    <p className="mt-6 text-lg text-slate-300 max-w-md">
                        Securely reset your password and regain access to your medical management portal.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:px-24 bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            Forgot password?
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            No worries, we'll send you reset instructions.
                        </p>
                    </div>

                    <div className="mt-8">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                                    Username
                                </label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="username"
                                        {...register('username', {
                                            required: 'Username is required'
                                        })}
                                        type="text"
                                        className={`appearance-none block w-full pl-10 pr-3 py-3 border ${errors.username ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                        placeholder="Enter your username"
                                    />
                                </div>
                                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                            </div>

                            {/* Success Message */}
                            {successMessage && (
                                <div className="rounded-lg bg-green-50 p-4 border border-green-100">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-green-800">{successMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Request Failed</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-center mt-6">
                                <Link to="/login" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to log in
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
