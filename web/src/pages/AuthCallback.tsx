import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const [status, setStatus] = useState('Instagram 계정 연결 중...');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brandId = params.get('brand_id');
    const brandName = params.get('brand_name');
    const error = params.get('error');

    if (error) {
      setStatus(`로그인 실패: ${decodeURIComponent(error)}`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (brandId && brandName) {
      localStorage.setItem('brand_id', brandId);
      localStorage.setItem('brand_name', brandName);
      setStatus('연결 완료! 대시보드로 이동합니다...');
      setTimeout(() => navigate('/dashboard'), 1000);
      return;
    }

    setStatus('인증 정보가 없습니다.');
    setTimeout(() => navigate('/login'), 2000);
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h2>{status}</h2>
    </div>
  );
}
