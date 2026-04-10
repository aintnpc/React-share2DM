import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useLang } from '../lib/i18n';

const FinalCTA = () => {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <section className="py-24 bg-brand-gradient relative overflow-hidden z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-white/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-md">
          {t(
            <>이제, 전환율의 한계를 <br className="hidden md:block"/> 넘을 시간입니다</>,
            <>It's time to break through <br className="hidden md:block"/> your conversion limits</>
          )}
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-sm font-medium">
          {t(
            <>단 1분이면 설정이 완료됩니다. <br className="hidden md:block"/> 흔적 없는 완벽한 구매 여정을 지금 바로 시작하세요.</>,
            <>Setup takes just 1 minute. <br className="hidden md:block"/> Start your traceless, seamless purchase journey now.</>
          )}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center justify-center gap-3 px-10 py-5 text-xl font-extrabold text-white bg-gray-900 rounded-full hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        >
          <Zap className="w-7 h-7 fill-yellow-400 text-yellow-400" />
          {t('1초만에 연결하기', 'Connect in 1 Second')}
        </button>
      </div>
    </section>
  );
};

export default FinalCTA;
