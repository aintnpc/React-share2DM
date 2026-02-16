import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PLAN_CONFIG, PlanName } from '../lib/plan-config';

const WORKERS_URL = process.env.REACT_APP_WORKERS_URL ?? 'https://share2dm-webhook.share2dm.workers.dev';
const CLOZET_BO_URL = process.env.REACT_APP_CLOZET_BO_URL ?? 'https://clozet.my/login';

interface Campaign {
  id: string;
  reel_url: string;
  ig_contents_id: string;
  response_message: string;
  product_url: string;
  product_url_source: 'manual' | 'clozet';
  clozet_content_id: string | null;
  clozet_short_code: string | null;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  totalShares: number;
  totalDMs: number;
  totalClicks: number;
}

interface ClozetContent {
  found: boolean;
  content_id?: string;
  short_code?: string;
  clozet_url?: string;
}

export default function Dashboard() {
  const brandId = localStorage.getItem('brand_id');
  const brandName = localStorage.getItem('brand_name') || 'My Brand';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ totalShares: 0, totalDMs: 0, totalClicks: 0 });
  const [brandPlan, setBrandPlan] = useState<PlanName>('free');
  const [dmUsage, setDmUsage] = useState({ used: 0, limit: 1000 });
  const [campaignUsage, setCampaignUsage] = useState({ used: 0, limit: 1 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reel_url: '', response_message: '', product_url: '' });

  // Clozet 연결 상태
  const [clozetStoreName, setClozetStoreName] = useState<string | null>(null);
  const [clozetConnecting, setClozetConnecting] = useState(false);

  // 캠페인 생성 중 Clozet 콘텐츠 조회 결과
  const [clozetContent, setClozetContent] = useState<ClozetContent | null>(null);
  const [clozetLookingUp, setClozetLookingUp] = useState(false);

  // Clozet 콜백 처리 (대시보드 진입 시 ?clozet_connected=true 파라미터 확인)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clozet_connected') === 'true') {
      const storeName = params.get('clozet_store');
      const state = params.get('state') ?? '';

      // sessionStorage에 저장한 nonce와 비교 (CSRF 방지)
      const savedState = sessionStorage.getItem('clozet_connect_state');
      if (savedState && savedState !== state) {
        console.warn('[Clozet] state mismatch — possible CSRF');
      } else {
        if (storeName) setClozetStoreName(decodeURIComponent(storeName));
      }
      sessionStorage.removeItem('clozet_connect_state');

      // URL에서 쿼리 파라미터 제거
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    const error = params.get('clozet_error');
    if (error) {
      alert(`Clozet 연결 실패: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadBrandInfo = useCallback(async () => {
    const { data } = await supabase
      .from('share2dm_brands')
      .select('plan, clozet_store_name, clozet_connected_at')
      .eq('id', brandId)
      .single();
    if (data) {
      setBrandPlan(data.plan as PlanName);
      setClozetStoreName(data.clozet_store_name ?? null);
    }
  }, [brandId]);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase
      .from('share2dm_campaigns')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });
    if (data) {
      setCampaigns(data);
      const limits = PLAN_CONFIG[brandPlan];
      setCampaignUsage({
        used: data.length,
        limit: limits.maxCampaigns === -1 ? Infinity : limits.maxCampaigns,
      });
    }
  }, [brandId, brandPlan]);

  const loadStats = useCallback(async () => {
    const { count: dmCount } = await supabase
      .from('share2dm_dm_logs')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId);

    const { count: clickCount } = await supabase
      .from('share2dm_dm_logs')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .not('link_clicked_at', 'is', null);

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: monthlyDmCount } = await supabase
      .from('share2dm_dm_logs')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .gte('dm_sent_at', startOfMonth.toISOString());

    setStats({
      totalShares: dmCount || 0,
      totalDMs: dmCount || 0,
      totalClicks: clickCount || 0,
    });

    const limits = PLAN_CONFIG[brandPlan];
    setDmUsage({
      used: monthlyDmCount || 0,
      limit: limits.dmPerMonth === -1 ? Infinity : limits.dmPerMonth,
    });
  }, [brandId, brandPlan]);

  useEffect(() => {
    if (!brandId) return;
    loadBrandInfo();
  }, [brandId, loadBrandInfo]);

  useEffect(() => {
    if (!brandId) return;
    loadCampaigns();
    loadStats();
  }, [brandId, brandPlan, loadCampaigns, loadStats]);

  // Clozet B.O 연결 시작
  const handleClozetConnect = () => {
    if (!brandId) return;
    setClozetConnecting(true);

    const nonce = crypto.randomUUID();
    sessionStorage.setItem('clozet_connect_state', nonce);

    const callbackUrl = `${WORKERS_URL}/auth/clozet/callback`;
    const params = new URLSearchParams({
      brand_id: brandId,
      state: nonce,
      callback: callbackUrl,
      origin: encodeURIComponent(window.location.origin),
    });

    window.location.href = `${CLOZET_BO_URL}/auth/share2dm-connect?${params}`;
  };

  // Clozet 연결 해제
  const handleClozetDisconnect = async () => {
    if (!window.confirm('Clozet 연결을 해제하시겠습니까?')) return;
    await supabase
      .from('share2dm_brands')
      .update({ clozet_seller_id: null, clozet_store_name: null, clozet_connected_at: null })
      .eq('id', brandId);
    setClozetStoreName(null);
  };

  const extractShortCode = (link: string): string => {
    const reelMatch = link.match(/\/reel\/([A-Za-z0-9_-]+)/);
    if (reelMatch) return reelMatch[1];
    const postMatch = link.match(/\/p\/([A-Za-z0-9_-]+)/);
    if (postMatch) return postMatch[1];
    return '';
  };

  // 릴스 URL 변경 시 Clozet 콘텐츠 자동 조회
  const handleReelUrlChange = async (reelUrl: string) => {
    setForm(prev => ({ ...prev, reel_url: reelUrl, product_url: '' }));
    setClozetContent(null);

    if (!clozetStoreName) return; // Clozet 미연결이면 스킵

    const shortCode = extractShortCode(reelUrl);
    if (!shortCode || shortCode.length < 5) return;

    setClozetLookingUp(true);
    try {
      const res = await fetch(
        `${WORKERS_URL}/clozet/contents?brand_id=${brandId}&ig_code=${shortCode}`
      );
      const data: ClozetContent = await res.json();
      setClozetContent(data);
      if (data.found && data.clozet_url) {
        setForm(prev => ({ ...prev, product_url: data.clozet_url! }));
      }
    } catch {
      // 조회 실패 시 무시 — 수동 입력으로 폴백
    } finally {
      setClozetLookingUp(false);
    }
  };

  const createCampaign = async () => {
    const limits = PLAN_CONFIG[brandPlan];
    if (limits.maxCampaigns !== -1 && campaigns.length >= limits.maxCampaigns) {
      alert(`현재 요금제(${brandPlan})에서는 캠페인을 ${limits.maxCampaigns}개까지만 만들 수 있습니다. 업그레이드해주세요.`);
      return;
    }

    const shortCode = extractShortCode(form.reel_url);
    if (!shortCode) {
      alert('올바른 릴스 또는 포스트 URL을 입력해주세요.');
      return;
    }

    let reelVideoId: string;
    try {
      const res = await fetch(
        `${WORKERS_URL}/media-id?brand_id=${brandId}&url=${encodeURIComponent(form.reel_url)}`
      );
      const data = await res.json() as { media_id?: string; error?: string };
      if (!data.media_id) {
        alert(`미디어 ID를 가져올 수 없습니다: ${data.error ?? '알 수 없는 오류'}`);
        return;
      }
      reelVideoId = data.media_id;
    } catch {
      alert('미디어 ID 조회 중 오류가 발생했습니다.');
      return;
    }

    const isFromClozet = clozetContent?.found && form.product_url === clozetContent.clozet_url;

    const { error } = await supabase.from('share2dm_campaigns').insert({
      reel_url: form.reel_url,
      ig_contents_id: reelVideoId,
      short_code: shortCode,
      response_message: form.response_message,
      product_url: form.product_url,
      product_url_source: isFromClozet ? 'clozet' : 'manual',
      clozet_content_id: isFromClozet ? (clozetContent?.content_id ?? null) : null,
      clozet_short_code: isFromClozet ? (clozetContent?.short_code ?? null) : null,
      brand_id: brandId,
    });

    if (error) {
      console.error('[Campaign] insert error:', error);
      alert(`캠페인 생성 실패: ${error.message}`);
      return;
    }

    setForm({ reel_url: '', response_message: '', product_url: '' });
    setClozetContent(null);
    setShowForm(false);
    loadCampaigns();
  };

  const toggleCampaign = async (id: string, isActive: boolean) => {
    await supabase
      .from('share2dm_campaigns')
      .update({ is_active: !isActive })
      .eq('id', id);
    loadCampaigns();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>share2dm</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', backgroundColor: '#E1306C', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          + 캠페인 생성
        </button>
      </header>

      {/* Plan & Usage */}
      <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{brandName}</span>
            <PlanBadge plan={brandPlan} />
          </div>
          <a href="/pricing" style={{ color: '#E1306C', textDecoration: 'none', fontSize: '14px' }}>
            요금제 변경 →
          </a>
        </div>
        <UsageBar label="이번 달 DM 발송" used={dmUsage.used} limit={dmUsage.limit} />
        <UsageBar label="캠페인" used={campaignUsage.used} limit={campaignUsage.limit} style={{ marginTop: '12px' }} />

        {/* 연결된 플랫폼 */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#888', fontWeight: '600' }}>연결된 플랫폼</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#444' }}>✅ Instagram</span>

            {clozetStoreName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#444' }}>
                  🔗 Clozet — <strong>{clozetStoreName}</strong>
                </span>
                <button
                  onClick={handleClozetDisconnect}
                  style={{ fontSize: '11px', color: '#999', background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
                >
                  연결 해제
                </button>
              </div>
            ) : (
              <button
                onClick={handleClozetConnect}
                disabled={clozetConnecting}
                style={{
                  fontSize: '13px', padding: '5px 14px',
                  backgroundColor: clozetConnecting ? '#ccc' : '#1a1a2e',
                  color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
                }}
              >
                {clozetConnecting ? '연결 중...' : '🔗 Clozet 연결하기'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
        <StatCard label="총 공유 수" value={stats.totalShares} />
        <StatCard label="DM 발송 수" value={stats.totalDMs} />
        <StatCard label="링크 클릭 수" value={stats.totalClicks} />
      </div>

      {/* Campaign Form */}
      {showForm && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <h3>새 캠페인</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <input
                placeholder="릴스 URL (https://instagram.com/reel/...)"
                value={form.reel_url}
                onChange={(e) => handleReelUrlChange(e.target.value)}
                style={inputStyle}
              />
              {/* Clozet 조회 상태 표시 */}
              {clozetStoreName && (
                <div style={{ marginTop: '6px', fontSize: '12px' }}>
                  {clozetLookingUp && (
                    <span style={{ color: '#888' }}>🔍 Clozet에서 콘텐츠 조회 중...</span>
                  )}
                  {!clozetLookingUp && clozetContent?.found && (
                    <span style={{ color: '#16a34a' }}>
                      ✅ Clozet 콘텐츠 발견! — app.clozet.my/reel/{clozetContent.short_code}
                    </span>
                  )}
                  {!clozetLookingUp && clozetContent && !clozetContent.found && (
                    <span style={{ color: '#dc2626' }}>
                      ❌ Clozet에 등록되지 않은 릴스입니다. 제품 링크를 직접 입력해주세요.
                    </span>
                  )}
                </div>
              )}
            </div>

            <textarea
              placeholder="자동 DM 메시지 (예: 안녕하세요! 요청하신 제품 링크 보내드려요)"
              value={form.response_message}
              onChange={(e) => setForm({ ...form, response_message: e.target.value })}
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
            />

            <div>
              <input
                placeholder="제품 URL (https://your-store.com/product)"
                value={form.product_url}
                onChange={(e) => setForm({ ...form, product_url: e.target.value })}
                style={{
                  ...inputStyle,
                  backgroundColor: clozetContent?.found ? '#f0fdf4' : 'white',
                  color: clozetContent?.found ? '#15803d' : '#333',
                }}
                readOnly={clozetContent?.found === true}
              />
              {clozetContent?.found && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#16a34a' }}>
                  🔒 Clozet 릴스 페이지로 자동 설정됨
                </p>
              )}
            </div>

            <button onClick={createCampaign} style={{ padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              생성하기
            </button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div>
        <h2>캠페인 목록</h2>
        {campaigns.length === 0 ? (
          <p style={{ color: '#888' }}>아직 캠페인이 없습니다. 첫 캠페인을 만들어보세요!</p>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{c.reel_url}</p>
                  <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px' }}>{c.response_message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ color: '#888', margin: 0, fontSize: '12px' }}>{c.product_url}</p>
                    {c.product_url_source === 'clozet' && (
                      <span style={{ fontSize: '11px', padding: '1px 6px', backgroundColor: '#1a1a2e', color: 'white', borderRadius: '4px' }}>
                        Clozet
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleCampaign(c.id, c.is_active)}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: c.is_active ? '#4CAF50' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {c.is_active ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: PlanName }) {
  const colors: Record<PlanName, { bg: string; text: string }> = {
    free:     { bg: '#f0f0f0', text: '#666' },
    standard: { bg: '#EDE9FE', text: '#7C3AED' },
    growth:   { bg: '#DBEAFE', text: '#2563EB' },
    pro:      { bg: '#FEF3C7', text: '#D97706' },
  };
  const labels: Record<PlanName, string> = {
    free: '🌱 Free',
    standard: '🚀 Standard',
    growth: '📈 Growth',
    pro: '👑 Pro',
  };
  const c = colors[plan];
  return (
    <span style={{
      padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
      fontWeight: 'bold', backgroundColor: c.bg, color: c.text,
    }}>
      {labels[plan]}
    </span>
  );
}

function UsageBar({ label, used, limit, style }: {
  label: string; used: number; limit: number; style?: React.CSSProperties;
}) {
  const isUnlimited = !isFinite(limit);
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = pct >= 80;
  const barColor = isNearLimit ? '#EF4444' : '#7C3AED';

  return (
    <div style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
        <span style={{ color: '#666' }}>{label}</span>
        <span style={{ fontWeight: 'bold' }}>
          {used.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: isUnlimited ? '0%' : `${pct}%`,
          height: '100%',
          backgroundColor: barColor,
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 8px 0', color: '#888', fontSize: '14px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{value.toLocaleString()}</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
};
