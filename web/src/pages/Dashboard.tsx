import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PLAN_CONFIG, PlanName } from '../lib/plan-config';

const WORKERS_URL = process.env.REACT_APP_WORKERS_URL ?? 'https://share2dm-webhook.share2dm.workers.dev';
const CLOZET_BO_URL = process.env.REACT_APP_CLOZET_BO_URL ?? 'https://clozet.my';

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
  campaign_type: 'reel_share' | 'comment_automation';
  trigger_keywords: string[];
  comment_reply_message: string | null;
}

interface CampaignStats {
  shares: number; // dm_logs count (= shares that triggered DM)
  dmsSent: number; // dm_logs count (same as shares for now)
  clicks: number; // link_clicked_at IS NOT NULL count
  queuePending: number;
  queueSending: number;
  queueTotal: number; // pending + sending + sent + failed
  commentCount: number; // comment_automation: 댓글 감지 수
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
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [brandPlan, setBrandPlan] = useState<PlanName>('free');
  const [dmUsage, setDmUsage] = useState({ used: 0, limit: 1000 });
  const [campaignUsage, setCampaignUsage] = useState({ used: 0, limit: 1 });
  const [showForm, setShowForm] = useState(false);
  const [campaignType, setCampaignType] = useState<'reel_share' | 'comment_automation'>('reel_share');
  const [form, setForm] = useState({
    reel_url: '',
    response_message: '',
    product_url: '',
    trigger_keywords: '',
    comment_reply_message: '',
  });

  const [billingCardLast4, setBillingCardLast4] = useState<string | null>(null);
  const [clozetStoreName, setClozetStoreName] = useState<string | null>(null);
  const [clozetConnecting, setClozetConnecting] = useState(false);
  const [clozetContent, setClozetContent] = useState<ClozetContent | null>(null);
  const [clozetLookingUp, setClozetLookingUp] = useState(false);

  // Clozet 콜백 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clozet_connected') === 'true') {
      const storeName = params.get('clozet_store');
      const state = params.get('state') ?? '';
      const savedState = sessionStorage.getItem('clozet_connect_state');
      if (savedState && savedState !== state) {
        console.warn('[Clozet] state mismatch — possible CSRF');
      } else {
        if (storeName) setClozetStoreName(decodeURIComponent(storeName));
      }
      sessionStorage.removeItem('clozet_connect_state');
      window.history.replaceState({}, '', window.location.pathname);
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
      .select('plan, clozet_store_name, clozet_connected_at, billing_card_last4')
      .eq('id', brandId)
      .single();
    if (data) {
      setBrandPlan(data.plan as PlanName);
      setClozetStoreName(data.clozet_store_name ?? null);
      setBillingCardLast4(data.billing_card_last4 ?? null);
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

  const loadCampaignStats = useCallback(async () => {
    if (!campaigns.length) {
      setCampaignStats({});
      return;
    }

    const stats: Record<string, CampaignStats> = {};

    for (const c of campaigns) {
      // DM logs = shares (each unique share triggers a DM log)
      const { count: dmCount } = await supabase
        .from('share2dm_dm_logs')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', c.id);

      // Clicks
      const { count: clickCount } = await supabase
        .from('share2dm_dm_logs')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', c.id)
        .not('link_clicked_at', 'is', null);

      // Comment Automation: 댓글 감지 수
      let commentCount = 0;
      if (c.campaign_type === 'comment_automation') {
        const { count } = await supabase
          .from('share2dm_comment_logs')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', c.id);
        commentCount = count ?? 0;
      }

      // Queue status
      let queuePending = 0;
      let queueSending = 0;
      let queueTotal = 0;
      try {
        const res = await fetch(
          `${WORKERS_URL}/queue/status?brand_id=${brandId}&campaign_id=${c.id}`
        );
        const qData = await res.json() as any;
        queuePending = qData.queue?.pending ?? 0;
        queueSending = qData.queue?.sending ?? 0;
        queueTotal = qData.total ?? 0;
      } catch {
        // ignore
      }

      const isComment = c.campaign_type === 'comment_automation';
      stats[c.id] = {
        shares: isComment ? commentCount : (dmCount ?? 0) + queuePending + queueSending,
        dmsSent: dmCount ?? 0,
        clicks: clickCount ?? 0,
        queuePending,
        queueSending,
        queueTotal,
        commentCount,
      };
    }

    setCampaignStats(stats);
  }, [campaigns, brandId]);

  const loadDmUsage = useCallback(async () => {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: monthlyDmCount } = await supabase
      .from('share2dm_dm_logs')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .gte('dm_sent_at', startOfMonth.toISOString());

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
    loadDmUsage();
  }, [brandId, brandPlan, loadCampaigns, loadDmUsage]);

  useEffect(() => {
    loadCampaignStats();
  }, [campaigns, loadCampaignStats]);

  // Refresh queue status every 10 seconds when there are pending items
  useEffect(() => {
    const hasPending = Object.values(campaignStats).some(
      (s) => s.queuePending > 0 || s.queueSending > 0
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      loadCampaignStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [campaignStats, loadCampaignStats]);

  // Aggregate stats across all campaigns
  const totalStats = Object.values(campaignStats).reduce(
    (acc, s) => ({
      shares: acc.shares + s.shares,
      dmsSent: acc.dmsSent + s.dmsSent,
      clicks: acc.clicks + s.clicks,
    }),
    { shares: 0, dmsSent: 0, clicks: 0 }
  );

  // Clozet
  const handleClozetConnect = () => {
    if (!brandId) return;
    setClozetConnecting(true);
    const nonce = crypto.randomUUID();
    sessionStorage.setItem('clozet_connect_state', nonce);
    const params = new URLSearchParams({
      brand_id: brandId,
      state: nonce,
      callback: `${WORKERS_URL}/auth/clozet/callback`,
      origin: encodeURIComponent(window.location.origin),
    });
    window.location.href = `${CLOZET_BO_URL}/auth/share2dm-connect?${params}`;
  };

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

  const handleReelUrlChange = async (reelUrl: string) => {
    setForm(prev => ({ ...prev, reel_url: reelUrl, product_url: '' }));
    setClozetContent(null);
    if (!clozetStoreName) return;
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
      // 조회 실패 시 무시
    } finally {
      setClozetLookingUp(false);
    }
  };

  const resetForm = () => {
    setForm({ reel_url: '', response_message: '', product_url: '', trigger_keywords: '', comment_reply_message: '' });
    setClozetContent(null);
    setShowForm(false);
  };

  const createCampaign = async () => {
    const limits = PLAN_CONFIG[brandPlan];
    if (limits.maxCampaigns !== -1 && campaigns.length >= limits.maxCampaigns) {
      alert(`현재 요금제(${brandPlan})에서는 캠페인을 ${limits.maxCampaigns}개까지만 만들 수 있습니다. 업그레이드해주세요.`);
      return;
    }

    const postUrl = form.reel_url;
    const shortCode = extractShortCode(postUrl);
    if (!shortCode) {
      alert('올바른 릴스 또는 포스트 URL을 입력해주세요.');
      return;
    }

    let mediaId: string;
    try {
      const res = await fetch(
        `${WORKERS_URL}/media-id?brand_id=${brandId}&url=${encodeURIComponent(postUrl)}`
      );
      const data = await res.json() as { media_id?: string; error?: string };
      if (!data.media_id) {
        alert(`미디어 ID를 가져올 수 없습니다: ${data.error ?? '알 수 없는 오류'}`);
        return;
      }
      mediaId = data.media_id;
    } catch {
      alert('미디어 ID 조회 중 오류가 발생했습니다.');
      return;
    }

    if (campaignType === 'comment_automation') {
      const keywords = form.trigger_keywords.split(',').map((k) => k.trim()).filter(Boolean);
      if (keywords.length === 0) {
        alert('트리거 키워드를 최소 1개 이상 입력해주세요.');
        return;
      }
      const { error } = await supabase.from('share2dm_campaigns').insert({
        brand_id: brandId,
        campaign_type: 'comment_automation',
        reel_url: postUrl,
        ig_contents_id: mediaId,
        short_code: shortCode,
        response_message: form.response_message,
        product_url: form.product_url,
        product_url_source: 'manual',
        trigger_keywords: keywords,
        comment_reply_message: form.comment_reply_message || null,
      });
      if (error) {
        console.error('[Campaign] insert error:', error);
        alert(`캠페인 생성 실패: ${error.message}`);
        return;
      }
    } else {
      const isFromClozet = clozetContent?.found && form.product_url === clozetContent.clozet_url;
      const { error } = await supabase.from('share2dm_campaigns').insert({
        brand_id: brandId,
        campaign_type: 'reel_share',
        reel_url: postUrl,
        ig_contents_id: mediaId,
        short_code: shortCode,
        response_message: form.response_message,
        product_url: form.product_url,
        product_url_source: isFromClozet ? 'clozet' : 'manual',
        clozet_content_id: isFromClozet ? (clozetContent?.content_id ?? null) : null,
        clozet_short_code: isFromClozet ? (clozetContent?.short_code ?? null) : null,
      });
      if (error) {
        console.error('[Campaign] insert error:', error);
        alert(`캠페인 생성 실패: ${error.message}`);
        return;
      }
    }

    resetForm();
    loadCampaigns();
  };

  const toggleCampaign = async (id: string, isActive: boolean) => {
    await supabase
      .from('share2dm_campaigns')
      .update({ is_active: !isActive })
      .eq('id', id);
    loadCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!window.confirm('캠페인을 삭제하시겠습니까? DM 발송 기록도 함께 삭제됩니다.')) return;
    await supabase.from('share2dm_comment_logs').delete().eq('campaign_id', id);
    await supabase.from('share2dm_dm_logs').delete().eq('campaign_id', id);
    await supabase.from('share2dm_dm_queue').delete().eq('campaign_id', id);
    await supabase.from('share2dm_campaigns').delete().eq('id', id);
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
            {billingCardLast4 && (
              <span style={{ fontSize: '12px', color: '#888', padding: '3px 8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                **** {billingCardLast4}
              </span>
            )}
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
            <span style={{ fontSize: '13px', color: '#444' }}>Instagram</span>
            {clozetStoreName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#444' }}>
                  Clozet — <strong>{clozetStoreName}</strong>
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
                {clozetConnecting ? '연결 중...' : 'Clozet 연결하기'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
        <StatCard label="총 공유 수" value={totalStats.shares} />
        <StatCard label="DM 발송 수" value={totalStats.dmsSent} />
        <StatCard label="링크 클릭 수" value={totalStats.clicks} />
      </div>

      {/* Campaign Form */}
      {showForm && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>새 캠페인</h3>

          {/* 캠페인 타입 탭 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              onClick={() => setCampaignType('reel_share')}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                backgroundColor: campaignType === 'reel_share' ? '#E1306C' : '#f0f0f0',
                color: campaignType === 'reel_share' ? 'white' : '#666',
              }}
            >
              릴스 공유 DM
            </button>
            <button
              onClick={() => setCampaignType('comment_automation')}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                backgroundColor: campaignType === 'comment_automation' ? '#7C3AED' : '#f0f0f0',
                color: campaignType === 'comment_automation' ? 'white' : '#666',
              }}
            >
              댓글 자동화
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 공통: 게시물/릴스 URL */}
            <div>
              <input
                placeholder={campaignType === 'comment_automation'
                  ? '게시물 URL (https://instagram.com/p/... 또는 /reel/...)'
                  : '릴스 URL (https://instagram.com/reel/...)'}
                value={form.reel_url}
                onChange={(e) => handleReelUrlChange(e.target.value)}
                style={inputStyle}
              />
              {campaignType === 'reel_share' && clozetStoreName && (
                <div style={{ marginTop: '6px', fontSize: '12px' }}>
                  {clozetLookingUp && <span style={{ color: '#888' }}>Clozet에서 콘텐츠 조회 중...</span>}
                  {!clozetLookingUp && clozetContent?.found && (
                    <span style={{ color: '#16a34a' }}>Clozet 콘텐츠 발견! — app.clozet.my/reel/{clozetContent.short_code}</span>
                  )}
                  {!clozetLookingUp && clozetContent && !clozetContent.found && (
                    <span style={{ color: '#dc2626' }}>Clozet에 등록되지 않은 릴스입니다. 제품 링크를 직접 입력해주세요.</span>
                  )}
                </div>
              )}
            </div>

            {/* 댓글 자동화 전용 필드 */}
            {campaignType === 'comment_automation' && (
              <>
                <div>
                  <input
                    placeholder="트리거 키워드 (콤마로 구분, 예: 링크, LINK, 정보)"
                    value={form.trigger_keywords}
                    onChange={(e) => setForm({ ...form, trigger_keywords: e.target.value })}
                    style={inputStyle}
                  />
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>
                    댓글에 이 키워드가 포함되면 자동으로 DM과 답글이 발송됩니다.
                  </p>
                </div>
                <textarea
                  placeholder="공개 댓글 답글 (예: DM으로 링크 보내드렸어요! 확인해보세요 😊)"
                  value={form.comment_reply_message}
                  onChange={(e) => setForm({ ...form, comment_reply_message: e.target.value })}
                  style={{ ...inputStyle, height: '70px', resize: 'vertical' }}
                />
              </>
            )}

            {/* 공통: DM 메시지 */}
            <textarea
              placeholder="자동 DM 메시지 (예: 안녕하세요! 요청하신 제품 링크 보내드려요)"
              value={form.response_message}
              onChange={(e) => setForm({ ...form, response_message: e.target.value })}
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
            />

            {/* 공통: 제품 URL */}
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
                readOnly={campaignType === 'reel_share' && clozetContent?.found === true}
              />
              {campaignType === 'reel_share' && clozetContent?.found && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#16a34a' }}>Clozet 릴스 페이지로 자동 설정됨</p>
              )}
            </div>

            <button
              onClick={createCampaign}
              style={{
                padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white',
                backgroundColor: campaignType === 'comment_automation' ? '#7C3AED' : '#333',
              }}
            >
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
          campaigns.map((c) => {
            const cs = campaignStats[c.id];
            const hasQueue = cs && (cs.queuePending > 0 || cs.queueSending > 0);

            return (
              <div
                key={c.id}
                style={{
                  border: `1px solid ${c.campaign_type === 'comment_automation' ? '#ede9fe' : '#eee'}`,
                  borderRadius: '8px', padding: '16px', marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {/* 캠페인 타입 배지 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold',
                        backgroundColor: c.campaign_type === 'comment_automation' ? '#EDE9FE' : '#FFF0F5',
                        color: c.campaign_type === 'comment_automation' ? '#7C3AED' : '#E1306C',
                      }}>
                        {c.campaign_type === 'comment_automation' ? '댓글 자동화' : '릴스 공유 DM'}
                      </span>
                      {c.product_url_source === 'clozet' && (
                        <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#1a1a2e', color: 'white', borderRadius: '4px' }}>
                          Clozet
                        </span>
                      )}
                    </div>

                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }}>{c.reel_url}</p>

                    {/* 댓글 자동화 전용: 키워드 표시 */}
                    {c.campaign_type === 'comment_automation' && c.trigger_keywords?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '4px 0' }}>
                        {c.trigger_keywords.map((kw) => (
                          <span key={kw} style={{
                            fontSize: '11px', padding: '2px 8px', backgroundColor: '#f3f4f6',
                            color: '#374151', borderRadius: '4px', border: '1px solid #e5e7eb',
                          }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 댓글 자동화 전용: 댓글 답글 내용 */}
                    {c.campaign_type === 'comment_automation' && c.comment_reply_message && (
                      <p style={{ color: '#7C3AED', margin: '2px 0 4px 0', fontSize: '13px' }}>
                        답글: {c.comment_reply_message}
                      </p>
                    )}

                    <p style={{ color: '#666', margin: '0 0 2px 0', fontSize: '13px' }}>{c.response_message}</p>
                    <p style={{ color: '#888', margin: 0, fontSize: '12px' }}>{c.product_url}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                    <button
                      onClick={() => toggleCampaign(c.id, c.is_active)}
                      style={{
                        padding: '6px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                        backgroundColor: c.is_active ? '#4CAF50' : '#ccc', color: 'white',
                      }}
                    >
                      {c.is_active ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      style={{
                        padding: '6px 10px', backgroundColor: 'white', color: '#999',
                        border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* Per-campaign stats */}
                {cs && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                    {c.campaign_type === 'comment_automation' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <MiniStat label="댓글 감지" value={cs.commentCount} />
                        <MiniStat label="DM 발송" value={cs.dmsSent} />
                        <MiniStat label="링크 클릭" value={cs.clicks} />
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <MiniStat label="공유 수" value={cs.shares} />
                        <MiniStat label="DM 발송" value={cs.dmsSent} />
                        <MiniStat label="링크 클릭" value={cs.clicks} />
                      </div>
                    )}

                    {/* Queue progress bar */}
                    {hasQueue && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          <span>발송 진행 중</span>
                          <span style={{ fontWeight: 'bold' }}>
                            {cs.dmsSent} / {c.campaign_type === 'comment_automation' ? cs.commentCount : cs.shares}
                          </span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: (() => {
                                const total = c.campaign_type === 'comment_automation' ? cs.commentCount : cs.shares;
                                return total > 0 ? `${(cs.dmsSent / total) * 100}%` : '0%';
                              })(),
                              height: '100%',
                              backgroundColor: '#7C3AED',
                              borderRadius: '3px',
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>
                          대기 {cs.queuePending}건 | 발송 중 {cs.queueSending}건
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
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
    free: 'Free',
    standard: 'Standard',
    growth: 'Growth',
    pro: 'Pro',
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#888' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{value.toLocaleString()}</p>
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
