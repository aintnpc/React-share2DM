import { Link2, Share2, Send } from 'lucide-react';

const HowItWorks = () => (
  <section className="py-24 bg-[#0B0914] relative z-10 border-t border-white/5">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">단 3단계, 가장 직관적인 프로세스</h2>
        <p className="text-gray-400 text-lg">복잡한 챗봇 설계 없이 누구나 즉시 사용할 수 있습니다.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 relative">
        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0"></div>

        <div className="relative p-8 rounded-3xl bg-[#151221] border border-white/5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-white/10 flex items-center justify-center mb-6 relative z-10">
            <Link2 className="w-8 h-8 text-gray-400" />
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">1</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">캠페인 생성</h3>
          <p className="text-gray-400 text-sm leading-relaxed">대시보드에서 대상 릴스 링크와 전송할 제품 URL을 입력합니다.</p>
        </div>

        <div className="relative p-8 rounded-3xl bg-gradient-to-b from-purple-900/20 to-[#151221] border border-purple-500/20 text-center flex flex-col items-center shadow-[0_0_30px_rgba(147,51,234,0.1)]">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-6 relative z-10">
            <Share2 className="w-8 h-8 text-purple-400" />
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">2</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">릴스 공유</h3>
          <p className="text-purple-200/70 text-sm leading-relaxed">고객이 릴스를 시청하고 브랜드 계정으로 DM 공유 버튼을 누릅니다. (흔적 0%)</p>
        </div>

        <div className="relative p-8 rounded-3xl bg-[#151221] border border-white/5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-white/10 flex items-center justify-center mb-6 relative z-10">
            <Send className="w-8 h-8 text-gray-400" />
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">3</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">자동 DM 발송</h3>
          <p className="text-gray-400 text-sm leading-relaxed">공유가 감지되면 즉시 설정된 제품 링크가 고객의 DM으로 자동 전송됩니다.</p>
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
