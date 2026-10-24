// phevData.js - מאגר רכבי פלאג-אין הייבריד (PHEV) בישראל

const HE_TO_EN_MAP = {
  "קופרה": "cupra", "סיאט": "seat", "סקודה": "skoda", "פולקסווגן": "volkswagen",
  "פולקסוואגן": "volkswagen", "אאודי": "audi", "אודי": "audi", "טויוטה": "toyota",
  "לקסוס": "lexus", "יונדאי": "hyundai", "קיה": "kia", "במוו": "bmw", "ב.מ.וו": "bmw",
  "מרצדס": "mercedes", "וולוו": "volvo", "וולבו": "volvo", "פיג'ו": "peugeot",
  "פיגו": "peugeot", "סיטרואן": "citroen", "אופל": "opel", "ג'יפ": "jeep", "גיפ": "jeep",
  "אם ג'י": "mg", "מ.ג": "mg", "מיצובישי": "mitsubishi", "רנו": "renault",
  "פורד": "ford", "פורשה": "porsche", "בי וי די": "byd", "בי ווי די": "byd",
  "פורמנטור": "formentor", "לאון": "leon", "אוקטביה": "octavia", "סופרב": "superb",
  "גולף": "golf", "טיגואן": "tiguan", "ראב": "rav4", "ראב4": "rav4", "פריוס": "prius",
  "ספורטאז": "sportage", "סורנטו": "sorento", "נירו": "niro", "טוסון": "tucson"
};

const PHEV_DATABASE = {
  // קבוצת צ'רי / ג'אקו / אומודה / ג'טור
  "jaecoo_5": 204,
  "jaecoo_7": 347,
  "jaecoo_8": 597,
  "chery_tiggo_8": 324,
  "chery_tiggo_7": 347,
  "chery_tiggo_9_phev": 381,
  "chery_arrizo_8": 347,
  "omoda_7": 347,
  "omoda_9": 597,
  "jetour_t2_phev": 381,
  "jetour_dashing_phev": 326,

  // BYD, Denza & Yangwang
  "byd_seal_u": 324,
  "byd_song_plus": 218,
  "byd_seal_5_dmi": 212,
  "byd_sealion_5_dmi": 213,
  "byd_sealion_6": 324,
  "byd_sealion_05_dmi": 218,
  "byd_seal_06_dmi": 218,
  "byd_seal_07_dmi": 270,
  "byd_song_l_dmi": 218,
  "byd_atto_2_dmi": 212,
  "byd_atto_8_dmi": 324,
  "byd_shark": 430,
  "byd_han_phev": 272,
  "byd_han_phev_awd": 544,
  "byd_tang_dmp": 517,
  "denza_d9_dmi": 407,
  "denza_z9_gt_dmi": 858,
  "yangwang_u8": 1197,

  // Geely, Leapmotor, Deepal, Avatr, Li Auto, Seres, Dongfeng & Voyah
  "geely_starray_phev": 218,
  "leapmotor_b10_reev": 218,
  "leapmotor_c10_reev": 231,
  "leapmotor_c16_reev": 231,
  "deepal_s05_phev": 218,
  "deepal_s07_phev": 259,
  "deepal_s07_reev": 238,
  "deepal_l07_reev": 238,
  "avatr_07_reev": 314,
  "li_auto_l6": 408,
  "li_auto_l7": 449,
  "li_auto_l8": 449,
  "li_auto_l9": 449,
  "seres_7_erev": 449,
  "seres_9_erev": 496,
  "dongfeng_mage_phev": 299,
  "forthing_friday_phev": 218,
  "voyah_free_phev": 490,
  "voyah_dream_phev": 394,
  "voyah_passion_phev": 530,

  // GWM Tank & Wey
  "tank_300_phev": 408,
  "tank_500_phev": 408,
  "tank_700_phev": 523,
  "wey_coffee_01": 476,
  "wey_coffee_02": 365,
  "wey_05": 476,
  "wey_03": 442,

  // MG & Lynk & Co
  "mg_3_phev": 194,
  "mg_3_luxury": 194,
  "mg_ehs": 258,
  "mg_ehs_2025": 272,
  "mg_hs_phev": 258,
  "mg_hs_phev_2025": 339,
  "mg_s9_phev": 299,
  "lynk_01": 261,
  "lynk_01_2025": 280,
  "lynk_08": 350,
  "lynk_09_emp": 519,

  // קבוצת VAG (קופרה, סקודה, פולקסווגן, אאודי, פורשה, בנטלי, למבורגיני)
  "cupra_formentor_vz": 245,
  "cupra_formentor_phev": 204,
  "cupra_formentor_245": 245,
  "cupra_leon_vz": 245,
  "cupra_leon_phev": 204,
  "cupra_terramar_phev": 272,
  "cupra_terramar_phev_204": 204,
  "skoda_octavia_rs_iv": 245,
  "skoda_octavia_iv": 204,
  "skoda_superb_iv": 218,
  "skoda_superb_phev_2025": 204,
  "skoda_kodiaq_phev": 204,
  "volkswagen_golf_gte": 245,
  "volkswagen_golf_gte_2025": 272,
  "volkswagen_passat_gte": 218,
  "volkswagen_arteon_ehybrid": 218,
  "volkswagen_tiguan_phev": 204,
  "volkswagen_tiguan_phev_2025": 272,
  "volkswagen_multivan_ehybrid": 218,
  "volkswagen_california_ehybrid": 245,
  "volkswagen_touareg_r": 462,
  "audi_a3_e-tron": 204,
  "audi_a3_45_tfsi_e": 245,
  "audi_q3_tfsi_e": 245,
  "audi_q5_tfsi_e": 299,
  "audi_q5_55_tfsi_e": 367,
  "audi_a6_tfsi_e": 299,
  "audi_a6_55_tfsi_e": 367,
  "audi_a7_tfsi_e": 299,
  "audi_a8_tfsi_e": 462,
  "audi_q7_tfsi_e": 381,
  "audi_q7_etron": 373,
  "audi_q8_tfsi_e": 381,
  "audi_q8_55_tfsi_e": 394,
  "audi_q8_60_tfsi_e": 462,
  "porsche_cayenne_e_hybrid": 470,
  "porsche_cayenne_s_e_hybrid": 519,
  "porsche_cayenne_turbo_e_hybrid": 739,
  "porsche_panamera_e_hybrid": 470,
  "porsche_panamera_4s_e_hybrid": 544,
  "porsche_panamera_turbo_e_hybrid": 782,
  "porsche_918_spyder": 887,
  "lamborghini_urus_se": 800,
  "lamborghini_revuelto": 1015,
  "bentley_continental_gt_speed_phev": 782,
  "bentley_flying_spur_phev": 544,
  "bentley_bentayga_phev": 456,

  // Supercars & Hypercars
  "ferrari_296_gtb": 830,
  "ferrari_sf90_stradale": 1000,
  "mclaren_artura": 680,
  "mclaren_p1": 916,
  "aston_martin_valhalla": 1079,
  "mercedes_amg_one": 1063,
  "polestar_1": 609,

  // קבוצת יונדאי / קיה
  "kia_niro_phev": 183,
  "kia_niro_plus_phev": 141,
  "kia_sportage_phev": 265,
  "kia_sportage_phev_2026": 283,
  "kia_sorento_phev": 265,
  "kia_xceed_phev": 141,
  "kia_ceed_phev": 141,
  "kia_optima_phev": 205,
  "hyundai_tucson_phev": 265,
  "hyundai_tucson_phev_2026": 283,
  "hyundai_santa_fe_phev": 265,
  "hyundai_ioniq_phev": 141,
  "hyundai_sonata_phev": 202,

  // טויוטה / לקסוס / סוזוקי / הונדה
  "toyota_rav4_phev": 306,
  "toyota_prius_phev": 223,
  "toyota_c-hr_phev": 223,
  "suzuki_across": 306,
  "lexus_nx_450h": 309,
  "lexus_rx_450h": 309,
  "lexus_rx_500h": 371,
  "lexus_tx_550h_plus": 404,
  "honda_crv_phev": 184,
  "honda_clarity_phev": 212,

  // BMW & Mini
  "bmw_x1_25e": 245,
  "bmw_x1_30e": 326,
  "bmw_x2_25e": 220,
  "bmw_225xe": 224,
  "bmw_230e": 326,
  "bmw_320e": 204,
  "bmw_330e": 292,
  "bmw_520e": 204,
  "bmw_530e": 292,
  "bmw_545e_xdrive": 394,
  "bmw_550e_xdrive": 483,
  "bmw_740e": 326,
  "bmw_745e": 394,
  "bmw_750e": 489,
  "bmw_m760e_xdrive": 571,
  "bmw_x3_30e": 292,
  "bmw_x5_40e": 313,
  "bmw_x5_45e": 394,
  "bmw_x5_50e": 489,
  "bmw_xm": 653,
  "bmw_xm_label_red": 748,
  "bmw_m5_phev": 727,
  "bmw_i8": 374,
  "mini_countryman_phev": 220,

  // Mercedes-Benz
  "mercedes_a250e": 218,
  "mercedes_b250e": 218,
  "mercedes_cla_250e": 218,
  "mercedes_gla_250e": 218,
  "mercedes_c350e": 279,
  "mercedes_c300e": 313,
  "mercedes_c300de": 306,
  "mercedes_e350e": 279,
  "mercedes_e300e": 313,
  "mercedes_e300de": 306,
  "mercedes_e400e": 381,
  "mercedes_amg_e_53_hybrid": 577,
  "mercedes_glc_350e": 320,
  "mercedes_glc_300e": 313,
  "mercedes_glc_400e": 381,
  "mercedes_amg_glc_63_s_e_performance": 680,
  "mercedes_gle_350de": 320,
  "mercedes_gle_400e": 381,
  "mercedes_amg_gle_53_hybrid": 577,
  "mercedes_s450e": 408,
  "mercedes_s500e": 442,
  "mercedes_s560e": 476,
  "mercedes_s580e": 510,
  "mercedes_amg_s_63_e_performance": 791,
  "mercedes_amg_c63_s_e_performance": 680,
  "mercedes_amg_gt_63_s_e_performance": 843,

  // Volvo, Mazda & Renault
  "volvo_xc40_t4": 211,
  "volvo_xc40_t5": 262,
  "volvo_xc60_t6": 350,
  "volvo_xc60_t8": 455,
  "volvo_xc90_t8": 455,
  "volvo_s60_t8": 455,
  "volvo_v60_t8": 455,
  "volvo_s90_t8": 455,
  "volvo_v90_t8": 455,
  "mazda_cx_60_phev": 327,
  "mazda_cx_70_phev": 327,
  "mazda_cx_80_phev": 327,
  "mazda_mx30_rev": 170,
  "renault_captur_phev": 160,
  "renault_megane_phev": 160,
  "renault_rafale_phev": 300,

  // Jaguar & Land Rover
  "jaguar_e_pace_phev": 309,
  "jaguar_f_pace_phev": 404,
  "land_rover_discovery_sport_phev": 309,
  "range_rover_evoque_phev": 309,
  "land_rover_defender_phev": 404,
  "range_rover_phev": 440,
  "range_rover_sport_phev": 460,
  "range_rover_velar_phev": 404,
  "range_rover_p510e": 510,

  // Lincoln, Ford, Chrysler, Cadillac & American Imports
  "lincoln_aviator_phev": 494,
  "lincoln_corsair_phev": 266,
  "cadillac_ct6_phev": 340,
  "ford_kuga_phev": 243,
  "ford_explorer_phev": 457,
  "ford_fusion_energi": 188,
  "ford_cmax_energi": 188,
  "chrysler_pacifica_hybrid": 260,
  "chevrolet_volt": 150,
  "fisker_karma": 408,
  "karma_revero": 536,

  // Stellantis & Others
  "peugeot_3008_phev": 300,
  "peugeot_3008_phev_225": 225,
  "peugeot_3008_phev_2025": 195,
  "peugeot_308_phev": 180,
  "peugeot_408_phev": 225,
  "peugeot_508_phev": 225,
  "peugeot_508_pse": 360,
  "citroen_c5_aircross_phev": 225,
  "citroen_c5_x_phev": 225,
  "opel_grandland_phev": 225,
  "opel_grandland_2025_phev": 195,
  "opel_astra_phev": 180,
  "opel_ampera": 150,
  "ds_4_e_tense": 225,
  "ds_7_crossback_e_tense": 300,
  "ds_7_e_tense_360": 360,
  "ds_9_e_tense": 250,
  "ds_9_e_tense_360": 360,
  "alfa_romeo_tonale_phev": 280,
  "jeep_renegade_4xe": 240,
  "jeep_compass_4xe": 240,
  "jeep_wrangler_4xe": 380,
  "jeep_grand_cherokee_4xe": 375,
  "mitsubishi_outlander_phev": 224,
  "mitsubishi_outlander_phev_2024": 252,
  "mitsubishi_eclipse_cross_phev": 188,
  "s580e": 510
};

function getCombinedPHEVPower(carDesc, model, listedHp, engineCc) {
  if (!listedHp) return listedHp;

  const rawText = `${carDesc || ''} ${model || ''}`.toLowerCase();
  const cc = Number(engineCc) || 0;

  // 1. זיהוי עבור דגמי קבוצת VAG פלאג-אין עם מנוע 1.4 (1395 סמ"ק).
  const hasPhevMarker = /phev|e-?hybrid|gte|hybrid|plugin|היברי|פלאג/.test(rawText);
  if (cc === 1395 && hasPhevMarker) {
    if (rawText.includes('formentor') || rawText.includes('פורמנטור') || rawText.includes('leon') || rawText.includes('לאון')) {
      if (rawText.includes('vz')) {
        return 245; // גרסת VZ e-HYBRID
      }
      return 204; // גרסת e-HYBRID רגילה
    }
    if (rawText.includes('octavia') || rawText.includes('אוקטביה')) {
      return rawText.includes('rs') ? 245 : 204;
    }
    if (rawText.includes('golf') || rawText.includes('גולף')) {
      return 245; // Golf GTE
    }
  }

  // 2. תרגום מעברית לאנגלית עבור יתר הדגמים
  let normalized = rawText;
  for (const [he, en] of Object.entries(HE_TO_EN_MAP)) {
    if (normalized.includes(he)) {
      normalized += ` ${en}`;
    }
  }

  const cleanText = normalized.replace(/[^a-z0-9]/g, '');

  // 3. התאמה מול המאגר
  for (const [key, combinedHp] of Object.entries(PHEV_DATABASE)) {
    const cleanKey = key.replace(/_/g, '');
    if (cleanText.includes(cleanKey)) {
      if (combinedHp > listedHp) {
        return combinedHp;
      }
      return listedHp;
    }
  }

  // 4. רשת ביטחון לרכבי פלאג-אין שמופיעים מפורשות ברישוי
  const isPHEV = cleanText.includes('phev') || cleanText.includes('dmi') || cleanText.includes('plugin') || cleanText.includes('ehybrid');
  if (isPHEV && listedHp && listedHp < 170) {
    const estimated = Math.round(listedHp * 1.6);
    if (estimated > listedHp) return estimated;
  }

  return listedHp;
}

module.exports = {
  PHEV_DATABASE,
  getCombinedPHEVPower
};
