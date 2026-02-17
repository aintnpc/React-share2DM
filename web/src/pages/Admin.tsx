import React, { useCallback, useEffect, useState } from 'react';
import { PLAN_CONFIG, PlanName } from '../lib/plan-config';

const WORKERS_URL = process.env.REACT_APP_WORKERS_URL ?? 'https://share2dm-webhook.share2dm.workers.dev';
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD ?? 'share2dm-admin';

interface BrandStat {
  id: string;
  brand_name: string;
  ig_account_id: string;
  plan: PlanName;
  created_at: string;
  monthly_dms: number;
  monthly_clicks: number;
  queue_pending: number;
  queue_failed: number;
}

interface AdminData {
  overview: {
    total_brands: number;
    total_dms: number;
    today_dms: number;
    total_clicks: number;
    queue: {
      pending: number;
      sending: number;
      sent: number;
      failed: number;
    };
  };
  brands: BrandStat[];
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already authenticated in this session
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${WORKERS_URL}/admin/stats`);
      const json = await res.json();
      setData(json as AdminData);
    } catch (e) {
      console.error('[Admin] Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [authenticated, loadData]);

  if (!authenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Share2DM Admin</h1>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '12px', border: '1px solid #ddd',
              borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box',
              marginBottom: '12px',
            }}
          />
          {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: '0 0 12px 0' }}>{error}</p>}
          <button
            onClick={handleLogin}
            style={{
              width: '100%', padding: '12px', backgroundColor: '#333',
              color: 'white', border: 'none', borderRadius: '6px',
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
        <h1>Share2DM Admin</h1>
        <p style={{ color: '#888' }}>로딩 중...</p>
      </div>
    );
  }

  if (!data) return null;

  const { overview, brands } = data;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Share2DM Admin</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading && <span style={{ fontSize: '12px', color: '#888' }}>새로고침 중...</span>}
          <button
            onClick={loadData}
            style={{
              padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none',
              borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            새로고침
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthenticated(false); }}
            style={{
              padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ddd',
              borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#666',
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
        <OverviewCard label="총 브랜드" value={overview.total_brands} />
        <OverviewCard label="총 DM 발송" value={overview.total_dms} />
        <OverviewCard label="오늘 DM" value={overview.today_dms} color="#7C3AED" />
        <OverviewCard label="총 클릭" value={overview.total_clicks} />
      </div>

      {/* Queue Status */}
      <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 16px 0' }}>DM 큐 상태</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <QueueCard label="대기 중" value={overview.queue.pending} color="#F59E0B" />
          <QueueCard label="발송 중" value={overview.queue.sending} color="#3B82F6" />
          <QueueCard label="완료" value={overview.queue.sent} color="#10B981" />
          <QueueCard label="실패" value={overview.queue.failed} color="#EF4444" />
        </div>
      </div>

      {/* Brands Table */}
      <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
        <h3 style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
          브랜드 목록 ({brands.length})
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', textAlign: 'left' }}>
              <th style={thStyle}>브랜드</th>
              <th style={thStyle}>Plan</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>이번달 DM</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>한도</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>클릭</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>큐 대기</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>큐 실패</th>
              <th style={thStyle}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => {
              const planConfig = PLAN_CONFIG[b.plan];
              const usagePct = planConfig.dmPerMonth === -1
                ? 0
                : Math.round((b.monthly_dms / planConfig.dmPerMonth) * 100);

              return (
                <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={tdStyle}>
                    <div>
                      <strong>{b.brand_name}</strong>
                      <br />
                      <span style={{ fontSize: '11px', color: '#888' }}>{b.ig_account_id}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                      backgroundColor: b.plan === 'pro' ? '#FEF3C7' : b.plan === 'growth' ? '#DBEAFE' : b.plan === 'standard' ? '#EDE9FE' : '#f0f0f0',
                      color: b.plan === 'pro' ? '#D97706' : b.plan === 'growth' ? '#2563EB' : b.plan === 'standard' ? '#7C3AED' : '#666',
                    }}>
                      {b.plan}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {b.monthly_dms.toLocaleString()}
                    {usagePct > 0 && (
                      <span style={{
                        marginLeft: '6px', fontSize: '11px',
                        color: usagePct >= 80 ? '#EF4444' : '#888',
                      }}>
                        ({usagePct}%)
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#888' }}>
                    {planConfig.dmPerMonth === -1 ? '∞' : planConfig.dmPerMonth.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {b.monthly_clicks.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {b.queue_pending > 0 ? (
                      <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>{b.queue_pending}</span>
                    ) : (
                      <span style={{ color: '#ccc' }}>0</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {b.queue_failed > 0 ? (
                      <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{b.queue_failed}</span>
                    ) : (
                      <span style={{ color: '#ccc' }}>0</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: '#888', fontSize: '12px' }}>
                    {new Date(b.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 8px 0', color: '#888', fontSize: '13px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: color ?? '#333' }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function QueueCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px' }}>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        backgroundColor: color, display: 'inline-block', marginRight: '6px',
      }} />
      <span style={{ fontSize: '13px', color: '#666' }}>{label}</span>
      <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '12px',
  color: '#666',
  fontWeight: '600',
  borderBottom: '1px solid #eee',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
};
