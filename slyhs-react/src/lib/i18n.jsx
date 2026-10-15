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
    next: 'Continue', back: 'Back', submit: 'Submit registration', submitting: 'Submitting…', home: 'Home',
    society: "Sri Lankan Young Herpetologists' Society", soon: 'Coming soon', firstMeeting: 'First online meeting', startsIn: 'Starts in', noticeCta: 'See details',
    pillars: [['Connect', 'Meet enthusiasts in every district and researchers across Sri Lanka and the world.'], ['Learn & research', 'Grow from curious to published, with a mentor, open papers and seed grants.'], ['Conserve & rescue', 'Join surveys and train for safe, supervised rescue. Animals first, always.']], yourPath: '↑ Your path',
    statsText: ['recognised amphibian species live in Sri Lanka. About 90% are found nowhere else on Earth.', 'of those amphibian species are threatened with extinction.', 'snake species share the island, but only about five can cause a fatal bite.'], source: 'Source',
    whyH: ['An island of species found', 'nowhere else.'], pathH: ['From first sighting to', 'first paper.'], eventsH: ['Meet the', 'society.'],
    safetyText: 'Keep your distance, keep children and pets away, and call the rescue hotline. Never try to catch or kill it. Snakebite: keep still and go to the nearest hospital immediately.', aidBtn: 'First-aid guide →',
    steps5: [['Curious', 'Attend talks, workshops and supervised field walks.'], ['Contributor', 'Log photo records, join surveys and help with data.'], ['Researcher', 'Run your own project with a mentor beside you.'], ['Author', 'Publish a note, paper or newsletter feature.'], ['Professional', 'Lead surveys, teach and mentor the next cohort.']],
    evTime: 'Time', evWhere: 'Where', evLang: 'Language', joinBandH: ['Start as an Explorer. Grow into a', 'rescuer, researcher or mentor.'],
    footAbout: "Study, protect and share Sri Lanka's reptiles and amphibians.", proposer: 'Proposer of the society', phoneLabel: 'Phone', explore: 'Explore', policies: 'Policies', privacy: 'Privacy Policy', ethics: 'Code of Ethics', safeguarding: 'Child Safeguarding',
    footNote1: 'All wildlife photos are used with credit and consent. We do not share locations of rare species.', footNote2: 'Hero image: illustrative, credit to be supplied.',
    emailLabel: 'Email address', nlError: "Couldn't subscribe just now. Check your connection and try again.", navAbout: 'About', navLearn: 'Learn', navResearch: 'Research', navConserve: 'Conserve & rescue', navBlog: 'Blog', navJoin: 'Join',
    tiersLabel: 'Membership tiers', tiersH: ['Everyone starts somewhere. Levels are', 'earned, not bought.'], tiersNote: 'Everyone starts as an Explorer or Member. Rescuer and Specialist levels are earned through training and mentor approval.', tiersBold: 'Members under 18 never handle wildlife.'
  },
  si: {
    nav: ['අප ගැන', 'ඉගෙන ගන්න', 'පර්යේෂණ', 'සංරක්ෂණය සහ බේරාගැනීම', 'සිදුවීම්', 'බ්ලොග්', 'සම්බන්ධ වන්න'], join: 'සංගමයට එක්වන්න', learnMore: 'තව දැනගන්න',
    badgeNew: 'නව', badge: 'පළමු මාර්ගගත රැස්වීම · 2026 නොවැ.',
    h1a: 'ශ්‍රී ලංකාවේ තරුණ උරග විද්‍යාඥයින්,', h1b: 'එක්ව.',
    sub: 'දිවයිනේ සර්පයින්, උරගයින් සහ උභයජීවීන් දේශීය හා ලොව පුරා පර්යේෂකයින් සමඟ අධ්‍යයනය කරමු, ආරක්ෂා කරමු, බෙදාගනිමු.',
    checks: ['වාර්ෂික ගාස්තුවක් නැත', 'වයස 15+', 'සිංහල · தமிழ் · English'], safetyLabel: 'සර්පයෙකු හමු වුණාද?',
    whyTitle: 'මෙය වැදගත් ඇයි', pathTitle: 'සංගමය තුළ ඔබේ ගමන', eventsTitle: 'ඉදිරි සිදුවීම්', startReg: 'ලියාපදිංචිය අරඹන්න',
    partnersTitle: 'උපදේශකයින් සහ හවුල්කරුවන්', newsTitle: 'පුවත් ලිපිය', subscribe: 'දායක වන්න', subscribed: "ඔබ ලැයිස්තුවට එක් වී ඇත: ",
    noFee: 'මුලදී වාර්ෂික ගාස්තුවක් නැත', title: 'සංගමයට එක්වන්න',
    intro: 'දිවයිනේ සර්පයින්, කටුස්සන්, කැස්බෑවන් සහ ගෙම්බන් ගැන සැලකිලිමත් අය සමඟ ඉගෙන ගන්න.',
    formTitle: 'සාමාජිකයෙකු වන්න', steps: ['ඔබ ගැන', 'ඔබේ උනන්දුව', 'සහභාගී වන ආකාරය', 'එකඟතාව සහ යොමු කිරීම'],
    next: 'ඉදිරියට', back: 'ආපසු', submit: 'ලියාපදිංචිය යොමු කරන්න', submitting: 'යොමු කරමින්…', home: 'මුල් පිටුව',
    society: 'ශ්‍රී ලංකා තරුණ උරග විද්‍යාඥ සංගමය', soon: 'ඉක්මනින්', firstMeeting: 'පළමු මාර්ගගත රැස්වීම', startsIn: 'ආරම්භයට', noticeCta: 'විස්තර බලන්න',
    pillars: [['සම්බන්ධ වන්න', 'සෑම දිස්ත්‍රික්කයකම සිටින ලැදියන් සහ ශ්‍රී ලංකාව පුරා හා ලොව පුරා සිටින පර්යේෂකයින් හමුවන්න.'], ['ඉගෙනීම සහ පර්යේෂණ', 'උපදේශකයෙකු, විවෘත පර්යේෂණ ලිපි සහ ආරම්භක ප්‍රදාන සමඟ කුතුහලයෙන් පර්යේෂකයෙකු දක්වා වර්ධනය වන්න.'], ['සංරක්ෂණය සහ බේරාගැනීම', 'සමීක්ෂණවලට එක්වන්න, අධීක්ෂණය යටතේ ආරක්ෂිතව සත්ත්වයින් බේරාගැනීමට පුහුණු වන්න. සත්ත්වයාට පළමු තැන.']], yourPath: '↑ ඔබේ ගමන',
    statsText: ['පිළිගත් උභයජීවී විශේෂ ශ්‍රී ලංකාවේ ජීවත් වේ. ඒවායින් 90%ක් පමණ ලොව වෙන කිසිම තැනක නොමැත.', 'ඒ උභයජීවී විශේෂවලින් වඳ වී යාමේ තර්ජනයට ලක්ව ඇති ගණන.', 'සර්ප විශේෂ දිවයිනේ ජීවත් වේ, නමුත් මාරාන්තික දෂ්ට කිරීමක් කළ හැක්කේ පහක් පමණ ය.'], source: 'මූලාශ්‍රය',
    whyH: ['වෙනත් කිසිතැනක නොමැති විශේෂවලින් පිරුණු', 'දිවයිනක්.'], pathH: ['පළමු දැක්මේ සිට', 'පළමු පර්යේෂණ ලිපිය දක්වා.'], eventsH: ['සංගමය', 'හමුවන්න.'],
    safetyText: 'දුරින් සිටින්න, ළමයින් සහ සුරතල් සතුන් ඈත් කරන්න, බේරාගැනීමේ ක්ෂණික ඇමතුම් අංකයට අමතන්න. කිසිවිටෙකත් අල්ලන්නට හෝ මරන්නට උත්සාහ නොකරන්න. සර්ප දෂ්ට කළහොත් නිශ්චලව සිට වහාම ළඟම රෝහලට යන්න.', aidBtn: 'ප්‍රථමාධාර මාර්ගෝපදේශය →',
    steps5: [['කුතුහලී', 'දේශන, වැඩමුළු සහ අධීක්ෂණය යටතේ ක්ෂේත්‍ර සංචාරවලට සහභාගී වන්න.'], ['දායකයා', 'ඡායාරූප වාර්තා සටහන් කරන්න, සමීක්ෂණවලට එක්වන්න, දත්ත සමඟ උදව් වන්න.'], ['පර්යේෂකයා', 'උපදේශකයෙකු ළඟ සිටිමින් ඔබේම ව්‍යාපෘතියක් කරන්න.'], ['කතුවරයා', 'සටහනක්, පර්යේෂණ ලිපියක් හෝ පුවත් ලිපි ලිපියක් ප්‍රකාශ කරන්න.'], ['වෘත්තිකයා', 'සමීක්ෂණවලට නායකත්වය දෙන්න, ඉගැන්වීම සහ ඊළඟ කණ්ඩායමට මඟ පෙන්වීම කරන්න.']],
    evTime: 'වේලාව', evWhere: 'ස්ථානය', evLang: 'භාෂාව', joinBandH: ['ගවේෂකයෙකු ලෙස අරඹන්න. වර්ධනය වන්න', 'බේරාගන්නෙකු, පර්යේෂකයෙකු හෝ උපදේශකයෙකු ලෙස.'],
    footAbout: 'ශ්‍රී ලංකාවේ උරගයින් සහ උභයජීවීන් අධ්‍යයනය කරමු, ආරක්ෂා කරමු, බෙදාගනිමු.', proposer: 'සංගමයේ යෝජකයා', phoneLabel: 'දුරකථන', explore: 'ගවේෂණය', policies: 'ප්‍රතිපත්ති', privacy: 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය', ethics: 'ආචාර ධර්ම සංග්‍රහය', safeguarding: 'ළමා ආරක්ෂණය',
    footNote1: 'සියලු වනජීවී ඡායාරූප භාවිත කරන්නේ ණය පිළිගැනීම සහ කැමැත්ත සහිතවය. දුර්ලභ විශේෂවල ස්ථාන අපි බෙදා නොගනිමු.', footNote2: 'මුල් පිටුවේ ඡායාරූපය: නිදර්ශනයකි, ණය පිළිගැනීම පසුව එක් කෙරේ.',
    emailLabel: 'විද්‍යුත් තැපැල් ලිපිනය', nlError: 'දැන් දායක කර ගැනීමට නොහැකි විය. සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න.', navAbout: 'අප ගැන', navLearn: 'ඉගෙන ගන්න', navResearch: 'පර්යේෂණ', navConserve: 'සංරක්ෂණය සහ බේරාගැනීම', navBlog: 'බ්ලොග්', navJoin: 'එක්වන්න',
    tiersLabel: 'සාමාජික මට්ටම්', tiersH: ['සෑම කෙනෙක්ම යම් තැනකින් ආරම්භ කරයි. මට්ටම්', 'උපයා ගන්නේ ය, මිලදී ගන්නේ නැත.'], tiersNote: 'සියලුදෙනා ගවේෂකයෙකු හෝ සාමාජිකයෙකු ලෙස ආරම්භ කරයි. බේරාගන්නා සහ විශේෂඥ මට්ටම් ලැබෙන්නේ පුහුණුව සහ උපදේශක අනුමැතිය මඟිනි.', tiersBold: 'වයස 18ට අඩු සාමාජිකයින් කිසිවිටෙකත් වනජීවීන් අල්ලා නොගනී.'
  },
  ta: {
    nav: ['எங்களைப் பற்றி', 'கற்க', 'ஆய்வு', 'பாதுகாப்பு & மீட்பு', 'நிகழ்வுகள்', 'வலைப்பதிவு', 'தொடர்பு'], join: 'சங்கத்தில் சேருங்கள்', learnMore: 'மேலும் அறிக',
    badgeNew: 'புதியது', badge: 'முதல் இணையக் கூட்டம் · நவ. 2026',
    h1a: 'இலங்கையின் இளம் ஊர்வனவியலாளர்கள்,', h1b: 'இணைந்து.',
    sub: 'தீவின் பாம்புகள், ஊர்வன மற்றும் நீர்நில வாழ்வனவற்றை உள்நாட்டு மற்றும் உலக ஆய்வாளர்களுடன் ஆய்வு செய்வோம், பாதுகாப்போம், பகிர்வோம்.',
    checks: ['ஆண்டுக் கட்டணம் இல்லை', 'வயது 15+', 'සිංහල · தமிழ் · English'], safetyLabel: 'பாம்பைக் கண்டீர்களா?',
    whyTitle: 'இது ஏன் முக்கியம்', pathTitle: 'சங்கத்தில் உங்கள் பாதை', eventsTitle: 'வரவிருக்கும் நிகழ்வுகள்', startReg: 'பதிவைத் தொடங்குங்கள்',
    partnersTitle: 'வழிகாட்டிகள் & பங்காளர்கள்', newsTitle: 'செய்திமடல்', subscribe: 'பதிவு செய்க', subscribed: "நீங்கள் பட்டியலில் இணைந்துவிட்டீர்கள்: ",
    noFee: 'தொடக்கத்தில் ஆண்டுக் கட்டணம் இல்லை', title: 'சங்கத்தில் சேருங்கள்',
    intro: 'தீவின் பாம்புகள், பல்லிகள், ஆமைகள் மற்றும் தவளைகள் மீது அக்கறை கொண்டவர்களுடன் கற்றுக்கொள்ளுங்கள்.',
    formTitle: 'உறுப்பினராகுங்கள்', steps: ['உங்களைப் பற்றி', 'உங்கள் ஆர்வங்கள்', 'பங்கேற்கும் விதம்', 'ஒப்புதல் & சமர்ப்பிப்பு'],
    next: 'தொடரவும்', back: 'பின்செல்', submit: 'பதிவைச் சமர்ப்பிக்கவும்', submitting: 'சமர்ப்பிக்கிறது…', home: 'முகப்பு',
    society: 'இலங்கை இளம் ஊர்வனவியலாளர் சங்கம்', soon: 'விரைவில்', firstMeeting: 'முதல் இணையக் கூட்டம்', startsIn: 'தொடங்க', noticeCta: 'விவரங்களைக் காண்க',
    pillars: [['இணையுங்கள்', 'ஒவ்வொரு மாவட்டத்திலும் உள்ள ஆர்வலர்களையும் இலங்கை மற்றும் உலகெங்கும் உள்ள ஆய்வாளர்களையும் சந்தியுங்கள்.'], ['கற்றல் & ஆய்வு', 'வழிகாட்டி, திறந்த ஆய்வுக் கட்டுரைகள் மற்றும் தொடக்க மானியங்களுடன் ஆர்வலரிலிருந்து ஆய்வாளராக வளருங்கள்.'], ['பாதுகாப்பு & மீட்பு', 'ஆய்வுகளில் இணைந்து, மேற்பார்வையுடன் பாதுகாப்பான மீட்புக்குப் பயிற்சி பெறுங்கள். விலங்குகளுக்கே முதலிடம்.']], yourPath: '↑ உங்கள் பாதை',
    statsText: ['அங்கீகரிக்கப்பட்ட நீர்நில வாழ்வன இனங்கள் இலங்கையில் வாழ்கின்றன. அவற்றில் சுமார் 90% உலகில் வேறெங்கும் இல்லை.', 'அந்த நீர்நில வாழ்வன இனங்களில் அழிவு அச்சுறுத்தலில் உள்ளவை.', 'பாம்பு இனங்கள் தீவில் வாழ்கின்றன, ஆனால் உயிருக்கு ஆபத்தான கடியை ஏற்படுத்தக்கூடியவை சுமார் ஐந்து மட்டுமே.'], source: 'ஆதாரம்',
    whyH: ['வேறெங்கும் காணப்படாத இனங்களின்', 'தீவு.'], pathH: ['முதல் பார்வையிலிருந்து', 'முதல் ஆய்வுக் கட்டுரை வரை.'], eventsH: ['சங்கத்தை', 'சந்தியுங்கள்.'],
    safetyText: 'தூரத்தில் இருங்கள், குழந்தைகளையும் செல்லப்பிராணிகளையும் விலக்கி வையுங்கள், மீட்பு உதவி எண்ணை அழையுங்கள். ஒருபோதும் பிடிக்கவோ கொல்லவோ முயலாதீர்கள். பாம்புக்கடி ஏற்பட்டால் அசையாமல் இருந்து உடனே அருகிலுள்ள மருத்துவமனைக்குச் செல்லுங்கள்.', aidBtn: 'முதலுதவி வழிகாட்டி →',
    steps5: [['ஆர்வலர்', 'உரைகள், பட்டறைகள் மற்றும் மேற்பார்வையுடன் கூடிய கள நடைகளில் பங்கேற்கவும்.'], ['பங்களிப்பாளர்', 'புகைப்பட பதிவுகளைச் சேர்க்கவும், ஆய்வுகளில் இணையவும், தரவுகளுக்கு உதவவும்.'], ['ஆய்வாளர்', 'வழிகாட்டியின் துணையுடன் உங்கள் சொந்தத் திட்டத்தை நடத்துங்கள்.'], ['எழுத்தாளர்', 'குறிப்பு, ஆய்வுக் கட்டுரை அல்லது செய்திமடல் கட்டுரையை வெளியிடுங்கள்.'], ['தொழில்முறையாளர்', 'ஆய்வுகளை வழிநடத்துங்கள், கற்பியுங்கள், அடுத்த குழுவுக்கு வழிகாட்டுங்கள்.']],
    evTime: 'நேரம்', evWhere: 'இடம்', evLang: 'மொழி', joinBandH: ['ஆய்வுப்பயணியாகத் தொடங்குங்கள். வளருங்கள்', 'மீட்பாளர், ஆய்வாளர் அல்லது வழிகாட்டியாக.'],
    footAbout: 'இலங்கையின் ஊர்வன மற்றும் நீர்நில வாழ்வனவற்றை ஆய்வு செய்வோம், பாதுகாப்போம், பகிர்வோம்.', proposer: 'சங்கத்தை முன்மொழிந்தவர்', phoneLabel: 'தொலைபேசி', explore: 'ஆராய்க', policies: 'கொள்கைகள்', privacy: 'தனியுரிமைக் கொள்கை', ethics: 'நெறிமுறைக் கோட்பாடு', safeguarding: 'குழந்தைப் பாதுகாப்பு',
    footNote1: 'அனைத்து வனவிலங்குப் புகைப்படங்களும் உரிய அங்கீகாரத்துடனும் சம்மதத்துடனும் பயன்படுத்தப்படுகின்றன. அரிய இனங்களின் இருப்பிடங்களை நாங்கள் பகிர மாட்டோம்.', footNote2: 'முகப்புப் படம்: விளக்கப்படம், உரிய அங்கீகாரம் பின்னர் சேர்க்கப்படும்.',
    emailLabel: 'மின்னஞ்சல் முகவரி', nlError: 'இப்போது பதிவு செய்ய முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்.', navAbout: 'எங்களைப் பற்றி', navLearn: 'கற்க', navResearch: 'ஆய்வு', navConserve: 'பாதுகாப்பு & மீட்பு', navBlog: 'வலைப்பதிவு', navJoin: 'சேர',
    tiersLabel: 'உறுப்பினர் நிலைகள்', tiersH: ['எல்லோரும் எங்கோ ஒரு இடத்தில் தொடங்குகிறார்கள். நிலைகள்', 'சம்பாதிக்கப்படுபவை, வாங்கப்படுபவை அல்ல.'], tiersNote: 'அனைவரும் ஆய்வுப்பயணி அல்லது உறுப்பினராகத் தொடங்குகிறார்கள். மீட்பாளர், நிபுணர் நிலைகள் பயிற்சி மற்றும் வழிகாட்டி ஒப்புதலால் பெறப்படுகின்றன.', tiersBold: '18 வயதுக்குட்பட்ட உறுப்பினர்கள் வனவிலங்குகளைக் கையாளவே கூடாது.'
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
