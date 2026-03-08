import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PLAN_CONFIG, PlanName } from '../lib/plan-config';
import { useLang } from '../lib/i18n';

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

interface MediaItem {
  id: string;
  shortcode: string;
  media_type: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp: string;
  permalink: string;
}

export default function Dashboard() {
  const { lang, t } = useLang();
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
      alert(`${localStorage.getItem('lang') === 'en' ? 'Clozet connection failed' : 'Clozet 연결 실패'}: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const [igAccountId, setIgAccountId] = useState<string | null>(null);
  const [igUsername, setIgUsername] = useState<string | null>(null);
  const [reelLookup, setReelLookup] = useState<{ loading: boolean; mediaId: string | null; error: string | null }>({ loading: false, mediaId: null, error: null });

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaListLoading, setMediaListLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const loadMediaList = async () => {
    setShowMediaPicker(true);
    if (mediaList.length > 0) return; // 이미 로드된 경우 재사용
    setMediaListLoading(true);
    try {
      const res = await fetch(`${WORKERS_URL}/media-list?brand_id=${brandId}`);
      const data = await res.json() as { media?: MediaItem[]; error?: string };
      if (data.media) setMediaList(data.media);
    } catch {
      // ignore
    } finally {
      setMediaListLoading(false);
    }
  };

  const selectMedia = (item: MediaItem) => {
    handleReelUrlChange(item.permalink);
    setShowMediaPicker(false);
  };

  const loadBrandInfo = useCallback(async () => {
    const { data } = await supabase
      .from('share2dm_brands')
      .select('plan, clozet_store_name, clozet_connected_at, billing_card_last4, ig_account_id, ig_username')
      .eq('id', brandId)
      .single();
    if (data) {
      setBrandPlan(data.plan as PlanName);
      setClozetStoreName(data.clozet_store_name ?? null);
      setBillingCardLast4(data.billing_card_last4 ?? null);
      setIgAccountId(data.ig_account_id ?? null);
      setIgUsername(data.ig_username ?? null);
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
    if (!window.confirm(lang === 'ko' ? 'Clozet 연결을 해제하시겠습니까?' : 'Disconnect Clozet?')) return;
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
    setReelLookup({ loading: false, mediaId: null, error: null });

    const shortCode = extractShortCode(reelUrl);
    if (!shortCode || shortCode.length < 5) return;

    // Fetch media ID to verify the reel exists on this IG account
    setReelLookup({ loading: true, mediaId: null, error: null });
    try {
      const res = await fetch(
        `${WORKERS_URL}/media-id?brand_id=${brandId}&url=${encodeURIComponent(reelUrl)}`
      );
      const data = await res.json() as { media_id?: string; error?: string };
      if (data.media_id) {
        setReelLookup({ loading: false, mediaId: data.media_id, error: null });
      } else {
        setReelLookup({ loading: false, mediaId: null, error: data.error ?? 'Reel not found' });
      }
    } catch {
      setReelLookup({ loading: false, mediaId: null, error: 'Lookup failed' });
    }

    if (!clozetStoreName) return;
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
      alert(lang === 'ko'
        ? `현재 요금제(${brandPlan})에서는 캠페인을 ${limits.maxCampaigns}개까지만 만들 수 있습니다. 업그레이드해주세요.`
        : `Your current plan (${brandPlan}) allows up to ${limits.maxCampaigns} campaigns. Please upgrade.`);
      return;
    }

    const postUrl = form.reel_url;
    const shortCode = extractShortCode(postUrl);
    if (!shortCode) {
      alert(lang === 'ko' ? '올바른 릴스 또는 포스트 URL을 입력해주세요.' : 'Please enter a valid Reel or post URL.');
      return;
    }

    let mediaId: string;
    try {
      const res = await fetch(
        `${WORKERS_URL}/media-id?brand_id=${brandId}&url=${encodeURIComponent(postUrl)}`
      );
      const data = await res.json() as { media_id?: string; error?: string };
      if (!data.media_id) {
        alert(lang === 'ko' ? `미디어 ID를 가져올 수 없습니다: ${data.error ?? '알 수 없는 오류'}` : `Could not get media ID: ${data.error ?? 'Unknown error'}`);
        return;
      }
      mediaId = data.media_id;
    } catch {
      alert(lang === 'ko' ? '미디어 ID 조회 중 오류가 발생했습니다.' : 'An error occurred while fetching the media ID.');
      return;
    }

    if (campaignType === 'comment_automation') {
      const keywords = form.trigger_keywords.split(',').map((k) => k.trim()).filter(Boolean);
      if (keywords.length === 0) {
        alert(lang === 'ko' ? '트리거 키워드를 최소 1개 이상 입력해주세요.' : 'Please enter at least one trigger keyword.');
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
        alert(lang === 'ko' ? `캠페인 생성 실패: ${error.message}` : `Failed to create campaign: ${error.message}`);
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
        alert(lang === 'ko' ? `캠페인 생성 실패: ${error.message}` : `Failed to create campaign: ${error.message}`);
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
    if (!window.confirm(lang === 'ko' ? '캠페인을 삭제하시겠습니까? DM 발송 기록도 함께 삭제됩니다.' : 'Delete this campaign? DM send history will also be deleted.')) return;
    await supabase.from('share2dm_comment_logs').delete().eq('campaign_id', id);
    await supabase.from('share2dm_dm_logs').delete().eq('campaign_id', id);
    const { error } = await supabase.from('share2dm_campaigns').delete().eq('id', id);
    if (error) {
      alert((lang === 'ko' ? '캠페인 삭제 중 오류가 발생했습니다: ' : 'Error deleting campaign: ') + error.message);
      return;
    }
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
          {t('+ 캠페인 생성', '+ New Campaign')}
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
            {t('요금제 변경 →', 'Change Plan →')}
          </a>
        </div>
        <UsageBar label={t('이번 달 DM 발송', 'DMs Sent This Month')} used={dmUsage.used} limit={dmUsage.limit} />
        <UsageBar label={t('캠페인', 'Campaigns')} used={campaignUsage.used} limit={campaignUsage.limit} style={{ marginTop: '12px' }} />

        {/* 연결된 플랫폼 */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#888', fontWeight: '600' }}>{t('연결된 플랫폼', 'Connected Platforms')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#444' }}>
              Instagram
              {igUsername ? <span> · @{igUsername}</span> : brandName ? <span> · @{brandName}</span> : ''}
              {igAccountId ? <span style={{ color: '#888' }}> · {igAccountId}</span> : ''}
            </span>
            {igAccountId && (
              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '14px' }}>✓</span> {t('Webhook 구독됨', 'Webhook subscribed')}
              </span>
            )}
            {clozetStoreName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#444' }}>
                  Clozet — <strong>{clozetStoreName}</strong>
                </span>
                <button
                  onClick={handleClozetDisconnect}
                  style={{ fontSize: '11px', color: '#999', background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
                >
                  {t('연결 해제', 'Disconnect')}
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
                {clozetConnecting ? t('연결 중...', 'Connecting...') : t('Clozet 연결하기', 'Connect Clozet')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
        <StatCard label={t('총 공유 수', 'Total Shares')} value={totalStats.shares} />
        <StatCard label={t('DM 발송 수', 'DMs Sent')} value={totalStats.dmsSent} />
        <StatCard label={t('링크 클릭 수', 'Link Clicks')} value={totalStats.clicks} />
      </div>

      {/* Campaign Form */}
      {showForm && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{t('새 캠페인', 'New Campaign')}</h3>

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
              {t('릴스 공유 DM', 'Reel Share DM')}
            </button>
            <button
              onClick={() => setCampaignType('comment_automation')}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                backgroundColor: campaignType === 'comment_automation' ? '#7C3AED' : '#f0f0f0',
                color: campaignType === 'comment_automation' ? 'white' : '#666',
              }}
            >
              {t('댓글 자동화', 'Comment Automation')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 공통: 게시물/릴스 URL */}
            <div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  placeholder={campaignType === 'comment_automation'
                    ? t('게시물 URL (https://instagram.com/p/... 또는 /reel/...)', 'Post URL (https://instagram.com/p/... or /reel/...)')
                    : t('릴스 URL (https://instagram.com/reel/...)', 'Reel URL (https://instagram.com/reel/...)')}
                  value={form.reel_url}
                  onChange={(e) => handleReelUrlChange(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={loadMediaList}
                  style={{
                    padding: '0 14px', border: '1px solid #ddd', borderRadius: '6px',
                    fontSize: '12px', cursor: 'pointer', backgroundColor: '#f9f9f9',
                    color: '#444', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {t('목록에서 선택', 'Pick from list')}
                </button>
              </div>

              {/* 미디어 피커 */}
              {showMediaPicker && (
                <div style={{ marginTop: '10px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{t('내 Instagram 게시물', 'My Instagram Posts')}</span>
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888', lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                  {mediaListLoading ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '13px' }}>{t('불러오는 중...', 'Loading...')}</p>
                  ) : mediaList.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '13px' }}>{t('게시물이 없습니다.', 'No posts found.')}</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', padding: '2px', maxHeight: '280px', overflowY: 'auto' }}>
                      {mediaList.map((item) => {
                        const thumb = item.thumbnail_url || item.media_url;
                        const date = new Date(item.timestamp).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' });
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectMedia(item)}
                            style={{
                              position: 'relative', aspectRatio: '1', overflow: 'hidden',
                              border: 'none', cursor: 'pointer', background: '#f0f0f0', padding: 0,
                            }}
                            title={`${item.shortcode} · ${date}`}
                          >
                            {thumb ? (
                              <img src={thumb} alt={item.shortcode} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#888' }}>
                                {item.media_type === 'REEL' ? '🎬' : '🖼️'}
                              </div>
                            )}
                            <span style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                              fontSize: '10px', padding: '3px 4px', textAlign: 'center',
                            }}>
                              {date}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {/* Reel lookup status */}
              {reelLookup.loading && (
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#888' }}>Fetching reel from your Instagram account...</p>
              )}
              {!reelLookup.loading && reelLookup.mediaId && (
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#16a34a' }}>
                  ✓ Reel found on your Instagram account (ID: {reelLookup.mediaId})
                </p>
              )}
              {!reelLookup.loading && reelLookup.error && (
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                  ✗ {reelLookup.error}
                </p>
              )}
              {campaignType === 'reel_share' && clozetStoreName && (
                <div style={{ marginTop: '6px', fontSize: '12px' }}>
                  {clozetLookingUp && <span style={{ color: '#888' }}>{t('Clozet에서 콘텐츠 조회 중...', 'Looking up Clozet content...')}</span>}
                  {!clozetLookingUp && clozetContent?.found && (
                    <span style={{ color: '#16a34a' }}>{t('Clozet 콘텐츠 발견! — ', 'Clozet content found! — ')}app.clozet.my/reel/{clozetContent.short_code}</span>
                  )}
                  {!clozetLookingUp && clozetContent && !clozetContent.found && (
                    <span style={{ color: '#dc2626' }}>{t('Clozet에 등록되지 않은 릴스입니다. 제품 링크를 직접 입력해주세요.', 'This Reel is not registered in Clozet. Please enter the product link manually.')}</span>
                  )}
                </div>
              )}
            </div>

            {/* 댓글 자동화 전용 필드 */}
            {campaignType === 'comment_automation' && (
              <>
                <div>
                  <input
                    placeholder={t('트리거 키워드 (콤마로 구분, 예: 링크, LINK, 정보)', 'Trigger keywords (comma-separated, e.g. link, LINK, info)')}
                    value={form.trigger_keywords}
                    onChange={(e) => setForm({ ...form, trigger_keywords: e.target.value })}
                    style={inputStyle}
                  />
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>
                    {t('댓글에 이 키워드가 포함되면 자동으로 DM과 답글이 발송됩니다.', 'When a comment contains these keywords, a DM and reply will be sent automatically.')}
                  </p>
                </div>
                <textarea
                  placeholder={t('공개 댓글 답글 (예: DM으로 링크 보내드렸어요! 확인해보세요 😊)', 'Public comment reply (e.g. Sent you the link via DM! Check it out 😊)')}
                  value={form.comment_reply_message}
                  onChange={(e) => setForm({ ...form, comment_reply_message: e.target.value })}
                  style={{ ...inputStyle, height: '70px', resize: 'vertical' }}
                />
              </>
            )}

            {/* 공통: DM 메시지 */}
            <textarea
              placeholder={t('자동 DM 메시지 (예: 안녕하세요! 요청하신 제품 링크 보내드려요)', 'Auto DM message (e.g. Hi! Here\'s the product link you requested)')}
              value={form.response_message}
              onChange={(e) => setForm({ ...form, response_message: e.target.value })}
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
            />

            {/* 공통: 제품 URL */}
            <div>
              <input
                placeholder={t('제품 URL (https://your-store.com/product)', 'Product URL (https://your-store.com/product)')}
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
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#16a34a' }}>{t('Clozet 릴스 페이지로 자동 설정됨', 'Auto-set to Clozet reel page')}</p>
              )}
            </div>

            <button
              onClick={createCampaign}
              style={{
                padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white',
                backgroundColor: campaignType === 'comment_automation' ? '#7C3AED' : '#333',
              }}
            >
              {t('생성하기', 'Create')}
            </button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div>
        <h2>{t('캠페인 목록', 'Campaigns')}</h2>
        {campaigns.length === 0 ? (
          <p style={{ color: '#888' }}>{t('아직 캠페인이 없습니다. 첫 캠페인을 만들어보세요!', 'No campaigns yet. Create your first one!')}</p>
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
                        {c.campaign_type === 'comment_automation' ? t('댓글 자동화', 'Comment Automation') : t('릴스 공유 DM', 'Reel Share DM')}
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
                        {t('답글: ', 'Reply: ')}{c.comment_reply_message}
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
                      {t('삭제', 'Delete')}
                    </button>
                  </div>
                </div>

                {/* Per-campaign stats */}
                {cs && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                    {c.campaign_type === 'comment_automation' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <MiniStat label={t('댓글 감지', 'Comments')} value={cs.commentCount} />
                        <MiniStat label={t('DM 발송', 'DMs Sent')} value={cs.dmsSent} />
                        <MiniStat label={t('링크 클릭', 'Clicks')} value={cs.clicks} />
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <MiniStat label={t('공유 수', 'Shares')} value={cs.shares} />
                        <MiniStat label={t('DM 발송', 'DMs Sent')} value={cs.dmsSent} />
                        <MiniStat label={t('링크 클릭', 'Clicks')} value={cs.clicks} />
                      </div>
                    )}

                    {/* Queue progress bar */}
                    {hasQueue && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          <span>{t('발송 진행 중', 'Sending in progress')}</span>
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
                          {t(`대기 ${cs.queuePending}건 | 발송 중 ${cs.queueSending}건`, `Queued: ${cs.queuePending} | Sending: ${cs.queueSending}`)}
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
