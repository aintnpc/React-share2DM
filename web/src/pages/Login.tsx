import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { useLang } from '../lib/i18n';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLang();
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');

  const handleInstagramLogin = () => {
    const appId = process.env.REACT_APP_META_APP_ID;
    const workersUrl = process.env.REACT_APP_WORKERS_URL;
    const redirectUri = `${workersUrl}/auth/callback`;
    const scope = 'instagram_basic,instagram_manage_messages,instagram_manage_comments,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,business_management';
    const state = encodeURIComponent(window.location.origin);

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;

    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center relative bg-[#0B0914] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/25 to-pink-500/25 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div
          className="text-center mb-8 cursor-pointer flex flex-col items-center"
          onClick={() => navigate('/')}
        >
          <img
            src={`${process.env.PUBLIC_URL}/share2dm_logo_nobg.png`}
            alt="share2dm"
            className="w-12 h-12 rounded-full mb-4 shadow-[0_0_20px_rgba(147,51,234,0.4)]"
          />
          <h2 className="text-3xl font-extrabold text-white">{t('share2dm 시작하기', 'Get Started with share2dm')}</h2>
          <p className="text-gray-400 mt-2">{t('마케팅 패러다임을 바꿀 준비가 되셨나요?', 'Ready to change the marketing paradigm?')}</p>
        </div>

        <div className="bg-[#151221]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {decodeURIComponent(error)}
            </div>
          )}

          <button
            onClick={handleInstagramLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          >
            <Instagram className="w-5 h-5" />
            {t('Instagram 비즈니스 계정 연결하기', 'Connect Instagram Business Account')}
          </button>

          <p className="text-center mt-6 text-xs text-gray-500">
            {t('Instagram 비즈니스 계정 + Facebook 페이지가 필요합니다.', 'Requires an Instagram Business account + Facebook Page.')}
          </p>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-xs text-gray-500 leading-relaxed">
              {t(
                <>계속 진행하면{' '}
                  <button onClick={() => navigate('/terms/service')} className="text-purple-400 hover:text-purple-300">이용약관</button>
                  {' '}및{' '}
                  <button onClick={() => navigate('/terms/privacy')} className="text-purple-400 hover:text-purple-300">개인정보처리방침</button>
                  에 동의하는 것으로 간주됩니다.</>,
                <>By continuing, you agree to our{' '}
                  <button onClick={() => navigate('/terms/service')} className="text-purple-400 hover:text-purple-300">Terms of Service</button>
                  {' '}and{' '}
                  <button onClick={() => navigate('/terms/privacy')} className="text-purple-400 hover:text-purple-300">Privacy Policy</button>.
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-400">
          <button onClick={() => navigate('/')} className="text-purple-400 font-medium hover:text-purple-300">
            {t('← 홈으로 돌아가기', '← Back to Home')}
          </button>
        </p>
      </div>
    </div>
  );
}
