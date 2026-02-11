import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Campaign {
  id: string;
  reel_url: string;
  reel_video_id: string;
  response_message: string;
  product_url: string;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  totalShares: number;
  totalDMs: number;
  totalClicks: number;
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ totalShares: 0, totalDMs: 0, totalClicks: 0 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reel_url: '', response_message: '', product_url: '' });

  useEffect(() => {
    loadCampaigns();
    loadStats();
  }, []);

  const loadCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCampaigns(data);
  };

  const loadStats = async () => {
    const { count: dmCount } = await supabase
      .from('dm_logs')
      .select('*', { count: 'exact', head: true });

    const { count: clickCount } = await supabase
      .from('dm_logs')
      .select('*', { count: 'exact', head: true })
      .not('link_clicked_at', 'is', null);

    setStats({
      totalShares: dmCount || 0,
      totalDMs: dmCount || 0,
      totalClicks: clickCount || 0,
    });
  };

  const extractReelVideoId = (url: string): string => {
    // Extract reel ID from Instagram URL
    // e.g. https://www.instagram.com/reel/ABC123/ -> ABC123
    const match = url.match(/\/reel\/([^/?]+)/);
    return match ? match[1] : '';
  };

  const createCampaign = async () => {
    const reelVideoId = extractReelVideoId(form.reel_url);
    if (!reelVideoId) {
      alert('올바른 릴스 URL을 입력해주세요.');
      return;
    }

    const { error } = await supabase.from('campaigns').insert({
      reel_url: form.reel_url,
      reel_video_id: reelVideoId,
      response_message: form.response_message,
      product_url: form.product_url,
      brand_id: localStorage.getItem('brand_id'), // TODO: proper auth
    });

    if (!error) {
      setForm({ reel_url: '', response_message: '', product_url: '' });
      setShowForm(false);
      loadCampaigns();
    }
  };

  const toggleCampaign = async (id: string, isActive: boolean) => {
    await supabase
      .from('campaigns')
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
            <input
              placeholder="릴스 URL (https://instagram.com/reel/...)"
              value={form.reel_url}
              onChange={(e) => setForm({ ...form, reel_url: e.target.value })}
              style={inputStyle}
            />
            <textarea
              placeholder="자동 DM 메시지 (예: 안녕하세요! 요청하신 제품 링크 보내드려요)"
              value={form.response_message}
              onChange={(e) => setForm({ ...form, response_message: e.target.value })}
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
            />
            <input
              placeholder="제품 URL (https://your-store.com/product)"
              value={form.product_url}
              onChange={(e) => setForm({ ...form, product_url: e.target.value })}
              style={inputStyle}
            />
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
                  <p style={{ color: '#888', margin: 0, fontSize: '12px' }}>{c.product_url}</p>
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
};
