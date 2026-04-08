import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [noAuth, setNoAuth] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brandId = params.get('brand_id');
    const brandName = params.get('brand_name');
    const errorParam = params.get('error');

    if (errorParam) {
      setLoginError(decodeURIComponent(errorParam));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (brandId && brandName) {
      localStorage.setItem('brand_id', brandId);
      localStorage.setItem('brand_name', brandName);

      setTimeout(() => setStep1Done(true), 400);
      setTimeout(() => setStep2Done(true), 1000);
      setTimeout(() => { window.location.href = 'https://dashboard.clozet.my'; }, 2200);
      return;
    }

    setNoAuth(true);
    setTimeout(() => navigate('/login'), 2000);
  }, [navigate]);

  const error = loginError
    ? (lang === 'ko' ? `로그인 실패: ${loginError}` : `Login failed: ${loginError}`)
    : noAuth
    ? (lang === 'ko' ? '인증 정보가 없습니다.' : 'No authentication data found.')
    : null;

  const steps = [
    {
      label: step1Done
        ? (lang === 'ko' ? 'Instagram 계정 연결 완료' : 'Instagram account connected')
        : (lang === 'ko' ? 'Instagram 계정 연결 중...' : 'Connecting Instagram account...'),
      done: step1Done,
    },
    {
      label: step2Done
        ? (lang === 'ko' ? 'Webhook 구독 완료' : 'Webhook subscription complete')
        : (lang === 'ko' ? 'Webhook 구독 중...' : 'Subscribing to Webhook...'),
      done: step2Done,
    },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: '#0B0914',
      color: 'white',
    }}>
      {error ? (
        <p style={{ color: '#f87171', fontSize: '16px' }}>{error}</p>
      ) : (
        <>
          <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            {lang === 'ko' ? '연결 중...' : 'Connecting...'}
          </p>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
              {step.done ? (
                <span style={{ color: '#4ade80', fontSize: '18px', fontWeight: 'bold' }}>✓</span>
              ) : (
                <span style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #6b7280',
                  borderTop: '2px solid #a78bfa',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              <span style={{ color: step.done ? '#4ade80' : '#9ca3af' }}>{step.label}</span>
            </div>
          ))}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
