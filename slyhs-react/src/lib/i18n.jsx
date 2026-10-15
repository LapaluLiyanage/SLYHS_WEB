import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* UI strings from the SLYHS Home v2 + Join designs. */
export const DICT = {
  en: {
    nav: ['About', 'Learn', 'Research', 'Conserve & Rescue', 'Events', 'Blog', 'Contact'], join: 'Join the Society', learnMore: 'Learn more',
    badgeNew: 'New', badge: 'First online meeting · Nov 2026',
    h1a: "Sri Lanka's young herpetologists,", h1b: 'connected.',
    sub: "Study, protect and share the island's snakes, other reptiles and amphibians, together with researchers at home and around the world.",
    checks: ['No annual fee', 'Ages 15 and up', 'Sinhala · Tamil · English'], safetyLabel: 'Found a snake?',
    whyTitle: 'Why it matters', pathTitle: 'Your path in the society', eventsTitle: 'Upcoming events', startReg: 'Start registration',
    partnersTitle: 'Mentors & partners', newsTitle: 'Newsletter', subscribe: 'Subscribe', subscribed: "You're on the list: ",
    noFee: 'No annual fee at the start', title: 'Join the Society',
    intro: "Learn alongside people who care about the island's snakes, lizards, turtles and frogs. Train, research and rescue safely, with mentors beside you.",
    formTitle: 'Become a member', steps: ['About you', 'Your interests', 'How you take part', 'Consent & submit'],
    next: 'Continue', back: 'Back', submit: 'Submit registration', submitting: 'Submitting…', home: 'Home'
  },
  si: {
    nav: ['අප ගැන', 'ඉගෙනගන්න', 'පර්යේෂණ', 'සංරක්ෂණය සහ බේරාගැනීම', 'සිදුවීම්', 'බ්ලොග්', 'සම්බන්ධ වන්න'], join: 'සංගමයට එක්වන්න', learnMore: 'තව දැනගන්න',
    badgeNew: 'නව', badge: 'පළමු මාර්ගගත රැස්වීම · 2026 නොවැ.',
    h1a: 'ශ්‍රී ලංකාවේ තරුණ උරග විද්‍යාඥයින්,', h1b: 'එක්ව.',
    sub: 'දිවයිනේ සර්පයින්, උරගයින් සහ උභයජීවීන් දේශීය හා ලොව පුරා පර්යේෂකයින් සමඟ අධ්‍යයනය කරමු, ආරක්ෂා කරමු, බෙදාගනිමු.',
    checks: ['වාර්ෂික ගාස්තුවක් නැත', 'වයස 15+', 'සිංහල · தமிழ் · English'], safetyLabel: 'සර්පයෙකු හමු වුණාද?',
    whyTitle: 'මෙය වැදගත් ඇයි', pathTitle: 'සංගමය තුළ ඔබේ ගමන', eventsTitle: 'ඉදිරි සිදුවීම්', startReg: 'ලියාපදිංචිය අරඹන්න',
    partnersTitle: 'උපදේශකයින් සහ හවුල්කරුවන්', newsTitle: 'පුවත් ලිපිය', subscribe: 'දායක වන්න', subscribed: "You're on the list: ",
    noFee: 'මුලදී වාර්ෂික ගාස්තුවක් නැත', title: 'සංගමයට එක්වන්න',
    intro: 'දිවයිනේ සර්පයින්, කටුස්සන්, කැස්බෑවන් සහ ගෙම්බන් ගැන සැලකිලිමත් අය සමඟ ඉගෙන ගන්න.',
    formTitle: 'සාමාජිකයෙකු වන්න', steps: ['ඔබ ගැන', 'ඔබේ උනන්දුව', 'සහභාගී වන ආකාරය', 'එකඟතාව සහ යොමු කිරීම'],
    next: 'ඉදිරියට', back: 'ආපසු', submit: 'ලියාපදිංචිය යොමු කරන්න', submitting: 'යොමු කරමින්…', home: 'මුල් පිටුව'
  },
  ta: {
    nav: ['எங்களைப் பற்றி', 'கற்க', 'ஆய்வு', 'பாதுகாப்பு & மீட்பு', 'நிகழ்வுகள்', 'வலைப்பதிவு', 'தொடர்பு'], join: 'சங்கத்தில் சேருங்கள்', learnMore: 'மேலும் அறிக',
    badgeNew: 'புதியது', badge: 'முதல் இணையக் கூட்டம் · நவ. 2026',
    h1a: 'இலங்கையின் இளம் ஊர்வனவியலாளர்கள்,', h1b: 'இணைந்து.',
    sub: 'தீவின் பாம்புகள், ஊர்வன மற்றும் நீர்நில வாழ்வனவற்றை உள்நாட்டு மற்றும் உலக ஆய்வாளர்களுடன் ஆய்வு செய்வோம், பாதுகாப்போம், பகிர்வோம்.',
    checks: ['ஆண்டுக் கட்டணம் இல்லை', 'வயது 15+', 'සිංහල · தமிழ் · English'], safetyLabel: 'பாம்பைக் கண்டீர்களா?',
    whyTitle: 'இது ஏன் முக்கியம்', pathTitle: 'சங்கத்தில் உங்கள் பாதை', eventsTitle: 'வரவிருக்கும் நிகழ்வுகள்', startReg: 'பதிவைத் தொடங்குங்கள்',
    partnersTitle: 'வழிகாட்டிகள் & பங்காளர்கள்', newsTitle: 'செய்திமடல்', subscribe: 'பதிவு செய்க', subscribed: "You're on the list: ",
    noFee: 'தொடக்கத்தில் ஆண்டுக் கட்டணம் இல்லை', title: 'சங்கத்தில் சேருங்கள்',
    intro: 'தீவின் பாம்புகள், பல்லிகள், ஆமைகள் மற்றும் தவளைகள் மீது அக்கறை கொண்டவர்களுடன் கற்றுக்கொள்ளுங்கள்.',
    formTitle: 'உறுப்பினராகுங்கள்', steps: ['உங்களைப் பற்றி', 'உங்கள் ஆர்வங்கள்', 'பங்கேற்கும் விதம்', 'ஒப்புதல் & சமர்ப்பிப்பு'],
    next: 'தொடரவும்', back: 'பின்செல்', submit: 'பதிவைச் சமர்ப்பிக்கவும்', submitting: 'சமர்ப்பிக்கிறது…', home: 'முகப்பு'
  }
};

const STORE_KEY = 'slyhs-lang';
const LangContext = createContext({ lang: 'en', t: DICT.en, setLang: () => {} });

function initialLang() {
  try {
    const l = localStorage.getItem(STORE_KEY);
    if (l && DICT[l]) return l;
  } catch (e) { /* storage unavailable */ }
  return 'en';
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((l) => {
    if (!DICT[l]) return;
    setLangState(l);
    try { localStorage.setItem(STORE_KEY, l); } catch (e) { /* storage unavailable */ }
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo(() => ({ lang, t: DICT[lang], setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
