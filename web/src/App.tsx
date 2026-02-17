import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LangProvider } from './lib/i18n';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import HomePage from './pages/Home';
import Pricing from './pages/Pricing';
import BillingSuccess from './pages/BillingSuccess';
import BillingFail from './pages/BillingFail';
import ServiceTerms from './pages/terms/ServiceTerms';
import PrivacyPolicy from './pages/terms/PrivacyPolicy';
import LandingLayout from './layouts/LandingLayout';

function App() {
  const isLoggedIn = !!localStorage.getItem('brand_id');

  return (
    <LangProvider>
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
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="/billing/fail" element={<BillingFail />} />
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
    </LangProvider>
  );
}

export default App;
