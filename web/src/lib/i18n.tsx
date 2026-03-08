import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'ko' | 'en';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: <T extends ReactNode>(ko: T, en: T) => T;
}

const LangContext = createContext<LangContextType>({
  lang: 'ko',
  setLang: () => {},
  t: (ko) => ko,
});

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang');
    return saved === 'en' ? 'en' : 'ko';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l);
    setLangState(l);
  };

  const t = <T extends ReactNode>(ko: T, en: T): T => (lang === 'ko' ? ko : en);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
