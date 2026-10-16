// Fixed lists of crops and mandis. The slug (ASCII, snake_case) is what we store
// in Arkiv attributes so queries match exactly. Display names live here and in the UI,
// not on-chain.

export interface Named {
  slug: string
  en: string
  hi: string
  mr: string
}

export interface Mandi extends Named {
  state: string
}

export const CROPS: Named[] = [
  { slug: "onion", en: "Onion", hi: "प्याज", mr: "कांदा" },
  { slug: "tomato", en: "Tomato", hi: "टमाटर", mr: "टोमॅटो" },
  { slug: "potato", en: "Potato", hi: "आलू", mr: "बटाटा" },
  { slug: "wheat", en: "Wheat", hi: "गेहूं", mr: "गहू" },
  { slug: "soybean", en: "Soybean", hi: "सोयाबीन", mr: "सोयाबीन" },
  { slug: "cotton", en: "Cotton", hi: "कपास", mr: "कापूस" },
  { slug: "tur", en: "Tur (Pigeon pea)", hi: "अरहर (तूर)", mr: "तूर" },
  { slug: "rice", en: "Rice", hi: "चावल", mr: "तांदूळ" },
]

export const MANDIS: Mandi[] = [
  { slug: "lasalgaon", en: "Lasalgaon", hi: "लासलगांव", mr: "लासलगाव", state: "maharashtra" },
  { slug: "pimpalgaon", en: "Pimpalgaon Baswant", hi: "पिंपलगांव बसवंत", mr: "पिंपळगाव बसवंत", state: "maharashtra" },
  { slug: "nashik", en: "Nashik", hi: "नासिक", mr: "नाशिक", state: "maharashtra" },
  { slug: "pune", en: "Pune", hi: "पुणे", mr: "पुणे", state: "maharashtra" },
  { slug: "vashi", en: "Vashi (Navi Mumbai)", hi: "वाशी (नवी मुंबई)", mr: "वाशी (नवी मुंबई)", state: "maharashtra" },
  { slug: "nagpur", en: "Nagpur", hi: "नागपुर", mr: "नागपूर", state: "maharashtra" },
  { slug: "solapur", en: "Solapur", hi: "सोलापुर", mr: "सोलापूर", state: "maharashtra" },
  { slug: "latur", en: "Latur", hi: "लातूर", mr: "लातूर", state: "maharashtra" },
  { slug: "indore", en: "Indore", hi: "इंदौर", mr: "इंदूर", state: "madhya_pradesh" },
  { slug: "azadpur", en: "Azadpur (Delhi)", hi: "आज़ादपुर (दिल्ली)", mr: "आझादपूर (दिल्ली)", state: "delhi" },
  { slug: "rajkot", en: "Rajkot", hi: "राजकोट", mr: "राजकोट", state: "gujarat" },
]

export const cropBySlug = (slug: string) => CROPS.find((c) => c.slug === slug)
export const mandiBySlug = (slug: string) => MANDIS.find((m) => m.slug === slug)
