import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy will handle this or it can be set to env var
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login if 401
            localStorage.removeItem('token');
            // Ideally use a specialized navigation service or event, 
            // but for sprint 1, simple window.location is a fallback if outside React Context
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const resendOtp = (email) => api.post('/auth/resend-otp', { email });
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);

export default api;
