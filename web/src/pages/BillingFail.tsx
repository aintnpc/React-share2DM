import { useNavigate, useSearchParams } from 'react-router-dom';

export default function BillingFail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') ?? 'UNKNOWN';
  const message = searchParams.get('message') ?? '결제가 실패했습니다.';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%' }}>
        <p style={{ fontSize: '24px', marginBottom: '8px' }}>❌</p>
        <h2 style={{ margin: '0 0 8px 0' }}>결제 실패</h2>
        <p style={{ color: '#dc2626', marginBottom: '4px' }}>{message}</p>
        <p style={{ color: '#999', fontSize: '12px', marginBottom: '24px' }}>에러 코드: {code}</p>
        <button
          onClick={() => navigate('/pricing')}
          style={{ padding: '10px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          요금제 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}
