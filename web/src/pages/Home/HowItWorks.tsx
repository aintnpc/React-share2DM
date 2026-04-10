import { Link2, Share2, Send } from 'lucide-react';
import { useLang } from '../../lib/i18n';

const HowItWorks = () => {
  const { t } = useLang();

  return (
    <section className="py-24 bg-gray-50 relative z-10 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('단 3단계, 가장 직관적인 프로세스', 'Just 3 Steps — The Most Intuitive Process')}</h2>
          <p className="text-gray-500 text-lg">{t('복잡한 챗봇 설계 없이 누구나 즉시 사용할 수 있습니다.', 'Anyone can start instantly — no complex chatbot setup required.')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-brand-pink/0 via-brand-lavender/50 to-brand-violet/0"></div>

          <div className="relative p-8 rounded-3xl bg-white border border-gray-200 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-6 relative z-10">
              <Link2 className="w-8 h-8 text-gray-500" />
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center">1</div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('캠페인 생성', 'Create Campaign')}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t('대시보드에서 대상 릴스 링크와 전송할 제품 URL을 입력합니다.', 'Enter the target Reels link and product URL in the dashboard.')}</p>
          </div>

          <div className="relative p-8 rounded-3xl bg-gradient-to-b from-brand-lavender/10 to-white border border-brand-lavender/30 text-center flex flex-col items-center shadow-[0_0_30px_rgba(201,168,236,0.15)]">
            <div className="w-16 h-16 rounded-2xl bg-brand-lavender/20 border border-brand-lavender/30 flex items-center justify-center mb-6 relative z-10">
              <Share2 className="w-8 h-8 text-brand-dark" />
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center">2</div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('릴스 공유', 'Share Reels')}</h3>
            <p className="text-brand-dark/60 text-sm leading-relaxed">{t('고객이 릴스를 시청하고 브랜드 계정으로 DM 공유 버튼을 누릅니다. (흔적 0%)', 'Customers watch the Reels and tap the DM share button to your brand account. (0% trace)')}</p>
          </div>

          <div className="relative p-8 rounded-3xl bg-white border border-gray-200 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-6 relative z-10">
              <Send className="w-8 h-8 text-gray-500" />
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center">3</div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('자동 DM 발송', 'Auto DM Delivery')}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t('공유가 감지되면 즉시 설정된 제품 링크가 고객의 DM으로 자동 전송됩니다.', 'Once a share is detected, the product link is automatically sent to the customer\'s DM.')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
