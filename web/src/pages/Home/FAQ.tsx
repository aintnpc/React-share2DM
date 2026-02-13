import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLang } from '../../lib/i18n';

const faqsKo = [
  {
    q: "인스타그램 공식 정책에 위반되지 않나요?",
    a: "전혀 위반되지 않습니다. Share2DM은 Meta가 공식적으로 제공하는 Instagram Messaging Webhook API를 활용하여 개발되었습니다. 불법적인 크롤링이나 매크로가 아니므로 계정 정지 위험 없이 100% 안전하게 사용할 수 있습니다."
  },
  {
    q: "기존에 쓰던 댓글 자동화 툴(Manychat 등)과 같이 쓸 수 있나요?",
    a: "네, 완벽하게 호환됩니다. 기존 서비스의 '댓글 트리거'와 Share2DM의 '공유 트리거'를 동시에 운영하여 시너지를 낼 수 있습니다. 댓글을 편하게 다는 고객과, 흔적을 남기기 싫어하는 잠수족 고객 모두를 잡으세요."
  },
  {
    q: "비공개 계정인 사용자가 공유해도 작동하나요?",
    a: "인스타그램의 개인정보 보호 정책상 비공개 계정의 릴스 활동 내역은 API로 전달되지 않습니다. 이 경우, 해당 사용자에게 '계정을 공개로 전환해야 링크를 받을 수 있습니다'라는 안내 메시지가 자동으로 전송되어 이탈을 방지합니다."
  },
  {
    q: "설정하는 데 개발 지식이 필요한가요?",
    a: "아니요, 전혀 필요하지 않습니다. Share2DM 로그인 후 인스타그램 비즈니스 계정을 클릭 한 번으로 연동하고, 릴스 링크와 보낼 메시지만 입력하면 즉시 작동을 시작합니다. 1분이면 누구나 세팅 가능합니다."
  }
];

const faqsEn = [
  {
    q: "Does this violate Instagram's official policies?",
    a: "Not at all. Share2DM is built on Meta's official Instagram Messaging Webhook API. It uses no illegal scraping or macros, so you can use it 100% safely with zero risk of account suspension."
  },
  {
    q: "Can I use it alongside existing comment automation tools (Manychat, etc.)?",
    a: "Yes, it's fully compatible. Run your existing 'comment trigger' alongside Share2DM's 'share trigger' for maximum synergy. Capture both active commenters and the silent lurkers who avoid leaving traces."
  },
  {
    q: "Does it work when a private account user shares?",
    a: "Due to Instagram's privacy policies, Reels activity from private accounts isn't delivered via the API. In this case, an automated message is sent to the user informing them they need to switch to a public account to receive the link, preventing drop-off."
  },
  {
    q: "Do I need technical knowledge to set it up?",
    a: "No, none at all. Just log in to Share2DM, connect your Instagram Business account with one click, enter your Reels link and message — and it starts working immediately. Anyone can set it up in under a minute."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { lang, t } = useLang();
  const faqs = lang === 'ko' ? faqsKo : faqsEn;

  return (
    <section className="py-24 bg-[#0B0914] relative z-10 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('자주 묻는 질문', 'Frequently Asked Questions')}</h2>
          <p className="text-gray-400 text-lg">{t('새로운 방식에 대한 궁금증을 해결해 드립니다.', 'Get answers to your questions about this new approach.')}</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border ${openIndex === index ? 'border-purple-500/50 bg-[#151221]' : 'border-white/10 bg-[#0B0914]'} rounded-2xl overflow-hidden transition-all`}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className={`font-semibold ${openIndex === index ? 'text-white' : 'text-gray-300'}`}>{faq.q}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              <div
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
