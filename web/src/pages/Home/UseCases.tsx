import { ShoppingBag, Users, Briefcase } from 'lucide-react';
import { useLang } from '../../lib/i18n';

const UseCases = () => {
  const { t } = useLang();

  return (
    <section className="py-24 bg-[#0B0914] relative z-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('누구에게 가장 효과적인가요?', 'Who benefits the most?')}</h2>
          <p className="text-gray-400 text-lg">{t('댓글 이벤트의 한계를 느끼고 계신 모든 분들을 위해 만들었습니다.', 'Built for everyone who has hit the limits of comment-based events.')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 flex flex-col group hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">{t('브랜드 / 쇼핑몰', 'Brands / E-commerce')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t("CS 리소스를 낭비하지 마세요. 번거로운 '댓글 확인 후 DM 전송' 과정을 100% 자동화하여 구매 전환율을 극대화합니다.", "Stop wasting CS resources. Fully automate the 'check comment then send DM' workflow and maximize purchase conversion rates.")}</p>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/[0.05] to-transparent border border-purple-500/20 flex flex-col group hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">{t('크리에이터 / 인플루언서', 'Creators / Influencers')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t('"공유해줘" 한 마디면 충분합니다. 본인을 노출하기 꺼려하는 부계정 시청자들까지 행동하게 만들어 압도적인 반응률을 이끌어냅니다.', 'Just say "share it". Even anonymous alt-account viewers who avoid exposure will take action — driving overwhelming engagement rates.')}</p>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 flex flex-col group hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">{t('마케팅 대행사', 'Marketing Agencies')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t('다중 계정 관리 기능과 상세 통계 대시보드를 통해 여러 클라이언트의 캠페인을 한 곳에서 효율적으로 운영하고 성과를 증명하세요.', 'Manage multiple client campaigns from a single dashboard with multi-account support and detailed analytics to prove results.')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
