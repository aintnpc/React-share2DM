import { useNavigate } from 'react-router-dom';
import { Instagram, Twitter, Github, Mail } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="py-16 md:py-24 bg-[#05040a] border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-900/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src={`${process.env.PUBLIC_URL}/share2dm_logo_nobg.png`}
                alt="share2dm"
                className="w-6 h-6 rounded-full"
              />
              <span className="text-xl font-bold text-white tracking-tight">share2dm</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              댓글 없이, 흔적 없이 — 공유만으로 완벽하게 이어지는 인스타그램 구매 전환 자동화 솔루션.
            </p>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 transition-all border border-white/5">
                <Instagram className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 transition-all border border-white/5">
                <Twitter className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 transition-all border border-white/5">
                <Github className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">제품</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><button onClick={() => navigate('/')} className="hover:text-purple-400 transition-colors">홈</button></li>
              <li><button className="hover:text-purple-400 transition-colors">기능 소개</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-purple-400 transition-colors">요금제</button></li>
              <li><button className="hover:text-purple-400 transition-colors">성공 사례</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">회사</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><button onClick={() => navigate('/terms/service')} className="hover:text-purple-400 transition-colors">이용약관</button></li>
              <li><button onClick={() => navigate('/terms/privacy')} className="hover:text-purple-400 transition-colors">개인정보처리방침</button></li>
              <li><a href="mailto:share2dm@gmail.com" className="hover:text-purple-400 transition-colors">문의하기</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">고객 지원</h4>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-4">궁금한 점이 있으신가요?</p>
              <a href="mailto:share2dm@gmail.com" className="flex items-center gap-2 text-sm text-white hover:text-purple-400 transition-colors">
                <Mail className="w-4 h-4" /> share2dm@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; 2026 share2dm. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by <span className="text-gray-300 font-semibold">share2dm</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
