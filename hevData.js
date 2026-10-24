// hevData.js - מאגר רכבים היברידיים מלאים ומיקרו-היברידיים (HEV / MHEV) בישראל

const HE_TO_EN_MAP = {
  "טויוטה": "toyota", "לקסוס": "lexus", "יונדאי": "hyundai", "קיה": "kia",
  "הונדה": "honda", "מאזדה": "mazda", "מזדה": "mazda", "סוזוקי": "suzuki",
  "סובארו": "subaru", "רנו": "renault", "דאציה": "dacia", "דאצ'יה": "dacia",
  "ניסאן": "nissan", "פולקסווגן": "volkswagen", "פולקסוואגן": "volkswagen",
  "סקודה": "skoda", "סיאט": "seat", "קופרה": "cupra", "אאודי": "audi", "אודי": "audi",
  "פיג'ו": "peugeot", "פיגו": "peugeot", "סיטרואן": "citroen", "אופל": "opel",
  "ג'יפ": "jeep", "גיפ": "jeep", "פיאט": "fiat", "אלפא": "alfa",
  "מרצדס": "mercedes", "וולוו": "volvo", "וולבו": "volvo", "אם ג'י": "mg", "מ.ג": "mg",
  "ג'אקו": "jaecoo", "גאקו": "jaecoo", "צ'רי": "chery", "צריי": "chery",
  "פורד": "ford", "מיצובישי": "mitsubishi",
  "קורולה": "corolla", "קרוס": "cross", "יאריס": "yaris", "אוריס": "auris",
  "פריוס": "prius", "קאמרי": "camry", "ראב": "rav4", "ראב4": "rav4",
  "היילנדר": "highlander", "סיינה": "sienna", "איוניק": "ioniq", "אלנטרה": "elantra",
  "קונה": "kona", "סונטה": "sonata", "טוסון": "tucson", "סנטה": "santa",
  "נירו": "niro", "ספורטאז": "sportage", "סורנטו": "sorento", "סטוניק": "stonic",
  "ג'אז": "jazz", "סיוויק": "civic", "סוויפט": "swift", "ויטארה": "vitara",
  "קפצ'ור": "captur", "אוסטרל": "austral", "ארקנה": "arkana", "דאסטר": "duster",
  "קשקאי": "qashqai"
};

const HEV_DATABASE = {
  // --- טויוטה ---
  "toyota_corolla_cross": 140,
  "toyota_corolla": 140,
  "toyota_auris": 136,
  "toyota_yaris_cross": 116,
  "toyota_yaris": 116,
  "toyota_prius": 122,
  "toyota_chr": 140,
  "toyota_c_hr": 140,
  "toyota_rav4": 218,
  "toyota_camry": 218,
  "toyota_highlander": 248,
  "toyota_sienna": 245,

  // --- לקסוס ---
  "lexus_lbx": 136,
  "lexus_ux": 184,
  "lexus_nx": 242,
  "lexus_rx": 250,
  "lexus_es": 218,

  // --- יונדאי וקיה ---
  "hyundai_ioniq": 141,
  "hyundai_elantra": 139,
  "hyundai_kona": 141,
  "hyundai_sonata": 192,
  "hyundai_tucson": 230,
  "hyundai_santa_fe": 230,
  "hyundai_bayon": 100,
  "hyundai_i20": 100,

  "kia_niro": 141,
  "kia_sportage": 230,
  "kia_sorento": 230,
  "kia_stonic": 100,
  "kia_carnival": 242,

  // --- הונדה ---
  "honda_jazz": 122,
  // סיוויק היברידית היא רק דור 11 החדש (מנוע 2.0 ליטר e:HEV)
  "honda_civic_ehev": 184,
  "honda_hrv": 131,
  "honda_hr_v": 131,
  "honda_crv": 184,
  "honda_cr_v": 184,
  "honda_zrv": 184,

  // --- סוזוקי ---
  "suzuki_swift": 83,
  "suzuki_vitara": 129,
  "suzuki_scross": 129,
  "suzuki_s_cross": 129,
  "suzuki_ignis": 83,

  // --- רנו, ניסאן ודאצ'יה ---
  "renault_clio": 145,
  "renault_captur": 145,
  "renault_austral": 200,
  "renault_arkana": 145,
  "dacia_duster": 140,
  "dacia_jogger": 140,
  "nissan_qashqai": 190,
  "nissan_xtrail": 213,
  "nissan_x_trail": 213,

  // --- MG ---
  "mg_3_luxury": 192
};

const SORTED_HEV_KEYS = Object.keys(HEV_DATABASE).sort((a, b) => b.length - a.length);
const HYBRID_KEYWORDS = ['hybrid', 'hev', 'mhev', 'היברידי', 'היברידית', 'משולב', 'epower', 'e-power', 'etsi', 'e:hev', 'ehev'];

function getCombinedHEVPower(manufacturer, model, listedHp, engineCc, fuelType) {
  if (!listedHp) return listedHp;

  const fullText = `${manufacturer || ''} ${model || ''} ${fuelType || ''}`.toLowerCase();
  const cc = Number(engineCc) || 0;

  // 1. הגנה: מנועי 1.8 ומעלה בנזין רגיל (כולל 1798/1799 סמ"ק של הונדה ומשפחתיות בנזין)
  if (cc >= 1750 && listedHp >= 135 && !HYBRID_KEYWORDS.some(kw => fullText.includes(kw))) {
    return listedHp;
  }

  // 2. תרגום מעברית לאנגלית
  let normalized = fullText;
  for (const [he, en] of Object.entries(HE_TO_EN_MAP)) {
    if (normalized.includes(he)) {
      normalized += ` ${en}`;
    }
  }

  const cleanStr = normalized.replace(/[^a-z0-9]/g, '');

  // 3. חיפוש במאגר
  for (const key of SORTED_HEV_KEYS) {
    const keyClean = key.replace(/_/g, '');
    const keyParts = key.split('_');

    const matchParts = keyParts.every(part => cleanStr.includes(part));
    if (matchParts || cleanStr.includes(keyClean)) {
      // בדיקה נוספת לסיוויק: רק דגם 2.0 ליטר הוא היברידי
      if (key.includes('civic') && cc < 1900 && !HYBRID_KEYWORDS.some(kw => fullText.includes(kw))) {
        return listedHp;
      }

      const targetHp = HEV_DATABASE[key];
      // תיקון מבוצע רק אם הוא באמת מוסיף כוח סוס (חשמל)
      if (targetHp > listedHp) {
        return targetHp;
      }
      return listedHp;
    }
  }

  // 4. רשת ביטחון דינמית לרכבים היברידיים מוצהרים בלבד
  const isDeclaredHybrid = HYBRID_KEYWORDS.some(kw => fullText.includes(kw));
  if (isDeclaredHybrid && listedHp >= 70 && listedHp <= 135) {
    const estimated = Math.round(listedHp * 1.35);
    if (estimated > listedHp) return estimated;
  }

  return listedHp;
}

module.exports = { HEV_DATABASE, getCombinedHEVPower };