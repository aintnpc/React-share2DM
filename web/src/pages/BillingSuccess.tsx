import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const WORKERS_URL = process.env.REACT_APP_WORKERS_URL ?? 'https://share2dm-webhook.share2dm.workers.dev';

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const customerKey = searchParams.get('customerKey');
    const authKey = searchParams.get('authKey');
    const plan = searchParams.get('plan');
    const brandId = searchParams.get('brand_id');

    if (!customerKey || !authKey || !plan || !brandId) {
      setStatus('error');
      setErrorMsg('필수 파라미터가 누락되었습니다.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${WORKERS_URL}/billing/issue-billing-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerKey, authKey, plan, brandId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setErrorMsg(data.error ?? '빌링키 발급에 실패했습니다.');
          return;
        }

        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch {
        setStatus('error');
        setErrorMsg('서버 요청 중 오류가 발생했습니다.');
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%' }}>
        {status === 'loading' && (
          <>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</p>
            <h2 style={{ margin: '0 0 8px 0' }}>결제 처리 중...</h2>
            <p style={{ color: '#888' }}>잠시만 기다려주세요.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>✅</p>
            <h2 style={{ margin: '0 0 8px 0' }}>구독 완료!</h2>
            <p style={{ color: '#888' }}>대시보드로 이동합니다...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>❌</p>
            <h2 style={{ margin: '0 0 8px 0' }}>결제 실패</h2>
            <p style={{ color: '#dc2626', marginBottom: '16px' }}>{errorMsg}</p>
            <button
              onClick={() => navigate('/pricing')}
              style={{ padding: '10px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              요금제 페이지로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
