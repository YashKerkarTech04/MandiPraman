import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

export type Lang = "en" | "hi" | "mr"

export const LANGS: { code: Lang; label: string; full: string }[] = [
  { code: "en", label: "EN", full: "English" },
  { code: "hi", label: "हिं", full: "हिन्दी" },
  { code: "mr", label: "मरा", full: "मराठी" },
]

const en = {
  appName: "Mandi Mitra",
  tagline: "Crop prices posted by farmers and traders, kept on Arkiv where they cannot be quietly changed.",
  demoBanner: "Demo data: the prices shown are synthetic, made for this hackathon demo.",
  allCrops: "All crops",
  bestPrice: "Best price",
  median: "Median",
  range: "Range",
  reportsCount: "{n} reports",
  confirmedCount: "{n} confirmed",
  moreThanLowest: "₹{n} more than the lowest",
  noPrices: "No recent prices yet. Be the first to post one.",
  loading: "Loading prices…",
  error: "Could not reach the server. Retrying…",
  perQuintal: "per quintal",
  latestReports: "Latest reports",
  confirm: "Confirm",
  dispute: "Dispute",
  voted: "Thanks, your vote is recorded",
  disputed: "Disputed: not counted in the median",
  expiresIn: "expires in {t}",
  postPrice: "Post a price",
  crop: "Crop",
  mandi: "Mandi",
  price: "Price (₹ per quintal)",
  variety: "Variety or grade (optional)",
  submit: "Post price",
  submitting: "Saving to Arkiv…",
  cancel: "Cancel",
  posted: "Price posted",
  viewTx: "View transaction",
  howItWorks: "How it works",
  step1Title: "Anyone posts a price",
  step1Body: "Farmers and traders report what a crop sold for at a mandi. No crypto wallet needed.",
  step2Title: "Others confirm or dispute",
  step2Body: "The board shows the median of trusted recent reports, so one wrong number cannot move it.",
  step3Title: "Kept on Arkiv",
  step3Body:
    "Each report is a public record on the Arkiv Tiramisu testnet. It cannot be edited after posting, and it expires on its own after {h} hours so old prices disappear.",
  verify: "Check on-chain",
  relayerNote: "All records are signed by one relayer wallet, so farmers do not need any crypto.",
  reporter: "Reporter",
  demoTag: "demo",
  showMore: "Show more",
  priceError: "Enter a price between ₹50 and ₹5,00,000",
  selectCrop: "Choose a crop",
  selectMandi: "Choose a mandi",
  unitD: "d",
  unitH: "h",
  unitM: "m",
  now: "just now",
  footer: "Built for the Arkiv x Devcon 8 challenge. Open source, MIT licensed.",
  posting: "Could not post. Please try again.",
  tooFast: "Too many submissions, please wait a minute.",
}

type Dict = typeof en

const hi: Dict = {
  appName: "मंडी मित्र",
  tagline: "किसानों और व्यापारियों द्वारा दर्ज फसल भाव। Arkiv पर सुरक्षित, इसलिए कोई चुपचाप बदल नहीं सकता।",
  demoBanner: "डेमो डेटा: दिखाए गए भाव नकली (सिंथेटिक) हैं, केवल हैकाथॉन डेमो के लिए।",
  allCrops: "सभी फसलें",
  bestPrice: "सबसे अच्छा भाव",
  median: "मध्य भाव",
  range: "सीमा",
  reportsCount: "{n} रिपोर्ट",
  confirmedCount: "{n} पुष्ट",
  moreThanLowest: "सबसे कम से ₹{n} ज़्यादा",
  noPrices: "अभी कोई ताज़ा भाव नहीं है। पहला भाव आप दर्ज करें।",
  loading: "भाव लोड हो रहे हैं…",
  error: "सर्वर से संपर्क नहीं हो पाया। दोबारा कोशिश जारी है…",
  perQuintal: "प्रति क्विंटल",
  latestReports: "ताज़ा रिपोर्ट",
  confirm: "पुष्टि करें",
  dispute: "गलत बताएं",
  voted: "धन्यवाद, आपका वोट दर्ज हो गया",
  disputed: "विवादित: मध्य भाव में नहीं गिना गया",
  expiresIn: "{t} में समाप्त",
  postPrice: "भाव दर्ज करें",
  crop: "फसल",
  mandi: "मंडी",
  price: "भाव (₹ प्रति क्विंटल)",
  variety: "किस्म या ग्रेड (वैकल्पिक)",
  submit: "भाव दर्ज करें",
  submitting: "Arkiv में सहेजा जा रहा है…",
  cancel: "रद्द करें",
  posted: "भाव दर्ज हो गया",
  viewTx: "ट्रांज़ैक्शन देखें",
  howItWorks: "यह कैसे काम करता है",
  step1Title: "कोई भी भाव दर्ज करे",
  step1Body: "किसान और व्यापारी बताते हैं कि मंडी में फसल किस भाव बिकी। क्रिप्टो वॉलेट की ज़रूरत नहीं।",
  step2Title: "दूसरे पुष्टि या विरोध करें",
  step2Body: "बोर्ड भरोसेमंद ताज़ा रिपोर्टों का मध्य भाव दिखाता है, इसलिए एक गलत संख्या उसे नहीं बदल सकती।",
  step3Title: "Arkiv पर सुरक्षित",
  step3Body:
    "हर रिपोर्ट Arkiv Tiramisu टेस्टनेट पर सार्वजनिक रिकॉर्ड है। दर्ज होने के बाद उसे बदला नहीं जा सकता, और {h} घंटे बाद वह अपने आप हट जाती है, इसलिए पुराने भाव नहीं दिखते।",
  verify: "ऑन-चेन जाँचें",
  relayerNote: "सभी रिकॉर्ड एक रिले वॉलेट से साइन होते हैं, ताकि किसानों को क्रिप्टो की ज़रूरत न पड़े।",
  reporter: "रिपोर्टर",
  demoTag: "डेमो",
  showMore: "और दिखाएं",
  priceError: "₹50 से ₹5,00,000 के बीच भाव डालें",
  selectCrop: "फसल चुनें",
  selectMandi: "मंडी चुनें",
  unitD: "दिन",
  unitH: "घं",
  unitM: "मि",
  now: "अभी",
  footer: "Arkiv x Devcon 8 चैलेंज के लिए बनाया गया। ओपन सोर्स, MIT लाइसेंस।",
  posting: "दर्ज नहीं हो सका। कृपया दोबारा कोशिश करें।",
  tooFast: "बहुत ज़्यादा प्रयास, कृपया एक मिनट रुकें।",
}

const mr: Dict = {
  appName: "मंडी मित्र",
  tagline: "शेतकरी आणि व्यापाऱ्यांनी नोंदवलेले पीक भाव. Arkiv वर सुरक्षित, त्यामुळे कोणीही शांतपणे बदलू शकत नाही.",
  demoBanner: "डेमो डेटा: दाखवलेले भाव कृत्रिम (सिंथेटिक) आहेत, फक्त हॅकेथॉन डेमोसाठी.",
  allCrops: "सर्व पिके",
  bestPrice: "सर्वोत्तम भाव",
  median: "मध्यम भाव",
  range: "श्रेणी",
  reportsCount: "{n} नोंदी",
  confirmedCount: "{n} पुष्टी",
  moreThanLowest: "सर्वात कमी भावापेक्षा ₹{n} जास्त",
  noPrices: "अजून ताजे भाव नाहीत. पहिला भाव तुम्ही नोंदवा.",
  loading: "भाव लोड होत आहेत…",
  error: "सर्व्हरशी संपर्क होऊ शकला नाही. पुन्हा प्रयत्न सुरू आहे…",
  perQuintal: "प्रति क्विंटल",
  latestReports: "ताज्या नोंदी",
  confirm: "पुष्टी करा",
  dispute: "चुकीचे आहे",
  voted: "धन्यवाद, तुमचे मत नोंदवले गेले",
  disputed: "वादग्रस्त: मध्यम भावात धरले नाही",
  expiresIn: "{t} मध्ये संपेल",
  postPrice: "भाव नोंदवा",
  crop: "पीक",
  mandi: "बाजार (मंडी)",
  price: "भाव (₹ प्रति क्विंटल)",
  variety: "जात किंवा ग्रेड (ऐच्छिक)",
  submit: "भाव नोंदवा",
  submitting: "Arkiv मध्ये जतन होत आहे…",
  cancel: "रद्द करा",
  posted: "भाव नोंदवला गेला",
  viewTx: "व्यवहार पहा",
  howItWorks: "हे कसे चालते",
  step1Title: "कोणीही भाव नोंदवू शकतो",
  step1Body: "शेतकरी आणि व्यापारी बाजारात पीक कोणत्या भावाने विकले ते सांगतात. क्रिप्टो वॉलेट लागत नाही.",
  step2Title: "इतर पुष्टी किंवा विरोध करतात",
  step2Body: "बोर्ड विश्वासार्ह ताज्या नोंदींचा मध्यम भाव दाखवतो, त्यामुळे एक चुकीचा आकडा तो बदलू शकत नाही.",
  step3Title: "Arkiv वर सुरक्षित",
  step3Body:
    "प्रत्येक नोंद Arkiv Tiramisu टेस्टनेटवर सार्वजनिक रेकॉर्ड आहे. नोंदवल्यानंतर ती बदलता येत नाही आणि {h} तासांनी आपोआप हटते, त्यामुळे जुने भाव दिसत नाहीत.",
  verify: "ऑन-चेन तपासा",
  relayerNote: "सर्व नोंदी एका रिले वॉलेटने साइन होतात, त्यामुळे शेतकऱ्यांना क्रिप्टो लागत नाही.",
  reporter: "नोंदवणारा",
  demoTag: "डेमो",
  showMore: "आणखी दाखवा",
  priceError: "₹50 ते ₹5,00,000 दरम्यान भाव टाका",
  selectCrop: "पीक निवडा",
  selectMandi: "मंडी निवडा",
  unitD: "दि",
  unitH: "ता",
  unitM: "मि",
  now: "आत्ताच",
  footer: "Arkiv x Devcon 8 आव्हानासाठी बनवले. ओपन सोर्स, MIT परवाना.",
  posting: "नोंदवता आले नाही. कृपया पुन्हा प्रयत्न करा.",
  tooFast: "खूप प्रयत्न झाले, कृपया एक मिनिट थांबा.",
}

const dictionaries: Record<Lang, Dict> = { en, hi, mr }

export type Key = keyof Dict
type Vars = Record<string, string | number>

// A message to show in a toast: either a translation key (re-translated live if the language
// changes) or literal text, used for error messages that come from the server.
export interface ToastMsg {
  key?: Key
  text?: string
}

export interface Named {
  slug: string
  en: string
  hi: string
  mr: string
}

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Key, vars?: Vars) => string
  name: (n: Named | undefined, fallback?: string) => string
}

const Ctx = createContext<I18n | null>(null)
const STORAGE_KEY = "mandi_lang"

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "en" || saved === "hi" || saved === "mr") return saved
  } catch {
    /* storage can be blocked: fall through */
  }
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en"
  if (nav.startsWith("hi")) return "hi"
  if (nav.startsWith("mr")) return "mr"
  return "en"
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    document.documentElement.lang = l
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<I18n>(() => {
    const dict = dictionaries[lang]
    return {
      lang,
      setLang,
      t: (key, vars) => {
        let s: string = dict[key]
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
        return s
      },
      name: (n, fallback = "") => (n ? n[lang] || n.en : fallback),
    }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error("useI18n must be used inside I18nProvider")
  return v
}

export const STATE_NAMES: Record<string, Named> = {
  maharashtra: { slug: "maharashtra", en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र" },
  madhya_pradesh: { slug: "madhya_pradesh", en: "Madhya Pradesh", hi: "मध्य प्रदेश", mr: "मध्य प्रदेश" },
  gujarat: { slug: "gujarat", en: "Gujarat", hi: "गुजरात", mr: "गुजरात" },
  delhi: { slug: "delhi", en: "Delhi", hi: "दिल्ली", mr: "दिल्ली" },
}
