import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    <div ref={containerRef} className="relative h-[400vh] bg-[#0B0914] text-white">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">

        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-[120px] opacity-80"></div>
        </div>

        <div className={`relative z-10 transition-all duration-700 ease-in-out transform ${step === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 px-4 py-1.5 mb-8 text-sm text-purple-300 border rounded-full bg-purple-900/20 border-purple-500/30">
            <span className="text-base">✨</span> 댓글 없이, 흔적 없이 — 공유만으로 구매 전환
          </div>
        </div>

        <div className="relative z-10 w-full max-w-5xl h-[300px] flex items-center justify-center text-center px-4">

          <div className={`absolute w-full transition-all duration-700 ease-in-out transform ${step === 0 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}`}>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-white">
              아직도 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">"댓글"</span> 달아 달라고 하고 <br /> DM을 보내시나요?
            </h1>
          </div>

          <div className={`absolute w-full transition-all duration-700 ease-in-out transform ${step === 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white mb-6">
              솔직히 본인도 인스타그램 게시물에 <br className="hidden md:block"/> 댓글 안다시지 않나요?
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed">
              댓글 작성한 계정의 90%는 <strong className="text-white">비공개 계정</strong>입니다.<br/>
              사람들은 본인을 노출하기 싫어서 부계정까지 만드는 와중에 댓글을 달까요?
            </p>
          </div>

          <div className={`absolute w-full transition-all duration-700 ease-in-out transform ${step === 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
              세계최초 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">공유기반</span> DM자동화
              <br /> Share2DM
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              현재 도구들이 놓치고 있는 잠수족(Lurker) 90%를 전환하세요.<br/>
              공유는 어떤 활동 로그에도 남지 않습니다.
            </p>
            <button onClick={() => navigate('/login')} className="px-8 py-4 text-lg font-medium text-white transition-all bg-purple-600 rounded-full hover:bg-purple-500 shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)]">
              지금 무료로 시작하기
            </button>
          </div>

        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-pulse">
          <span className="text-xs text-gray-400 tracking-widest uppercase">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-gray-400 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
