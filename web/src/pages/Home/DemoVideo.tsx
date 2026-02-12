import { Play } from 'lucide-react';

const DemoVideo = () => (
  <section className="relative z-10 py-24 bg-[#0B0914]">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">어떻게 작동하나요?</h2>
        <p className="text-gray-400 text-lg">흔적 없이 완벽하게 자동화된 구매 전환 프로세스를 확인하세요.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#151221] shadow-2xl overflow-hidden relative group max-w-4xl mx-auto">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1D192B] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="mx-auto flex px-4 py-1 text-xs text-gray-500 bg-[#0B0914] rounded-md border border-white/5">
            share2dm.com/demo
          </div>
        </div>

        <div className="aspect-video bg-gradient-to-br from-[#0B0914] to-[#1a1433] flex items-center justify-center relative">
          <button className="flex items-center justify-center w-20 h-20 bg-purple-600/90 rounded-full backdrop-blur-md shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:scale-110 transition-transform cursor-pointer z-10">
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        </div>
      </div>
    </div>
  </section>
);

export default DemoVideo;
