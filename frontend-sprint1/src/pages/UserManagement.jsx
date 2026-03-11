import { useState, useEffect } from "react";
import { Users, Search, Trash2, Plus } from 'lucide-react';
import api from '../api/client';
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
    const navigate = useNavigate();

    // Data List
    const [users, setUsers] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State (Add User Form)
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "PATIENT",
        full_name: "",
        dob: "",
        gender: "Male",
        blood_group: "O+",
        specialization: "",
        qualification: "",
        experience_years: 0,
        department: "",
        consultation_fee: 0,
        phone_number: ""
    });

    // Feedback State
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Auth Token
    const token = localStorage.getItem('token');

    // Load data on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const usersRes = await api.get("/admin/users", config);
            setUsers(usersRes.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
            if (err.response && err.response.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await api.delete(`/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchUsers();
            setSuccess("User deleted successfully");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Delete failed", err);
            setError("Failed to delete user");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await api.post("/admin/users", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setFormData({
                username: "", email: "", password: "", role: "PATIENT",
                full_name: "", dob: "", gender: "Male", blood_group: "O+",
                specialization: "", qualification: "", experience_years: 0, department: "", consultation_fee: 0, phone_number: ""
            });

            setSuccess("User created successfully");
            fetchUsers();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Create failed", err);
            setError(err.response?.data?.error || "Failed to create user");
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center">Loading User Management...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate mb-6">User Management</h2>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded">{success}</div>}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="bg-white px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Manage Users</h3>

                    <div className="flex space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1 border border-slate-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
                            />
                            <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2" />
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add User
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.user_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDeleteUser(user.user_id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white text-left">
                        <div className="mt-3">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Add New User</h3>
                            <form onSubmit={handleAddUser} className="mt-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                                    <input required name="username" value={formData.username} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                    <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                        <option value="PATIENT">Patient</option>
                                        <option value="DOCTOR">Doctor</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="LAB_TECH">Lab Tech</option>
                                    </select>
                                </div>

                                {formData.role === 'PATIENT' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                                            <input required name="full_name" value={formData.full_name} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">DOB</label>
                                            <input required type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                        </div>
                                    </>
                                )}
                                {formData.role === 'DOCTOR' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                                            <input required name="full_name" value={formData.full_name} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                        </div>
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Specialization</label>
                                                <input required name="specialization" value={formData.specialization} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Department</label>
                                                <input required name="department" value={formData.department} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                        </div>
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Qualification</label>
                                                <input required name="qualification" value={formData.qualification} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Experience (Years)</label>
                                                <input required type="number" name="experience_years" value={formData.experience_years} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                        </div>
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Consultation Fee</label>
                                                <input required type="number" name="consultation_fee" value={formData.consultation_fee} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                                                <input name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center justify-between mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Cancel</button>
                                    <button type="submit" className="bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
