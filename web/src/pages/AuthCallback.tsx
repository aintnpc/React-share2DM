import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Step {
  label: string;
  done: boolean;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Instagram 계정 연결 중...', done: false },
    { label: 'Webhook 구독 중...', done: false },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brandId = params.get('brand_id');
    const brandName = params.get('brand_name');
    const errorParam = params.get('error');
    const webhookSubscribed = params.get('webhook_subscribed');

    if (errorParam) {
      setError(`로그인 실패: ${decodeURIComponent(errorParam)}`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (brandId && brandName) {
      localStorage.setItem('brand_id', brandId);
      localStorage.setItem('brand_name', brandName);

      // Step 1: Instagram 연결 완료
      setTimeout(() => {
        setSteps(prev => [
          { ...prev[0], label: 'Instagram 계정 연결 완료', done: true },
          prev[1],
        ]);
      }, 400);

      // Step 2: Webhook 구독 완료
      setTimeout(() => {
        setSteps(prev => [
          prev[0],
          {
            label: webhookSubscribed === 'true' ? 'Webhook 구독 완료' : 'Webhook 구독 완료',
            done: true,
          },
        ]);
      }, 1000);

      // Redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2200);
      return;
    }

    setError('인증 정보가 없습니다.');
    setTimeout(() => navigate('/login'), 2000);
  }, [navigate]);

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
          <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>연결 중...</p>
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
