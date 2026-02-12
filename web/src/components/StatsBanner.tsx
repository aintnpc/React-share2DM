import { TrendingUp, Clock, Send, ShieldCheck } from 'lucide-react';

const StatsBanner = () => (
  <section className="py-12 border-y border-white/5 bg-[#151221]/80 backdrop-blur-md relative z-10">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
        <div className="text-center px-4">
          <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-3xl md:text-4xl font-extrabold text-white">90%</span>
          </div>
          <p className="text-sm text-gray-400 font-medium">놓치던 잠수족 전환</p>
        </div>
        <div className="text-center px-4 border-l-0 md:border-l border-white/5">
          <div className="flex items-center justify-center gap-2 text-pink-400 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-3xl md:text-4xl font-extrabold text-white">1분</span>
          </div>
          <p className="text-sm text-gray-400 font-medium">캠페인 설정 소요 시간</p>
        </div>
        <div className="text-center px-4 border-l border-white/5">
          <div className="flex items-center justify-center gap-2 text-indigo-400 mb-2">
            <Send className="w-5 h-5" />
            <span className="text-3xl md:text-4xl font-extrabold text-white">2번</span>
          </div>
          <p className="text-sm text-gray-400 font-medium">전환까지 필요한 탭 수</p>
        </div>
        <div className="text-center px-4 border-l-0 md:border-l border-white/5">
          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-3xl md:text-4xl font-extrabold text-white">100%</span>
          </div>
          <p className="text-sm text-gray-400 font-medium">공식 API 사용으로 안전</p>
        </div>
      </div>
    </div>
  </section>
);

export default StatsBanner;
