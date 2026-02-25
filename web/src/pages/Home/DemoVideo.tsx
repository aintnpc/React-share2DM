import { useLang } from '../../lib/i18n';

const DemoVideo = () => {
  const { t } = useLang();

  return (
    <section className="relative z-10 py-24 bg-[#0B0914]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('어떻게 작동하나요?', 'How does it work?')}</h2>
          <p className="text-gray-400 text-lg">{t('흔적 없이 완벽하게 자동화된 구매 전환 프로세스를 확인하세요.', 'See the fully automated purchase conversion process — completely traceless.')}</p>
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

          <video
            className="w-full"
            controls
            playsInline
          >
            <source src="/share2dm.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
};

export default DemoVideo;
