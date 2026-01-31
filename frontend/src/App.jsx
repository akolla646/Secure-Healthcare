import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

/**
 * Clinical Decision Support System - Main Application
 */
function App() {
  const [patients, setPatients] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:3001/api';

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [patientsRes, diagnosesRes] = await Promise.all([
          fetch(`${API_BASE}/patients`),
          fetch(`${API_BASE}/diagnoses`)
        ]);

        if (!patientsRes.ok || !diagnosesRes.ok) {
          throw new Error('Failed to fetch initial data');
        }

        const patientsData = await patientsRes.json();
        const diagnosesData = await diagnosesRes.json();

        setPatients(patientsData.data);
        setDiagnoses(diagnosesData.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Unable to connect to the Clinical Decision Support System. Please ensure the backend server is running.');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl text-slate-300">Loading Clinical Decision Support System...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl text-red-400 mb-2">Connection Error</h2>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Clinical Decision Support System</h1>
              <p className="text-xs text-slate-400">Automated Care Plan Generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            System Online
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Dashboard
          patients={patients}
          diagnoses={diagnoses}
          apiBase={API_BASE}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-slate-500">
          <p>Clinical Decision Support System v1.0.0 • For demonstration purposes only</p>
          <p className="text-xs mt-1">All decisions require physician review before implementation</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
