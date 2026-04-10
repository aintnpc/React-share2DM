import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../lib/i18n';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { lang, setLang, t } = useLang();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 md:py-5 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => navigate('/')}
      >
        <img
          src={`${process.env.PUBLIC_URL}/share2dm_logo_nobg.png`}
          alt="share2dm"
          className="w-8 h-8 rounded-full group-hover:scale-105 transition-transform"
        />
        <span className="text-xl font-bold text-gray-900 tracking-tight">share2dm</span>
        <a href="https://clozet.my" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 font-medium ml-1 self-end mb-0.5 hover:text-gray-600 transition-colors">powered by clozet</a>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <button
          onClick={() => navigate('/')}
          className={`transition-colors ${currentPath === '/' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
        >
          {t('홈', 'Home')}
        </button>
        <button
          onClick={() => navigate('/pricing')}
          className={`transition-colors ${currentPath === '/pricing' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
        >
          {t('요금제', 'Pricing')}
        </button>
        <button
          onClick={() => navigate('/clozet-connect')}
          className={`transition-colors ${currentPath === '/clozet-connect' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Clozet Connect
        </button>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center text-xs font-medium border border-gray-200 rounded-full overflow-hidden">
          <button
            onClick={() => setLang('ko')}
            className={`px-2.5 py-1.5 transition-colors ${lang === 'ko' ? 'bg-brand-lavender/20 text-brand-dark' : 'text-gray-400 hover:text-gray-600'}`}
          >
            KR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1.5 transition-colors ${lang === 'en' ? 'bg-brand-lavender/20 text-brand-dark' : 'text-gray-400 hover:text-gray-600'}`}
          >
            EN
          </button>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          {t('로그인', 'Log in')}
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 md:px-5 md:py-2 text-xs md:text-sm font-medium text-gray-800 transition-all bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200"
        >
          {t('무료로 시작하기', 'Get Started')} <ArrowRight className="inline w-3 h-3 md:w-4 md:h-4 ml-1" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
