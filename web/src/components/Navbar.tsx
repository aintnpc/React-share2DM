import { useNavigate, useLocation } from 'react-router-dom';
import { Share2, ArrowRight } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 md:py-5 bg-[#0B0914]/80 backdrop-blur-md border-b border-white/5">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => navigate('/')}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 group-hover:scale-105 transition-transform">
          <Share2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">share2dm</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <button
          onClick={() => navigate('/')}
          className={`transition-colors ${currentPath === '/' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
          홈
        </button>
        <button
          onClick={() => navigate('/pricing')}
          className={`transition-colors ${currentPath === '/pricing' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
          요금제
        </button>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => navigate('/login')}
          className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          로그인
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 md:px-5 md:py-2 text-xs md:text-sm font-medium text-white transition-all bg-white/5 border border-white/10 rounded-full hover:bg-white/10"
        >
          무료로 시작하기 <ArrowRight className="inline w-3 h-3 md:w-4 md:h-4 ml-1" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
