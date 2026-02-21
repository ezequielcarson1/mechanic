import React from 'react';
import { Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import AppointmentsPage from './pages/Appointments';
import Login from './pages/Login';
import UsersPage from './pages/Users';

// Placeholder components
const Dashboard = () => (
    <div className="p-8">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h3 className="text-slate-400 text-sm font-medium">Metric {i}</h3>
                    <p className="text-3xl font-bold mt-2">--</p>
                </div>
            ))}
        </div>
    </div>
);

function Layout() {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/appointments" element={<AppointmentsPage />} />
                            <Route path="*" element={<div className="p-8 text-xl font-medium">Page Not Found</div>} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

