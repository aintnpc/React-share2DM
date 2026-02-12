const CompanyCarousel = () => {
  const companies = ['MUSINSA', 'Ohouse', 'ZIGZAG', 'OliveYoung', 'STYLENANDA', 'Amorepacific', 'ABLY', 'KREAM'];

  return (
    <>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <section className="py-12 bg-[#0B0914] border-y border-white/5 overflow-hidden relative z-10">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-gray-500 tracking-widest uppercase">혁신을 이끄는 브랜드들이 이미 사용 중입니다</p>
        </div>
        <div className="relative flex overflow-hidden w-full group">
          <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#0B0914] to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#0B0914] to-transparent pointer-events-none"></div>

          <div className="flex w-max animate-[scroll_30s_linear_infinite] hover:[animation-play-state:paused]">
            {[...companies, ...companies, ...companies].map((company, i) => (
              <div key={i} className="flex items-center justify-center w-48 mx-4 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default">
                <span className="text-2xl font-black tracking-tighter text-white/80">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default CompanyCarousel;
