// hevData.js - מאגר רכבים היברידיים מלאים ומיקרו-היברידיים בלבד (HEV / MHEV) בישראל
// הערכים הם הספק מערכת משולב בכ"ס (hp). יש לאמת מול נתוני יצרן / משרד התחבורה לפני שימוש ייצורי.

const HEV_DATABASE = {
  // ==========================================
  // --- טויוטה (Toyota) & לקסוס (Lexus) ---
  // ==========================================
  "toyota_corolla_1_8": 140,
  "toyota_corolla_2_0_hybrid": 196,
  "toyota_corolla_cross_1_8": 140,
  "toyota_yaris_1_5": 116,
  "toyota_yaris_1_5_130": 130, 
  "toyota_yaris_cross_1_5": 116,
  "toyota_aygo_x_hybrid": 116,
  "toyota_prius_1_8": 122,
  "toyota_prius_2_0": 196,
  "toyota_chr_1_8": 122,
  "toyota_chr_2_0": 184,
  "toyota_rav4_hybrid": 218,
  "toyota_rav4_hybrid_awd": 222,
  "toyota_camry_hybrid": 218,
  "toyota_highlander_hybrid": 248,
  "toyota_sienna_hybrid": 245,
  "toyota_hilux_mhev": 204,
  "toyota_land_cruiser_mhev": 204,
  
  "lexus_ux_250h": 184,
  "lexus_ux_300h": 199,
  "lexus_lbx_hybrid": 136,
  "lexus_nx_350h": 242,
  "lexus_rx_350h": 250,
  "lexus_es_300h": 218,

  // ==========================================
  // --- קבוצת יונדאי (Hyundai) & קיה (Kia) ---
  // ==========================================
  "hyundai_ioniq_hybrid": 141,
  "hyundai_elantra_hybrid": 139,
  "hyundai_kona_hybrid": 141,
  "hyundai_kona_hybrid_141": 141,
  "hyundai_sonata_hybrid": 192,
  "hyundai_i20_mhev": 100, 
  "hyundai_bayon_mhev": 100,
  "hyundai_tucson_hybrid": 230,
  "hyundai_santa_fe_hybrid": 230,
  "hyundai_santa_fe_hybrid_215": 215, 
  
  "kia_niro_hybrid": 141,
  "kia_sorento_hybrid": 230,
  "kia_sportage_hybrid": 230,
  "kia_stonic_mhev": 100,
  "kia_carnival_hybrid": 242,

  // ==========================================
  // --- מותגים יפניים ואמריקאיים נוספים ---
  // ==========================================
  "honda_jazz_hybrid": 122,
  "honda_civic_hybrid": 184,
  "honda_hrv_hybrid": 131,
  "honda_crv_hybrid": 184,
  "honda_crv_hybrid_awd": 184,
  "honda_accord_hybrid": 204,
  "honda_zrv_hybrid": 184, 
  
  "mazda_2_hybrid": 116,
  "mazda_3_mhev": 150,
  "mazda_cx30_mhev": 150,
  "mazda_cx60_hybrid": 327,
  
  "subaru_forester_eboxer": 150,
  "subaru_outback_eboxer": 150,
  "subaru_xv_eboxer": 150,
  "subaru_crosstrek_eboxer": 150,
  
  "suzuki_swift_hybrid": 83,
  "suzuki_vitara_hybrid": 129,
  "suzuki_scross_hybrid": 129,
  "suzuki_s_cross_hybrid": 129,
  "suzuki_ignis_hybrid": 83,
  
  "ford_kuga_hybrid": 190,
  "mitsubishi_outlander_mhev": 163, 

  // ==========================================
  // --- אירופאיות וצרפתיות (Renault / Stellantis) ---
  // ==========================================
  "renault_clio_hybrid": 145,
  "renault_captur_hybrid": 145,
  "renault_austral_hybrid": 200,
  "renault_arkana_hybrid": 145,
  "renault_arkana_mhev": 140,
  "renault_symbioz_hybrid": 145,
  "renault_rafale_hybrid": 200,
  "dacia_duster_hybrid": 140,
  "dacia_jogger_hybrid": 140,
  "dacia_bigster_hybrid": 155,
  "nissan_juke_hybrid": 143,
  "nissan_qashqai_epower": 190,
  "nissan_qashqai_mhev": 158,
  "nissan_xtrail_epower": 213,
  "nissan_xtrail_epower_awd": 213,
  "nissan_x_trail_mhev": 163,
  
  "peugeot_208_hybrid": 136,
  "peugeot_2008_hybrid": 136,
  "peugeot_3008_hybrid": 136,
  "peugeot_5008_hybrid": 136, 
  "citroen_c3_hybrid": 136,
  "opel_grandland_hybrid": 136,
  "opel_mokka_mhev": 136, 
  "opel_frontera_mhev": 136,
  "jeep_avenger_hybrid": 136,
  "fiat_600_hybrid": 136,
  "fiat_500_hybrid": 70,
  "alfa_romeo_tonale_hybrid": 130,

  // ==========================================
  // --- קבוצת VAG (מנועי eTSI ופרימיום) ---
  // ==========================================
  "volkswagen_golf_1_0_etsi": 110,
  "volkswagen_golf_1_5_etsi": 150,
  "skoda_octavia_1_0_etsi": 110,
  "skoda_octavia_1_5_etsi": 150,
  "skoda_kamiq_1_5_etsi": 150,
  "skoda_kodiaq_mhev": 150,
  "skoda_superb_mhev": 150,
  "seat_leon_1_5_etsi": 150,
  "cupra_formentor_1_5_etsi": 150,
  "cupra_leon_1_5_etsi": 150,
  "audi_a3_35_tfsi": 150,
  "audi_q3_35_tfsi": 150,
  "audi_a4_35_tfsi": 150,

  // ==========================================
  // --- מותגי פרימיום וסיניים (HEV / MHEV) ---
  // ==========================================
  "mercedes_c200_mhev": 204,
  "volvo_xc40_b4": 197,
  "volvo_xc60_b5": 250,
  "mg_3_hybrid": 194, 
  "mg_zs_hybrid": 194,
  "mg_hs_hev": 224, 
  "jaecoo_5_hybrid": 145,
  "chery_tiggo_7_pro_hev": 246, 
  "chery_tiggo_4_pro_hybrid": 115,
  "gwm_haval_jolion_hybrid": 189,
  "gwm_haval_h6_hybrid": 243,
  "byd_shark_mhev": 430
};

// מיון לפי כמות מילים/חלקים במפתח
const SORTED_HEV_KEYS = Object.keys(HEV_DATABASE)
  .sort((a, b) => b.split('_').length - a.split('_').length || b.length - a.length);

// הגדרת מילים מזהות רק עבור HEV ו-MHEV 
const HYBRID_TOKENS = new Set(['hev', 'mhev', 'hybrid', 'epower', 'etsi', 'היברידי', 'היברידית']);

function getCombinedHEVPower(manufacturer, model, listedHp, engineCc) {
  if (!manufacturer && !model) return listedHp;

  // נרמול טקסט הקלט
  const cleanInput = `${manufacturer || ''} ${model || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9א-ת]/g, ' '); 

  // פיצול למילים נקיות
  const tokens = cleanInput.split(/\s+/).filter(Boolean);

  // 1. התאמה מול המאגר על בסיס הכלה של מילות המפתח
  for (const key of SORTED_HEV_KEYS) {
    const keyParts = key.split('_');
    const isMatch = keyParts.every(part => tokens.includes(part));
    
    if (isMatch) {
      return HEV_DATABASE[key];
    }
  }

  // 2. רשת ביטחון לרכבים היברידיים שלא נמצאו במאגר (מכפיל רק אם זוהה כהיברידי מוצהר)
  const isHybrid = tokens.some(t => HYBRID_TOKENS.has(t));
  if (isHybrid && listedHp && listedHp >= 70 && listedHp < 130) {
    return Math.round(listedHp * 1.35);
  }

  return listedHp;
}

module.exports = { HEV_DATABASE, getCombinedHEVPower };