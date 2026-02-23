import { useNavigate } from 'react-router-dom';
import { Check, HelpCircle } from 'lucide-react';
import { useLang } from '../lib/i18n';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { PlanName } from '../lib/plan-config';

const TOSS_CLIENT_KEY = process.env.REACT_APP_TOSS_CLIENT_KEY ?? '';

async function requestBilling(plan: PlanName, brandId: string) {
  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
  const customerKey = `share2dm_${brandId}`;
  const payment = tossPayments.payment({ customerKey });

  await payment.requestBillingAuth({
    method: 'CARD',
    successUrl: `${window.location.origin}/billing/success?plan=${plan}&brand_id=${brandId}`,
    failUrl: `${window.location.origin}/billing/fail`,
    customerEmail: '',
    customerName: '',
  });
}

type FeeTableProps = {
  fashion: number;
  beauty: number;
  life: number;
  textColor?: string;
  labelColor?: string;
};

const FeeTable = ({ fashion, beauty, life, textColor = 'text-gray-400', labelColor = 'text-gray-500' }: FeeTableProps) => {
  const { t } = useLang();
  return (
    <span className="block mt-1.5 space-y-1">
      <span className="flex items-center gap-2 text-xs">
        <span className={`${labelColor} w-16`}>{t('패션', 'Fashion')}</span>
        <span className={textColor}>{fashion}%</span>
      </span>
      <span className="flex items-center gap-2 text-xs">
        <span className={`${labelColor} w-16`}>{t('뷰티', 'Beauty')}</span>
        <span className={textColor}>{beauty}%</span>
      </span>
      <span className="flex items-center gap-2 text-xs">
        <span className={`${labelColor} w-16`}>{t('라이프/홈', 'Life/Home')}</span>
        <span className={textColor}>{life}%</span>
      </span>
    </span>
  );
};

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useLang();

  const handlePlanSelect = (plan: PlanName) => {
    const brandId = localStorage.getItem('brand_id');
    if (!brandId) {
      navigate('/login');
      return;
    }
    if (plan === 'free') {
      navigate('/dashboard');
      return;
    }
    requestBilling(plan, brandId);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative bg-[#0B0914] flex flex-col items-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-purple-500/25 to-indigo-500/25 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="text-center relative z-10 mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">{t('합리적인 요금제', 'Simple Pricing')}</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          {t(
            <>복잡한 과금 없이 필요한 만큼만 사용하세요. <br className="hidden md:block"/> 모든 요금제는 "공유 기반 자동 DM" 기능을 지원합니다.</>,
            <>Pay only for what you need — no hidden fees. <br className="hidden md:block"/> All plans include share-based auto DM.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto relative z-10 w-full">
        {/* Free Plan */}
        <div className="p-8 rounded-3xl bg-[#151221]/50 border border-white/5 backdrop-blur-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{t('🌱 Free', '🌱 Free')}</h3>
            <p className="text-gray-400 text-sm h-10">{t('찍먹 / 테스트 유저', 'Try it out / Test users')}</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">{t('0', '0')}</span>
            <span className="text-gray-500"> {t('원/월', 'KRW/mo')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">{t('월 1,000건 DM 발송', '1,000 DMs / month')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">{t('캠페인 1개', '1 campaign')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">{t('Clozet Connect 제공', 'Clozet Connect included')}<button onClick={() => navigate('/clozet-connect')} className="inline-flex ml-1 align-middle text-gray-500 hover:text-white transition-colors"><HelpCircle className="w-3.5 h-3.5" /></button><br /><span className="text-gray-500 text-xs">(Clozet Only)</span></span></li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">
                {t('플랫폼 수수료', 'Platform fee')}
                <FeeTable fashion={8} beauty={10} life={8} />
              </span>
            </li>
          </ul>
          <button onClick={() => handlePlanSelect('free')} className="w-full py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
            {t('무료로 시작', 'Start Free')}
          </button>
        </div>

        {/* Standard Plan (Killer) */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/40 to-[#151221] border border-purple-500/50 flex flex-col relative shadow-[0_0_40px_rgba(147,51,234,0.15)] transform md:-translate-y-4">
          <div className="absolute top-0 inset-x-0 flex justify-center transform -translate-y-1/2">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">Killer</span>
          </div>
          <div className="mb-6 mt-2">
            <h3 className="text-xl font-bold text-white mb-2">{t('🚀 Standard', '🚀 Standard')}</h3>
            <p className="text-purple-200/70 text-sm h-10">{t('ManyChat 이탈 셀러', 'Sellers leaving ManyChat')}</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">{t('9,900', '9,900')}</span>
            <span className="text-purple-300/60"> {t('원/월', 'KRW/mo')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm font-medium">{t('월 10,000건 DM 발송', '10,000 DMs / month')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm">{t('캠페인 3개', '3 campaigns')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm">{t('Clozet Connect 제공', 'Clozet Connect included')}<button onClick={() => navigate('/clozet-connect')} className="inline-flex ml-1 align-middle text-pink-300/60 hover:text-white transition-colors"><HelpCircle className="w-3.5 h-3.5" /></button><br /><span className="text-pink-200/40 text-xs">(Clozet Only)</span></span></li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <span className="text-white text-sm">
                {t('플랫폼 수수료', 'Platform fee')}
                <FeeTable fashion={7} beauty={8} life={6} textColor="text-white" labelColor="text-pink-200/50" />
              </span>
            </li>
          </ul>
          <button onClick={() => handlePlanSelect('standard')} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20">
            {t('시작하기', 'Get Started')}
          </button>
        </div>

        {/* Growth Plan */}
        <div className="p-8 rounded-3xl bg-[#151221] border border-white/10 flex flex-col relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-purple-400 mb-2">{t('📈 Growth', '📈 Growth')}</h3>
            <p className="text-gray-400 text-sm h-10">{t('본격 성장형 마켓', 'Scaling marketplace sellers')}</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">{t('49,000', '49,000')}</span>
            <span className="text-gray-500"> {t('원/월', 'KRW/mo')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span className="text-gray-300 text-sm">{t('월 50,000건 DM 발송', '50,000 DMs / month')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span className="text-gray-300 text-sm">{t('캠페인 무제한', 'Unlimited campaigns')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span className="text-gray-300 text-sm">{t('Clozet Connect 제공', 'Clozet Connect included')}<button onClick={() => navigate('/clozet-connect')} className="inline-flex ml-1 align-middle text-purple-300/60 hover:text-white transition-colors"><HelpCircle className="w-3.5 h-3.5" /></button></span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 shrink-0" /><span className="text-green-400 text-sm font-medium">{t('자사몰(D2C) 연결', 'Connect your own D2C store')}</span></li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">
                {t('플랫폼 수수료', 'Platform fee')}
                <FeeTable fashion={5} beauty={6} life={4} textColor="text-purple-300" labelColor="text-gray-500" />
              </span>
            </li>
          </ul>
          <button onClick={() => handlePlanSelect('growth')} className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
            {t('시작하기', 'Get Started')}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-8 rounded-3xl bg-[#151221]/50 border border-white/5 backdrop-blur-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{t('👑 Pro', '👑 Pro')}</h3>
            <p className="text-gray-400 text-sm h-10">{t('자사몰 보유 대형 브랜드', 'Large brands with own D2C store')}</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">{t('99,000', '99,000')}</span>
            <span className="text-gray-500"> {t('원/월', 'KRW/mo')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">{t('무제한 DM 발송', 'Unlimited DMs')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">{t('캠페인 무제한', 'Unlimited campaigns')}</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 shrink-0" /><span className="text-green-400 text-sm font-medium">{t('자사몰(D2C) 자유 연결', 'Connect your own D2C store')}</span></li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">
                {t('플랫폼 수수료', 'Platform fee')}
                <FeeTable fashion={3} beauty={4} life={3} />
              </span>
            </li>
          </ul>
          <button onClick={() => handlePlanSelect('pro')} className="w-full py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
            {t('시작하기', 'Get Started')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
