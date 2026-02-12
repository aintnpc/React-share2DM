import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-r from-purple-400 to-indigo-400 relative overflow-hidden z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-white/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-md">이제, 전환율의 한계를 <br className="hidden md:block"/> 넘을 시간입니다</h2>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-sm font-medium">
          단 1분이면 설정이 완료됩니다. <br className="hidden md:block"/> 흔적 없는 완벽한 구매 여정을 지금 바로 시작하세요.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center justify-center gap-3 px-10 py-5 text-xl font-extrabold text-white bg-[#0B0914] rounded-full hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        >
          <Zap className="w-7 h-7 fill-yellow-400 text-yellow-400" />
          1초만에 연결하기
        </button>
      </div>
    </section>
  );
};

export default FinalCTA;
