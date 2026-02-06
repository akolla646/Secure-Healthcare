import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Hospital } from 'lucide-react';
import { useForm } from 'react-hook-form';

const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Steps: 'DETAILS', 'OTP', 'SUCCESS'
    const [step, setStep] = useState('DETAILS');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [registeredPassword, setRegisteredPassword] = useState('');

    // OTP State
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const { register: registerAction, activateAccount, resendOtp } = useAuth();
    const navigate = useNavigate();

    // Timer logic for Resend OTP
    useEffect(() => {
        let interval;
        if (step === 'OTP' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const onRegisterSubmit = async (data) => {
        setError('');
        setIsSubmitting(true);

        try {
            const result = await registerAction(data);
            if (result.success) {
                setRegisteredEmail(data.email);
                setRegisteredPassword(data.password);
                setStep('OTP');
                setTimer(30);
                setCanResend(false);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) { // Assuming 6 chars usually, but checking not empty
            setError('Please enter a valid OTP.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        try {
            const result = await activateAccount(registeredEmail, otp, registeredPassword);
            if (result.success) {
                setStep('SUCCESS');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setCanResend(false);
        setTimer(30);
        setError('');
        try {
            const result = await resendOtp(registeredEmail);
            if (!result.success) {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to resend OTP');
        }
    };

    if (step === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow rounded-lg text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <UserPlus className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Account Verified!</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Your email has been verified successfully. Redirecting to login...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Hospital className="h-6 w-6 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    {step === 'DETAILS' ? 'Create an Account' : 'Verify your Email'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    {step === 'DETAILS' ? 'Join the Secure Health System' : `Enter code sent to ${registeredEmail}`}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-slate-100">

                    {step === 'DETAILS' && (
                        <form className="space-y-6" onSubmit={handleSubmit(onRegisterSubmit)}>
                            {/* Full Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input id="name" {...register('name', { required: 'Full Name is required' })} type="text" className={`focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 px-3 border ${errors.name ? 'border-red-300' : ''}`} placeholder="John Doe" />
                                </div>
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label htmlFor="dob" className="block text-sm font-medium text-slate-700">Date of Birth</label>
                                <div className="mt-1">
                                    <input id="dob" {...register('dob', { required: 'Date of Birth is required' })} type="date" className={`block w-full sm:text-sm border-slate-300 rounded-md py-2 px-3 border focus:ring-primary-500 focus:border-primary-500 ${errors.dob ? 'border-red-300' : ''}`} />
                                </div>
                                {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Gender */}
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-medium text-slate-700">Gender</label>
                                    <select id="gender" {...register('gender', { required: 'Gender is required' })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                                </div>

                                {/* Blood Group */}
                                <div>
                                    <label htmlFor="blood_group" className="block text-sm font-medium text-slate-700">Blood Group</label>
                                    <select id="blood_group" {...register('blood_group', { required: 'Blood Group is required' })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                    {errors.blood_group && <p className="mt-1 text-sm text-red-600">{errors.blood_group.message}</p>}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input id="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } })} type="email" className={`focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 px-3 border ${errors.email ? 'border-red-300' : ''}`} placeholder="name@hospital.com" />
                                </div>
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input id="password" {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Must be at least 6 chars' } })} type="password" className={`focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 px-3 border ${errors.password ? 'border-red-300' : ''}`} placeholder="••••••••" />
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-700">Role</label>
                                <select id="role" {...register('role', { required: 'Role is required' })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
                                    <option value="Patient">Patient</option>
                                </select>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors">
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />Creating Account...</>
                                    ) : ('Register')}
                                </button>
                            </div>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-slate-500">Already have an account?</span>
                                    </div>
                                </div>
                                <div className="mt-6 text-center">
                                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 'OTP' && (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                                    One-Time Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        id="otp"
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center tracking-widest text-lg"
                                        placeholder="123456"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                <p className="mt-2 text-sm text-slate-500 text-center">
                                    Please enter the 6-digit code sent to your email.
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={isSubmitting || otp.length < 4}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />Verifying...</>
                                    ) : ('Verify Email')}
                                </button>
                            </div>

                            <div className="mt-4 text-center">
                                <button
                                    onClick={handleResendOtp}
                                    disabled={!canResend}
                                    className={`text-sm font-medium ${canResend ? 'text-primary-600 hover:text-primary-500' : 'text-slate-400 cursor-not-allowed'}`}
                                >
                                    {canResend ? "Resend OTP" : `Resend OTP in ${timer}s`}
                                </button>
                            </div>

                            <div className="mt-4 text-center">
                                <button onClick={() => setStep('DETAILS')} className="text-sm text-slate-500 hover:text-slate-700">
                                    Back to Registration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
