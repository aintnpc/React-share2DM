import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../lib/i18n';

const Hero = () => {
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useLang();

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { top } = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = containerRef.current.clientHeight - windowHeight;

      let progress = -top / totalScrollable;
      progress = Math.max(0, Math.min(1, progress));

      if (progress < 0.3) {
        setStep(0);
      } else if (progress < 0.65) {
        setStep(1);
      } else {
        setStep(2);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-white text-gray-900">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">

        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] bg-brand-gradient rounded-full blur-[120px] opacity-20"></div>
        </div>

        <div className={`relative z-10 transition-all duration-700 ease-in-out transform ${step === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 px-4 py-1.5 mb-8 text-sm text-brand-dark border rounded-full bg-brand-lavender/10 border-brand-lavender/30">
            <span className="text-base">✨</span> {t('댓글 없이, 흔적 없이 — 공유만으로 구매 전환', 'No comments, no trace — convert with shares alone')}
          </div>
        </div>

        <div className="relative z-10 w-full max-w-5xl h-[300px] flex items-center justify-center text-center px-4">

          <div className={`absolute w-full transition-all duration-700 ease-in-out transform ${step === 0 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}`}>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-gray-900">
              {t(
                <>아직도 <span className="text-transparent bg-clip-text bg-brand-gradient-r">"댓글"</span> 달아 달라고 하고 <br /> DM을 보내시나요?</>,
                <>Still asking followers to <span className="text-transparent bg-clip-text bg-brand-gradient-r">"comment"</span> <br /> before sending a DM?</>
              )}
            </h1>
          </div>

          <div className={`absolute w-full transition-all duration-700 ease-in-out transform ${step === 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-gray-900 mb-6">
              {t(
                <>콘텐츠는 자연스럽게 유지하면서,<br className="hidden md:block"/> 팔로워가 구매하게 할 수 없을까요?</>,
                <>Can you keep your content natural<br className="hidden md:block"/> while still driving purchases?</>
              )}
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-500 leading-relaxed">
              {t(
                <>댓글 이벤트는 피드를 광고판으로 만듭니다.<br/>프로필 링크는 귀찮고, 직접 DM은 한계가 있습니다.</>,
                <>Comment events turn your feed into an ad board.<br/>Bio links are friction, and manual DMs don't scale.</>
              )}
            </p>
          </div>

          <div className={`absolute w-full transition-all duration-700 ease-in-out transform ${step === 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
              {t(
                <>세계최초 <span className="text-transparent bg-clip-text bg-brand-gradient-r">공유기반</span> DM자동화<br /> Share2DM</>,
                <>World's First <span className="text-transparent bg-clip-text bg-brand-gradient-r">Share-Based</span> DM Automation<br /> Share2DM</>
              )}
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
              {t(
                <>피드 분위기는 그대로, 구매 링크는 DM으로 자동 전달.<br/>소란 없이. 링크만.</>,
                <>Your feed stays as is. Purchase links delivered via DM, automatically.<br/>No noise. Just links.</>
              )}
            </p>
            <button onClick={() => navigate('/login')} className="px-8 py-4 text-lg font-medium text-white transition-all bg-brand-gradient rounded-full hover:opacity-90 shadow-[0_0_30px_rgba(155,154,238,0.4)] hover:shadow-[0_0_40px_rgba(155,154,238,0.6)]">
              {t('지금 무료로 시작하기', 'Get Started for Free')}
            </button>
          </div>

        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-pulse">
          <span className="text-xs text-gray-500 tracking-widest uppercase">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-gray-400 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
