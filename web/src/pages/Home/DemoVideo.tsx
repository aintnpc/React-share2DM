import { useLang } from '../../lib/i18n';

const DemoVideo = () => {
  const { t } = useLang();

  return (
    <section className="relative z-10 py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('어떻게 작동하나요?', 'How does it work?')}</h2>
          <p className="text-gray-500 text-lg">{t('흔적 없이 완벽하게 자동화된 구매 전환 프로세스를 확인하세요.', 'See the fully automated purchase conversion process — completely traceless.')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden relative group max-w-4xl mx-auto">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="mx-auto flex px-4 py-1 text-xs text-gray-400 bg-white rounded-md border border-gray-200">
              share2dm.xyz/demo
            </div>
          </div>

          <video
            className="w-full"
            controls
            playsInline
            muted
          >
            <source src="/share2dm.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
};

export default DemoVideo;
