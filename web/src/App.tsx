import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LangProvider } from './lib/i18n';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import HomePage from './pages/Home';
import ClozetConnect from './pages/ClozetConnect';
import BillingSuccess from './pages/BillingSuccess';
import BillingFail from './pages/BillingFail';
import ServiceTerms from './pages/terms/ServiceTerms';
import PrivacyPolicy from './pages/terms/PrivacyPolicy';
import DataDeletion from './pages/terms/DataDeletion';
import Admin from './pages/Admin';
import LandingLayout from './layouts/LandingLayout';

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => { window.location.href = to; }, [to]);
  return null;
}

function App() {
  return (
    <LangProvider>
    <BrowserRouter>
      <Routes>
        {/* Landing pages with Navbar + Footer */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<Navigate to="/" />} />
          <Route path="/clozet-connect" element={<ClozetConnect />} />
        </Route>

        {/* App pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="/billing/fail" element={<BillingFail />} />
        <Route
          path="/dashboard"
          element={<ExternalRedirect to="https://dashboard.clozet.my" />}
        />

        {/* Admin */}
        <Route path="/admin" element={<Admin />} />

        {/* Terms */}
        <Route path="/terms/service" element={<ServiceTerms />} />
        <Route path="/terms/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy/data-deletion" element={<DataDeletion />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </LangProvider>
  );
}

export default App;
