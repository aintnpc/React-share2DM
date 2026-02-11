import React from 'react';

export default function Login() {
  const handleInstagramLogin = () => {
    const appId = process.env.REACT_APP_META_APP_ID;
    const workersUrl = process.env.REACT_APP_WORKERS_URL;
    const redirectUri = `${workersUrl}/auth/callback`;
    const scope = 'instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement';
    const state = encodeURIComponent(window.location.origin);

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;

    window.location.href = authUrl;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>share2dm</h1>
        <p style={styles.subtitle}>릴스 공유 기반 자동 DM 마케팅</p>
        <p style={styles.description}>
          릴스를 공유하면 자동으로 DM을 보내주는 서비스.<br />
          댓글 없이, 흔적 없이 — 공유만으로 구매 전환.
        </p>
        <button onClick={handleInstagramLogin} style={styles.button}>
          Instagram 비즈니스 계정 연결하기
        </button>
        <p style={styles.note}>
          Instagram 비즈니스 계정 + Facebook 페이지가 필요합니다.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#fafafa',
  },
  card: {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    maxWidth: '420px',
    width: '100%',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 24px 0',
  },
  description: {
    fontSize: '15px',
    color: '#444',
    lineHeight: '1.6',
    margin: '0 0 32px 0',
  },
  button: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#E1306C',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
  },
  note: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '16px',
  },
};
