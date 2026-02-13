import {
  MessageCircle, Share2, CheckCircle2, EyeOff, MousePointerClick, Zap
} from 'lucide-react';
import { useLang } from '../../lib/i18n';

const Features = () => {
  const { t } = useLang();

  return (
    <section id="features" className="py-24 bg-[#0B0914] relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">

          <div className="p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gray-800">
                <MessageCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-300">{t('기존: 댓글 기반', 'Legacy: Comment-Based')}</h3>
            </div>
            <ul className="space-y-8">
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0"><CheckCircle2 className="w-6 h-6 text-gray-600" /></div>
                <div>
                  <h4 className="text-gray-300 font-semibold text-lg">{t('흔적이 영구적으로 남음', 'Permanent Public Trace')}</h4>
                  <p className="text-gray-500 mt-2 leading-relaxed">{t('팔로워, 친구, 누구나 내 댓글을 볼 수 있어 프라이버시 침해 우려', 'Followers, friends, anyone can see your comment — a privacy concern')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0"><CheckCircle2 className="w-6 h-6 text-gray-600" /></div>
                <div>
                  <h4 className="text-gray-300 font-semibold text-lg">{t('높은 심리적 저항', 'High Psychological Barrier')}</h4>
                  <p className="text-gray-500 mt-2 leading-relaxed">{t("부계정까지 만들어 활동하는 한국 사용자들에게 '댓글 달기'는 큰 허들", "For users who create alt accounts to stay anonymous, leaving a comment is a huge hurdle")}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0"><CheckCircle2 className="w-6 h-6 text-gray-600" /></div>
                <div>
                  <h4 className="text-gray-300 font-semibold text-lg">{t('잠수족(Lurker) 90% 이탈', '90% Lurker Drop-Off')}</h4>
                  <p className="text-gray-500 mt-2 leading-relaxed">{t('콘텐츠는 보지만 절대 반응하지 않는 90%의 타겟 고객을 놓침', 'You lose 90% of target customers who consume content but never engage')}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-purple-900/30 to-indigo-900/10 border border-purple-500/30 relative overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.1)]">
            <div className="absolute top-0 right-0 p-6">
              <div className="bg-purple-600 text-xs font-bold px-4 py-1.5 rounded-full text-white tracking-wide shadow-lg">Share2DM</div>
            </div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <Share2 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{t('혁신: 공유 기반', 'Innovation: Share-Based')}</h3>
            </div>
            <ul className="space-y-8 relative z-10">
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0"><EyeOff className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <h4 className="text-white font-semibold text-lg">{t('완전한 비공개 보장', 'Complete Privacy Guaranteed')}</h4>
                  <p className="text-purple-200/70 mt-2 leading-relaxed">{t('공유 활동은 로그에 남지 않으며 다른 사람들은 절대 알 수 없음', 'Share activity leaves no log — no one else can ever see it')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0"><MousePointerClick className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <h4 className="text-white font-semibold text-lg">{t('단 2번의 탭으로 전환', 'Convert in Just 2 Taps')}</h4>
                  <p className="text-purple-200/70 mt-2 leading-relaxed">{t('공유 버튼 클릭 → 브랜드 계정 선택만으로 즉시 자동 DM 발송', 'Tap share → select brand account → auto DM sent instantly')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0"><Zap className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <h4 className="text-white font-semibold text-lg">{t('Lurker 타겟팅 성공', 'Successfully Target Lurkers')}</h4>
                  <p className="text-purple-200/70 mt-2 leading-relaxed">{t('댓글 허들이 사라져 보기만 하던 90% 사용자들도 행동으로 이어짐', 'With the comment barrier gone, 90% of passive viewers now take action')}</p>
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
