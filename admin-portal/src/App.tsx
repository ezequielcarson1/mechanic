import React from 'react';
import { Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import AppointmentsPage from './pages/Appointments';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UsersPage from './pages/Users';

function Layout() {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
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

