
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FaCalendarAlt, FaClock, FaStethoscope, FaUser, FaPhone, FaEnvelope, FaNotesMedical, FaCheckCircle, FaHistory, FaFilter, FaFileExport, FaSync } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const BookAppointment = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctors, setDoctors] = useState([]);

    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        age: '',
        doctorSpecialization: '',
        appointmentDate: '',
        appointmentTime: '',
        appointmentType: '',
        symptoms: '',
        captchaInput: ''
    });

    const [captcha, setCaptcha] = useState({ code: '' });
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    // Generate Captcha
    const generateCaptcha = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        setCaptcha({ code: result });
    };

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (!storedUser) {
                    navigate('/login');
                    return;
                }
                if (storedUser.role === 'doctor') {
                    navigate('/doctor-dashboard');
                    return;
                }
                setUser(storedUser);
                setFormData(prev => ({ ...prev, fullName: storedUser.name, email: storedUser.email }));

                // Fetch Doctors
                const docRes = await api.get('/doctors');
                setDoctors(docRes.data);



                generateCaptcha();
            } catch (err) {
                console.error("Init Error", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus({ type: '', message: '' });

        if (formData.captchaInput.toUpperCase() !== captcha.code) {
            setSubmitStatus({ type: 'error', message: 'Incorrect CAPTCHA. Please try again.' });
            generateCaptcha();
            return;
        }

        try {
            const selectedDoc = doctors.find(d => d.specialty === formData.doctorSpecialization);

            await api.post('/appointments', {
                userId: user.id,
                patientName: formData.fullName,
                patientEmail: formData.email,
                phone: formData.phone,
                age: formData.age,
                doctorId: selectedDoc?.id,
                doctorName: selectedDoc?.name,
                date: formData.appointmentDate,
                time: formData.appointmentTime,
                appointmentType: formData.appointmentType,
                symptoms: formData.symptoms
            });

            setSubmitStatus({ type: 'success', message: 'Appointment booked pending approval.' });
            generateCaptcha();
            // Reset form partially
            setFormData(prev => ({ ...prev, appointmentDate: '', appointmentTime: '', captchaInput: '', symptoms: '' }));



        } catch (err) {
            setSubmitStatus({ type: 'error', message: err.response?.data?.message || 'Booking Failed.' });
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#6c5ce7] p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex justify-between items-center text-white mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
                        <p className="text-white/80 text-sm">Manage your health and appointments</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded text-sm transition">
                        Logout
                    </button>
                </div>

                {/* Booking Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-xl shadow-xl p-8"
                >
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <FaCalendarAlt className="text-2xl text-slate-700" />
                        <h2 className="text-2xl font-bold text-slate-800">Book Appointment</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Full Name *">
                                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="form-input" placeholder="John Doe" required />
                            </InputGroup>
                            <InputGroup label="Email Address *">
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="form-input" placeholder="john@example.com" required />
                            </InputGroup>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Phone Number *">
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="form-input" placeholder="+1 234 567 890" required />
                            </InputGroup>
                            <InputGroup label="Age *">
                                <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="form-input" placeholder="25" required />
                            </InputGroup>
                        </div>

                        {/* Doctor */}
                        <InputGroup label="Doctor Specialization *">
                            <select value={formData.doctorSpecialization} onChange={e => setFormData({ ...formData, doctorSpecialization: e.target.value })} className="form-select" required>
                                <option value="">Select Doctor Type</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.specialty}>{d.specialty}</option>
                                ))}
                            </select>
                        </InputGroup>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Appointment Date *">
                                <input type="date" value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} className="form-input text-slate-600" required />
                            </InputGroup>
                            <InputGroup label="Appointment Time *">
                                <select value={formData.appointmentTime} onChange={e => setFormData({ ...formData, appointmentTime: e.target.value })} className="form-select" required>
                                    <option value="">Select Time</option>
                                    {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </InputGroup>
                        </div>

                        {/* Type */}
                        <InputGroup label="Appointment Type *">
                            <select value={formData.appointmentType} onChange={e => setFormData({ ...formData, appointmentType: e.target.value })} className="form-select" required>
                                <option value="">Select Appointment Type</option>
                                <option value="First Consultation">First Consultation</option>
                                <option value="Regular Check-up">Regular Check-up</option>
                                <option value="Follow-up Visit">Follow-up Visit</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </InputGroup>

                        {/* Notes */}
                        <InputGroup label="Additional Notes / Symptoms">
                            <textarea value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} className="form-input min-h-[100px]" placeholder="Describe your symptoms..."></textarea>
                        </InputGroup>

                        {/* Captcha */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Verify CAPTCHA *</label>
                            <div className="flex gap-4 mb-3">
                                <div className="bg-slate-200 px-6 py-2 rounded text-xl font-mono tracking-widest text-slate-600 line-through select-none font-bold">
                                    {captcha.code}
                                </div>
                                <button type="button" onClick={generateCaptcha} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"><FaSync /></button>
                            </div>
                            <input type="text" value={formData.captchaInput} onChange={e => setFormData({ ...formData, captchaInput: e.target.value })} className="form-input" placeholder="Enter CAPTCHA code" required />
                        </div>

                        {/* Submit */}
                        {submitStatus.message && (
                            <div className={`p-4 rounded text-center font-bold ${submitStatus.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {submitStatus.message}
                            </div>
                        )}

                        <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mx-auto md:mx-0">
                            <FaCheckCircle /> Book Appointment
                        </button>

                    </form>
                </motion.div>



            </div>
        </div>
    );
};

const InputGroup = ({ label, children }) => (
    <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        {children}
    </div>
);

export default BookAppointment;
