import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to automatically log out a user after a period of inactivity.
 * Important for HIPAA compliance.
 * 
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15 minutes = 900000 ms)
 */
const useAutoLogout = (timeoutMs = 900000) => {
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const performLogout = useCallback(() => {
        if (isAuthenticated) {
            logout();
            // Notify user of session expiration
            alert("Your session has expired due to inactivity for security reasons (HIPAA). Please log in again.");
            navigate('/login');
        }
    }, [logout, isAuthenticated, navigate]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (isAuthenticated) {
            timeoutRef.current = setTimeout(performLogout, timeoutMs);
        }
    }, [performLogout, isAuthenticated, timeoutMs]);

    useEffect(() => {
        // Events that qualify as "activity"
        const events = [
            'mousemove',
            'keydown',
            'mousedown',
            'scroll',
            'touchstart'
        ];

        // Attach event listeners to reset the timer
        if (isAuthenticated) {
            resetTimer(); // Start the timer initially
            events.forEach(event => window.addEventListener(event, resetTimer));
        }

        // Cleanup function map
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [resetTimer, isAuthenticated]);

    return resetTimer;
};

export default useAutoLogout;
