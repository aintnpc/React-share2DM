import { Star } from 'lucide-react';

const Testimonials = () => (
  <section className="py-24 bg-[#0B0914] relative z-10">
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none"></div>
    <div className="max-w-6xl mx-auto px-6 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">수많은 크리에이터와 브랜드의 선택</h2>
        <p className="text-gray-400 text-lg">도입 즉시 눈에 띄게 달라지는 전환율을 경험하세요.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl bg-[#151221] border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1 flex flex-col">
          <div className="flex text-yellow-500 mb-6">
            <Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/>
          </div>
          <p className="text-gray-300 text-base mb-8 leading-relaxed">"기존 댓글 이벤트할 때보다 <strong className="text-white">전환율이 3배 이상 늘었어요.</strong> 고객들이 댓글로 흔적 안 남아서 너무 좋다고 DM으로 따로 피드백을 주십니다."</p>
          <div className="flex items-center gap-4 mt-auto">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg">B</div>
            <div>
              <div className="text-white font-medium">뷰티 브랜드 마케터</div>
              <div className="text-gray-500 text-sm">팔로워 12만명</div>
            </div>
          </div>
        </div>
        <div className="p-8 rounded-3xl bg-[#151221] border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1 flex flex-col">
          <div className="flex text-yellow-500 mb-6">
            <Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/>
          </div>
          <p className="text-gray-300 text-base mb-8 leading-relaxed">"팔로워들한테 <strong className="text-white">'이 릴스 나한테 공유해줘'</strong> 한마디면 알아서 자동 전송되니 너무 편해요. 잠수 타던 팔로워들의 반응이 터졌습니다."</p>
          <div className="flex items-center gap-4 mt-auto">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-lg">I</div>
            <div>
              <div className="text-white font-medium">라이프스타일 크리에이터</div>
              <div className="text-gray-500 text-sm">팔로워 35만명</div>
            </div>
          </div>
        </div>
        <div className="p-8 rounded-3xl bg-[#151221] border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1 flex flex-col">
          <div className="flex text-yellow-500 mb-6">
            <Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/>
          </div>
          <p className="text-gray-300 text-base mb-8 leading-relaxed">"타 자동화 서비스 대비 가격도 합리적이고 무엇보다 <strong className="text-white">설정이 1분만에 끝납니다.</strong> 팀원 누구나 쉽게 캠페인을 세팅할 수 있어요."</p>
          <div className="flex items-center gap-4 mt-auto">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center font-bold text-white text-lg">S</div>
            <div>
              <div className="text-white font-medium">스타트업 그로스 리드</div>
              <div className="text-gray-500 text-sm">IT 서비스사</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Testimonials;
