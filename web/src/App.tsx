import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import HomePage from './pages/Home';
import Pricing from './pages/Pricing';
import ServiceTerms from './pages/terms/ServiceTerms';
import PrivacyPolicy from './pages/terms/PrivacyPolicy';
import LandingLayout from './layouts/LandingLayout';

function App() {
  const isLoggedIn = !!localStorage.getItem('brand_id');

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing pages with Navbar + Footer */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<Pricing />} />
        </Route>

        {/* App pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* Terms */}
        <Route path="/terms/service" element={<ServiceTerms />} />
        <Route path="/terms/privacy" element={<PrivacyPolicy />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
