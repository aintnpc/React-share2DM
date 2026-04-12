import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../../lib/i18n';

const D2CTeaser = () => {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden border-t border-gray-100">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-violet/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* 왼쪽: 카피 */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-lavender/15 border border-brand-lavender/30 text-brand-dark text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-violet inline-block"></span>
              <span>{t('자사몰 운영자라면', 'Running your own store?')}</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t(
                <>릴스에서 탭 한 번,<br /><span className="text-transparent bg-clip-text bg-brand-gradient-r">자사몰 구매</span>까지.</>,
                <>One tap from Reels,<br />straight to your <span className="text-transparent bg-clip-text bg-brand-gradient-r">own store</span>.</>
              )}
            </h2>

            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              {t(
                <>영상에 상품을 태깅하면, 고객이 보다가 탭하는 순간 자사몰로 바로 연결됩니다.<br />고객 데이터와 결제는 자사몰에 그대로.</>,
                <>Tag products on your video. Customers tap while watching and land on your store.<br />Customer data and payments stay entirely yours.</>
              )}
            </p>

            <ul className="space-y-6 mb-10">
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">01</span>
                <div>
                  <h4 className="text-gray-900 font-bold">{t('영상 하나에 상품 여러 개', 'Multiple products, one video')}</h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t('링크 하나에 상품 하나의 시대는 끝났습니다. 영상 위에 스티커로 태깅하세요.', 'One link, one product is over. Tag products as stickers directly on your video.')}</p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">02</span>
                <div>
                  <h4 className="text-gray-900 font-bold">{t('끊김 없는 시청 → 자연스러운 구매', 'Seamless viewing → natural purchase')}</h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t('영상이 멈추지 않습니다. 보던 영상 그대로, 탭 한 번으로 구매까지.', 'Video keeps playing. One tap while watching — purchase complete.')}</p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">03</span>
                <div>
                  <h4 className="text-gray-900 font-bold">{t('고객 데이터는 자사몰에 그대로', 'Customer data stays in your store')}</h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t('중간 플랫폼 없이 자사 브랜딩, 결제, CS 시스템을 100% 유지합니다.', 'No middleman. Keep your branding, payment, and CS systems 100% intact.')}</p>
                </div>
              </li>
            </ul>

            <button
              onClick={() => navigate('/clozet-connect')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(155,154,238,0.35)]"
            >
              {t('자세히 보기', 'Learn more')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 오른쪽: 폰 목업 */}
          <div className="flex justify-center md:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-gradient blur-2xl opacity-15 rounded-3xl transform rotate-3"></div>
              <div className="relative w-[260px] h-[520px] rounded-[2.8rem] border-[3px] border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50 overflow-hidden shadow-2xl shadow-purple-500/10">
                <img
                  src="/clozet_connect_demo.gif"
                  alt="자사몰 구매전환 데모"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default D2CTeaser;
