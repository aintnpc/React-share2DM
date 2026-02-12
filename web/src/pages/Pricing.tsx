import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative bg-[#0B0914] flex flex-col items-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-purple-500/25 to-indigo-500/25 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="text-center relative z-10 mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">합리적인 요금제</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          복잡한 과금 없이 필요한 만큼만 사용하세요. <br className="hidden md:block"/> 모든 요금제는 "공유 기반 자동 DM" 기능을 지원합니다.
        </p>

        <div className="mt-10 inline-flex items-center bg-[#151221] p-1.5 rounded-full border border-white/10">
          <button
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${!isAnnual ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setIsAnnual(false)}
          >
            월결제
          </button>
          <button
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setIsAnnual(true)}
          >
            연결제 <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">20% 할인</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto relative z-10 w-full">
        {/* Free Plan */}
        <div className="p-8 rounded-3xl bg-[#151221]/50 border border-white/5 backdrop-blur-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
            <p className="text-gray-400 text-sm h-10">간단히 기능을 테스트해보고 싶은 분들을 위해</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">$0</span>
            <span className="text-gray-500"> /월</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">캠페인 1개</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">월 100건 DM 발송</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">기본 통계 제공</span></li>
          </ul>
          <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
            무료로 시작
          </button>
        </div>

        {/* Starter Plan */}
        <div className="p-8 rounded-3xl bg-[#151221] border border-white/10 flex flex-col relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-purple-400 mb-2">Starter</h3>
            <p className="text-gray-400 text-sm h-10">성장하는 1인 크리에이터와 스몰 브랜드를 위해</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">${isAnnual ? '15' : '19'}</span>
            <span className="text-gray-500"> /월</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span className="text-gray-300 text-sm">캠페인 10개</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span className="text-gray-300 text-sm">월 2,000건 DM 발송</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span className="text-gray-300 text-sm">링크 클릭 추적 기능</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span className="text-gray-300 text-sm">UTM 파라미터 자동 연동</span></li>
          </ul>
          <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
            시작하기
          </button>
        </div>

        {/* Growth Plan (Popular) */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/40 to-[#151221] border border-purple-500/50 flex flex-col relative shadow-[0_0_40px_rgba(147,51,234,0.15)] transform md:-translate-y-4">
          <div className="absolute top-0 inset-x-0 flex justify-center transform -translate-y-1/2">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">가장 인기있는 요금제</span>
          </div>
          <div className="mb-6 mt-2">
            <h3 className="text-xl font-bold text-white mb-2">Growth</h3>
            <p className="text-purple-200/70 text-sm h-10">본격적으로 릴스 마케팅을 전개하는 비즈니스를 위해</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">${isAnnual ? '39' : '49'}</span>
            <span className="text-purple-300/60"> /월</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm font-medium">무제한 캠페인</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm">월 10,000건 DM 발송</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm">다중 계정 지원 (최대 3개)</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm">A/B 테스트 도구</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-pink-400 shrink-0" /><span className="text-white text-sm">상세 전환율 통계</span></li>
          </ul>
          <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20">
            무료 체험 시작
          </button>
        </div>

        {/* Agency Plan */}
        <div className="p-8 rounded-3xl bg-[#151221]/50 border border-white/5 backdrop-blur-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Agency</h3>
            <p className="text-gray-400 text-sm h-10">다수의 브랜드를 관리하는 대행사를 위해</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">${isAnnual ? '119' : '149'}</span>
            <span className="text-gray-500"> /월</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">무제한 캠페인 & 계정</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">무제한 DM 발송</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">API 접근 권한</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-500 shrink-0" /><span className="text-gray-300 text-sm">화이트라벨 대시보드</span></li>
          </ul>
          <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
            문의하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
