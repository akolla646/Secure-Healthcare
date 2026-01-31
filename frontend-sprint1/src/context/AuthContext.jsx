import { createContext, useContext, useState, useEffect } from 'react';

// Use the simplified mock service
import { loginUser, registerUser, verifyOtp as apiVerifyOtp, resendOtp } from '../api/mockAuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple persistent login check
        try {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                // In our simple mock, the token IS the user data encoded in base64
                // Real app would use jwt-decode properly
                try {
                    const userData = JSON.parse(atob(storedToken));
                    // Basic check if token is "expired" (mock logic)
                    if (userData.exp && userData.exp < Date.now()) {
                        logout();
                    } else {
                        setUser({ ...userData, token: storedToken });
                    }
                } catch (parseErr) {
                    console.log("Token parse error, logging out");
                    logout();
                }
            }
        } catch (e) {
            console.error("Auth Init Error", e);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            await loginUser({ email, password });
            return { success: true, status: 'OTP_SENT' };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            await registerUser(userData);
            return { success: true };
        } catch (error) {
            console.error("Register Error:", error);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const response = await apiVerifyOtp({ email, otp });

            if (response.data && response.data.token) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setUser({ ...user, token });
                return { success: true };
            }
            return { success: true }; // Fallback success
        } catch (error) {
            console.error("Verify OTP Error:", error);
            return { success: false, message: error.response?.data?.message || 'Verification failed' };
        }
    };

    const handleResendOtp = async (email) => {
        try {
            await resendOtp({ email });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Resend failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            verifyOtp,
            resendOtp: handleResendOtp,
            isAuthenticated: !!user,
            role: user?.role,
            isLoading: loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
