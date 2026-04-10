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
                <>솔직히 본인도 인스타그램 게시물에 <br className="hidden md:block"/> 댓글 안다시지 않나요?</>,
                <>Be honest — do you ever <br className="hidden md:block"/> leave comments on Instagram posts?</>
              )}
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-500 leading-relaxed">
              {t(
                <>댓글 작성한 계정의 90%는 <strong className="text-gray-900">비공개 계정</strong>입니다.<br/>사람들은 본인을 노출하기 싫어서 부계정까지 만드는 와중에 댓글을 달까요?</>,
                <>90% of commenters use <strong className="text-gray-900">private accounts</strong>.<br/>People create alt accounts to stay hidden — would they leave a public comment?</>
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
                <>현재 도구들이 놓치고 있는 잠수족(Lurker) 90%를 전환하세요.<br/>공유는 어떤 활동 로그에도 남지 않습니다.</>,
                <>Convert the 90% of lurkers that current tools miss.<br/>Sharing leaves zero trace in any activity log.</>
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
