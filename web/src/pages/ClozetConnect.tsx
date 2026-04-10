import { useLang } from '../lib/i18n';
import { Play, Hand, ShoppingBag, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClozetConnect = () => {
  const { t } = useLang();
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Play className="w-6 h-6" />,
      title: t('링크 클릭', 'Tap the Link'),
      desc: t(
        'DM으로 받은 링크를 클릭하면 영상이 끊기지 않고 이어서 재생됩니다.',
        'Tap the link from DM — the video keeps playing seamlessly.'
      ),
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: <Hand className="w-6 h-6" />,
      title: t('화면 탭', 'Tap the Screen'),
      desc: t(
        '재생 중인 영상을 탭하면 태깅된 상품 정보가 스티커로 등장합니다.',
        'Tap while watching — product stickers appear as overlays.'
      ),
      color: 'from-pink-500 to-purple-500',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: t('스티커 탭 → 구매', 'Tap Sticker → Buy'),
      desc: t(
        '스티커를 누르면 Clozet 스토어 또는 자사몰로 바로 연결됩니다.',
        'Tap a sticker to go straight to Clozet store or your own shop.'
      ),
      color: 'from-orange-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative bg-white flex flex-col items-center">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-pink-400/15 to-purple-400/15 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center relative z-10 mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 mb-6">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-semibold text-pink-600">Clozet Connect</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          {t('영상 하나에, 여러 상품을 담다', 'Multiple Products, One Video')}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-3">
          {t(
            '숏폼 영상 안에서 상품을 태깅하고, 탭 한번으로 구매까지 연결하세요.',
            'Tag products inside short-form videos. One tap to purchase.'
          )}
        </p>
        <p className="text-sm text-gray-400">
          Powered by{' '}
          <a href="https://clozet.my" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-600 transition-colors font-medium">
            Clozet
          </a>
          {' '}{t('— 숏폼 커머스 앱', '— Short-form Commerce App')}
        </p>
      </div>

      {/* Demo Video */}
      <div className="relative z-10 w-full max-w-4xl mb-24">
        <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="mx-auto flex px-4 py-1 text-xs text-gray-400 bg-white rounded-md border border-gray-200">
              clozet.my/connect
            </div>
          </div>
          <video className="w-full" controls playsInline muted>
            <source src="/clozet%20connect.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* How it works — 3 steps */}
      <div className="relative z-10 w-full max-w-5xl mb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
          {t('어떻게 작동하나요?', 'How does it work?')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-gray-200 to-gray-100 translate-x-[40px]" />
              )}
              <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all shadow-sm">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-105 transition-transform relative`}>
                  <span className="text-xs font-bold absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">{i + 1}</span>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phone mockup visual */}
      <div className="relative z-10 w-full max-w-5xl mb-24">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Phone frame */}
          <div className="relative mx-auto md:mx-0 shrink-0">
            <div className="w-[280px] h-[560px] rounded-[3rem] border-[3px] border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50 overflow-hidden relative shadow-xl shadow-purple-500/10">
              <img
                src="/clozet_connect_demo.gif"
                alt="Clozet Connect demo"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 space-y-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {t('하나의 영상, 무한한 상품 태깅', 'One Video, Unlimited Product Tags')}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {t(
                  '기존 DM 마케팅은 링크 하나에 상품 하나만 연결할 수 있었습니다. Clozet Connect는 숏폼 영상 위에 여러 상품을 스티커로 태깅하여, 시청자가 영상을 보면서 자연스럽게 상품을 탐색하고 구매할 수 있게 합니다.',
                  'Traditional DM marketing links one product per link. Clozet Connect lets you tag multiple products as stickers on short-form videos, so viewers can browse and buy while watching.'
                )}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm mb-1">{t('끊김 없는 재생', 'Seamless Playback')}</p>
                  <p className="text-gray-500 text-xs">{t('링크 클릭 후에도 영상이 이어서 재생됩니다.', 'Video continues playing even after tapping the link.')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                  <Hand className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm mb-1">{t('네이티브 쇼핑 경험', 'Native Shopping Experience')}</p>
                  <p className="text-gray-500 text-xs">{t('앱 이탈 없이 영상 위에서 바로 상품을 탐색합니다.', 'Browse products directly on the video without leaving.')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clozet Store vs D2C comparison */}
      <div className="relative z-10 w-full max-w-4xl mb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {t('어디로 연결할까요?', 'Where do you connect?')}
        </h2>
        <p className="text-gray-500 text-center mb-12 text-sm">
          {t('스티커를 탭하면 선택한 스토어로 바로 연결됩니다.', 'Tapping a sticker takes customers straight to your chosen store.')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clozet Store */}
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-200 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t('Clozet 스토어', 'Clozet Store')}</h3>
                <span className="text-xs text-green-600 font-medium">{t('모든 플랜', 'All Plans')}</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-6">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                <span className="text-gray-600 text-sm">{t('가입 즉시 사용 가능', 'Available immediately after sign-up')}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                <span className="text-gray-600 text-sm">{t('숏폼에 최적화된 네이티브 구매 경험', 'Native purchase experience optimized for short-form')}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                <span className="text-gray-600 text-sm">{t('별도 쇼핑몰 없이도 판매 시작', 'Start selling without your own store')}</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              {t('무료로 시작하기', 'Start Free')}
            </button>
          </div>

          {/* D2C Store */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-50 to-white border border-purple-200 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(147,51,234,0.08)]">
            <div className="absolute top-0 inset-x-0 flex justify-center transform -translate-y-1/2">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">Growth</span>
            </div>
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t('자사몰 연결', 'Your Own Store')}</h3>
                <span className="text-xs text-pink-500 font-medium">{t('Growth 플랜 필요', 'Growth Plan Required')}</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-6">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2 shrink-0" />
                <span className="text-gray-600 text-sm">{t('브랜드 자체 쇼핑몰로 직접 연결', 'Connect directly to your own shopping mall')}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2 shrink-0" />
                <span className="text-gray-600 text-sm">{t('자사 브랜딩 & 고객 데이터 100% 유지', 'Keep 100% of your branding & customer data')}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2 shrink-0" />
                <span className="text-gray-600 text-sm">{t('기존 결제·CS 시스템 그대로 활용', 'Leverage your existing payment & CS systems')}</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
            >
              {t('Growth 플랜 보기', 'View Growth Plan')} <ArrowRight className="inline w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 text-center">
        <p className="text-lg text-gray-500 mb-6">
          {t(
            '여러 상품, 하나의 영상. 탭 한번으로 구매까지.',
            'Multiple products, one video. One tap to purchase.'
          )}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/30"
        >
          {t('지금 시작하기', 'Get Started Now')} <ArrowRight className="inline w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ClozetConnect;
