import { useLang } from '../../lib/i18n';

const SilentConversion = () => {
  const { t } = useLang();

  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-gray-100">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-pink/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-violet/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* 왼쪽: 텍스트 */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-lavender/15 border border-brand-lavender/30 text-brand-dark text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-violet inline-block"></span>
              <span>{t('자연스러운 수익화', 'Natural Monetization')}</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t(
                <>요란한 <span className="text-transparent bg-clip-text bg-brand-gradient-r">"댓글"</span> 요청 대신,<br />공유해달라 하세요.</>,
                <>Instead of noisy <span className="text-transparent bg-clip-text bg-brand-gradient-r">"comments"</span>,<br />just ask them to share.</>
              )}
            </h2>

            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              {t(
                <>피드 분위기는 지키고, 수익화는 조용하게.<br />관심 있는 팔로워가 먼저 공유하는 순간 — 구매 링크가 자동으로 전달됩니다.</>,
                <>Keep your feed aesthetic intact, monetize quietly.<br />The moment an interested follower shares — the purchase link is delivered automatically.</>
              )}
            </p>

            <ul className="space-y-8">
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">01</span>
                <div>
                  <h4 className="text-gray-900 font-bold">
                    {t('피드 분위기 그대로', 'Your feed stays yours')}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {t('홍보 게시물 없이도 구매 링크를 원하는 사람에게 전달할 수 있습니다.', 'Deliver purchase links without a single promotional post.')}
                  </p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">02</span>
                <div>
                  <h4 className="text-gray-900 font-bold">
                    {t('관심 있는 사람이 먼저 움직입니다', 'Interested people move first')}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {t('공유한 사람에게만 링크가 전달됩니다. 내가 외치지 않아도 됩니다.', 'Links go only to those who shared. No need to push.')}
                  </p>
                </div>
              </li>
              <li className="flex gap-5 items-start">
                <span className="text-xs font-bold text-brand-violet/60 tracking-widest mt-1 w-6 shrink-0">03</span>
                <div>
                  <h4 className="text-gray-900 font-bold">
                    {t('소란 없이. 링크만.', 'No noise. Just links.')}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {t('DM으로 조용히 전달되어 팔로워 피드에 아무 흔적도 남지 않습니다.', 'Delivered quietly via DM — no trace left on anyone\'s feed.')}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* 오른쪽: 카드 */}
          <div className="relative">
            <div className="absolute inset-0 bg-brand-gradient blur-2xl opacity-20 rounded-3xl transform -rotate-3"></div>

            <div className="relative bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-xl">

              <div className="mb-8 pb-8 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                  {t('기존 방식', 'Before')}
                </p>
                <div className="space-y-3">
                  {[
                    t('"댓글에 원하는 상품 번호 남겨주세요 👇"', '"Leave the product number in the comments 👇"'),
                    t('"확인 후 DM 드릴게요!"', '"I\'ll DM you after checking!"'),
                    t('"링크는 프로필에 있어요 🔗"', '"Link is in my bio 🔗"'),
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-400 line-through">
                      <div className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-brand-violet uppercase tracking-widest mb-4 font-medium">
                  {t('share2dm', 'share2dm')}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-6">
                  {t(
                    <>"이 릴스 <span className="text-transparent bg-clip-text bg-brand-gradient-r">공유</span>해달라 하세요.<br />나머지는 자동입니다."</>,
                    <>"Just ask them to <span className="text-transparent bg-clip-text bg-brand-gradient-r">share</span> this Reel.<br />The rest is automatic."</>
                  )}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t('공유하는 순간 구매 링크가 DM으로 전달됩니다. 댓글도, 프로필 링크도 필요 없습니다.', 'The moment they share, the purchase link is sent via DM. No comments, no bio links needed.')}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SilentConversion;
