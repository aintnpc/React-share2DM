import React from 'react';
import { TrendingUp, ExternalLink, Quote, Sparkles } from 'lucide-react';

const AlgorithmSecret = () => {
  return (
    <section className="py-24 bg-[#0B0914] relative overflow-hidden border-t border-white/5">
      {/* 배경 조명 효과 */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          {/* 왼쪽: 텍스트 설명 */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Growth Hack Secret</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              고객에게 정보를 주었을 뿐인데, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                알고리즘 노출
              </span>이 폭발합니다.
            </h2>
            
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              인스타그램 릴스 알고리즘의 핵심은 '체류 시간'과 '재공유'입니다. 
              Share2DM을 사용하면 고객이 자연스럽게 릴스를 <strong className="text-white">공유(Send)</strong>하게 유도함으로써, 
              정보 제공과 동시에 계정의 도달률을 폭발적으로 높이는 
              <span className="text-white border-b border-purple-500/50 mx-1">일석이조 효과</span>를 누릴 수 있습니다.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded bg-green-500/20 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-bold">DM 발송 = 가장 강력한 공유 신호</h4>
                  <p className="text-sm text-gray-500 mt-1">알고리즘은 DM 공유를 '가치 있는 콘텐츠'의 척도로 판단합니다.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* 오른쪽: 인용구 카드 */}
          <div className="relative">
            {/* 카드 배경 Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-2xl opacity-20 rounded-3xl transform rotate-3"></div>
            
            <div className="relative bg-[#151221] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
              <Quote className="w-10 h-10 text-purple-500 mb-6 opacity-50" />
              
              <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8">
                "릴스 랭킹에서 가장 중요한 신호 중 하나는 
                <span className="text-purple-400"> '공유(Sends)'</span>입니다. 
                사람들이 콘텐츠를 보고 친구에게 DM으로 보내고 싶어한다면, 
                우리는 그 콘텐츠를 더 많은 사람에게 노출시킵니다."
              </blockquote>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  {/* 아담 모세리 이미지 Placeholder: 실제 이미지 사용 시 src 교체 */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 border border-white/10 overflow-hidden relative">
                     <img 
                       src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Adam_Mosseri_2019.png/640px-Adam_Mosseri_2019.png" 
                       alt="Adam Mosseri" 
                       className="w-full h-full object-cover opacity-90"
                       onError={(e) => {
                         // 이미지 로드 실패 시 fallback
                         e.currentTarget.style.display = 'none';
                       }}
                     />
                     <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-bold bg-[#151221] -z-10">AM</div>
                  </div>
                  <div>
                    <div className="text-white font-bold">Adam Mosseri</div>
                    <div className="text-xs text-gray-500">Head of Instagram</div>
                  </div>
                </div>

                <a 
                  href="https://magneticmag.com/2025/04/instagrams-ceo-finally-explained-the-algorithm-heres-what-it-means-for-djs-artists-and-indie-music-pages/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors group"
                >
                  <span>원본 확인하기</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
              
              <div className="mt-4 text-[10px] text-gray-600">
                * 2025년 4월(최신), 인스타그램 CEO 인터뷰 답변 중
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AlgorithmSecret;