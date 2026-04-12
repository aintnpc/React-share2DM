import { useLang } from '../../lib/i18n';

const Features = () => {
  const { t } = useLang();

  return (
    <section id="features" className="py-24 bg-gray-50 relative border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">

          {/* 왼쪽: 댓글 기반 */}
          <div className="p-8 md:p-10 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <h3 className="text-2xl font-bold text-gray-400">{t('댓글 기반 DM', 'Comment-Based DM')}</h3>
            </div>
            <ul className="space-y-8">
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-gray-300 tracking-widest mt-1 w-6 shrink-0">01</span>
                <div>
                  <h4 className="text-gray-600 font-semibold text-lg">{t('홍보 냄새가 납니다', 'Feels promotional')}</h4>
                  <p className="text-gray-400 mt-2 leading-relaxed text-sm">{t('댓글 이벤트는 피드와 콘텐츠 분위기를 해칩니다. 광고처럼 보이기 싫어도 어쩔 수 없습니다.', 'Comment events disrupt your feed aesthetic — hard to avoid looking like an ad.')}</p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-gray-300 tracking-widest mt-1 w-6 shrink-0">02</span>
                <div>
                  <h4 className="text-gray-600 font-semibold text-lg">{t('팔로워가 먼저 행동해야 합니다', 'Followers must act first — publicly')}</h4>
                  <p className="text-gray-400 mt-2 leading-relaxed text-sm">{t('댓글은 모두에게 보입니다. 구매 의사를 드러내기 꺼려하는 팔로워는 그냥 지나칩니다.', 'Comments are public. Followers who prefer privacy just scroll past.')}</p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-gray-300 tracking-widest mt-1 w-6 shrink-0">03</span>
                <div>
                  <h4 className="text-gray-600 font-semibold text-lg">{t('수동 확인 후 일일이 DM 전송', 'Manual check, then send DM one by one')}</h4>
                  <p className="text-gray-400 mt-2 leading-relaxed text-sm">{t("댓글 확인 → DM 발송을 반복하는 리소스 낭비가 발생합니다.", "Checking comments → sending DMs, over and over. A constant drain on resources.")}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* 오른쪽: 공유 기반 */}
          <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-brand-pink/10 to-brand-violet/10 border border-brand-lavender/30 relative overflow-hidden shadow-[0_0_50px_rgba(201,168,236,0.15)]">
            <div className="absolute top-0 right-0 p-6">
              <div className="bg-purple-600 text-xs font-bold px-4 py-1.5 rounded-full text-white tracking-wide shadow-lg">Share2DM</div>
            </div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-gray-900">{t('공유 기반 DM', 'Share-Based DM')}</h3>
            </div>
            <ul className="space-y-8 relative z-10">
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">01</span>
                <div>
                  <h4 className="text-gray-900 font-semibold text-lg">{t('피드 분위기 그대로', 'Your feed stays yours')}</h4>
                  <p className="text-brand-dark/60 mt-2 leading-relaxed text-sm">{t('홍보 게시물 없이 구매 링크를 전달합니다. 콘텐츠는 콘텐츠답게.', 'Deliver purchase links without a single promotional post. Content stays content.')}</p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">02</span>
                <div>
                  <h4 className="text-gray-900 font-semibold text-lg">{t('관심 있는 사람이 먼저 움직입니다', 'Interested people move first')}</h4>
                  <p className="text-brand-dark/60 mt-2 leading-relaxed text-sm">{t('공유한 사람에게만 링크가 전달됩니다. 조용하고, 자연스럽게.', 'Only those who share receive the link. Quietly. Naturally.')}</p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">03</span>
                <div>
                  <h4 className="text-gray-900 font-semibold text-lg">{t('100% 자동화', '100% Automated')}</h4>
                  <p className="text-brand-dark/60 mt-2 leading-relaxed text-sm">{t('공유 버튼 클릭 한 번으로 구매 링크가 DM으로 자동 전달됩니다. 따로 확인할 필요 없습니다.', 'One tap on share — the purchase link is auto-sent via DM. No manual checks needed.')}</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Features;
