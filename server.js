const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CAR_REGISTRY_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";
const MODELS_ID = "142afde2-6228-49f9-8a29-9b6c3a0cbe40";
const HISTORY_ID = "56063a99-8a3e-4ff4-912e-5966c0279bad";
const OWNERSHIP_ID = "bb2355dc-9ec7-4f06-9c3f-3344672171da";
const DISABLED_ID = "c8b9f9c8-4612-4068-934f-d4acd2e3c06e";

// ---------- טעינת קובצי תאוצה 0-100 (קבצים 1 עד 30) ----------
let accelTable = [];
const ACCEL_FILES = [
    "acceleration.json", "acceleration2.json", "acceleration3.json", "acceleration4.json", "acceleration5.json",
    "acceleration6.json", "acceleration7.json", "acceleration8.json", "acceleration9.json", "acceleration10.json",
    "acceleration11.json", "acceleration12.json", "acceleration13.json", "acceleration14.json", "acceleration15.json",
    "acceleration16.json", "acceleration17.json", "acceleration18.json", "acceleration19.json", "acceleration20.json",
    "acceleration21.json", "acceleration22.json", "acceleration23.json", "acceleration24.json", "acceleration25.json",
    "acceleration26.json", "acceleration27.json", "acceleration28.json", "acceleration29.json", "acceleration30.json"
];

ACCEL_FILES.forEach(fileName => {
    try {
        const filePath = path.join(__dirname, fileName);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
                accelTable = accelTable.concat(data);
            }
        }
    } catch (e) {
        console.error(`[DATA ERROR] שגיאה בטעינת ${fileName}:`, e.message);
    }
});

const HE_MAKE_ALIASES = {
    "אבארט": "Abarth", "קופרה": "Cupra", "אאודי": "Audi", "אודי": "Audi", "אופל": "Opel",
    "אינפיניטי": "Infiniti", "ניסאן": "Nissan", "איווייס": "Aiways", "אורה": "ORA",
    "אוואטר": "AVATR", "איסוזו": "Isuzu", "אלפא רומיאו": "Alfa Romeo", "מ.ג": "MG",
    "ב.מ.וו": "BMW", "בי ווי די": "BYD", "ביואיק": "Buick", "בנטלי": "Bentley", "ג'אקו": "JAECOO",
    "ג'.איי.סי": "GAC", "ג'י.אמ.סי": "GMC", "ג'יפ": "Jeep", "יונדאי": "Hyundai", "ג'נסיס": "Genesis",
    "ג'ילי": "Geely", "דאצ'יה": "Dacia", "דודג'": "Dodge", "די אס": "DS", "דייהטסו": "Daihatsu",
    "הונדה": "Honda", "וולבו": "Volvo", "טויוטה": "Toyota", "טסלה": "Tesla", "יגואר": "Jaguar",
    "לנד רובר": "Land Rover", "לקסוס": "Lexus", "מאזדה": "Mazda", "מיני": "Mini",
    "מרצדס": "Mercedes-Benz", "מיצובישי": "Mitsubishi", "סאאב": "Saab", "סיאט": "Seat",
    "סובארו": "Subaru", "סוזוקי": "Suzuki", "סיטרואן": "Citroen", "סקודה": "Skoda",
    "פולקסווגן": "Volkswagen", "פורד": "Ford", "פורשה": "Porsche", "פיאט": "Fiat",
    "פיג'ו": "Peugeot", "צ'רי": "Chery", "קאדילאק": "Cadillac", "קיה": "Kia",
    "שברולט": "Chevrolet", "רנו": "Renault"
};

function norm(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9א-ת]/g, "");
}

function lookupAccel(makeTexts, modelTexts, year, hp, cc) {
    const makes = makeTexts.map(norm).filter(Boolean);
    const models = modelTexts.map(norm).filter(Boolean);
    const y = Number(year);

    for (const r of accelTable) {
        const rMake = norm(r.make);
        const rModel = norm(r.model);
        if (!makes.some(m => m.includes(rMake))) continue;
        if (!models.some(m => m.includes(rModel))) continue;
        if (!Number.isNaN(y) && r.yearStart != null) {
            if (y < r.yearStart) continue;
            if (r.yearEnd != null && y > r.yearEnd) continue;
        }
        if (hp != null && r.hp != null && Math.abs(r.hp - hp) > 2) continue;
        if (cc != null && r.cc != null && Math.abs(r.cc - cc) > 30) continue;
        return { seconds: r.seconds, source: r.source || "נתון יצרן" };
    }
    return null;
}

async function searchDatastore(resourceId, filters, limit = 100, q = "") {
    try {
        const f = filters ? `&filters=${encodeURIComponent(JSON.stringify(filters))}` : "";
        const qq = q ? `&q=${encodeURIComponent(q)}` : "";
        const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}${f}${qq}&limit=${limit}`;
        const response = await fetch(url);
        const data = await response.json();
        return data?.success ? (data.result?.records || []) : [];
    } catch (e) {
        return [];
    }
}

function toText(value) {
    if (value == null) return null;
    const s = String(value).trim();
    if (s === "" || /^dnf$/i.test(s) || s === "null" || s === "undefined") return null;
    return s;
}

function toNumber(value) {
    const s = toText(value);
    if (s === null) return null;
    const n = Number(s.replace(/,/g, ""));
    return Number.isNaN(n) ? null : n;
}

function pick(sources, keys, asNumber = false) {
    for (const src of sources) {
        if (!src) continue;
        for (const k of keys) {
            if (src[k] !== undefined && src[k] !== null && String(src[k]).trim() !== "") {
                const val = asNumber ? toNumber(src[k]) : toText(src[k]);
                if (val !== null) return val;
            }
        }
    }
    return null;
}

function pickBool(sources, keys, defaultVal = false) {
    for (const src of sources) {
        if (!src) continue;
        for (const k of keys) {
            if (src[k] !== undefined && src[k] !== null && String(src[k]).trim() !== "") {
                const raw = String(src[k]).trim().toLowerCase();
                if (raw === "1" || raw === "true" || raw === "כן" || raw === "y" || raw === "yes") return true;
                if (raw === "0" || raw === "false" || raw === "לא" || raw === "n" || raw === "no") return false;
            }
        }
    }
    return defaultVal;
}

const ORIGIN_LABELS = {
    "": "פרטי", "החכר": "החכרה (ליסינג)", "השכרה": "השכרה", "יבוא אישי": "יבוא אישי",
    "יבוא אישי-משומש": "יבוא אישי משומש", "מדינת ישראל": "רכב ממשלתי", "משומש מיבואן": "משומש מיבואן"
};

function labelOwnership(raw) {
    const t = toText(raw);
    if (t === null) return "פרטי";
    return ORIGIN_LABELS[t] || t;
}

function labelRegistryOwnership(raw) {
    const t = toText(raw);
    if (t === null) return null;
    return ORIGIN_LABELS[t] || t;
}

function testStatus(expiry) {
    if (!expiry) return null;
    const d = new Date(expiry);
    if (isNaN(d)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
}

const BODY_TYPE_MAP = {
    "MPV": "מיניוואן", "SUV": "פנאי / שטח", "HATCHBACK": "האצ'בק", "SEDAN": "סדאן",
    "ESTATE": "סטיישן", "STATION": "סטיישן", "COUPE": "קופה", "CABRIO": "קבריולה",
    "PICKUP": "טנדר", "VAN": "מסחרי / ואן", "MINIVAN": "מיניוואן", "CROSSOVER": "קרוסאובר",
    "הצ'בק": "האצ'בק", "סדאן": "סדאן", "סטיישן": "סטיישן", "קופה": "קופה",
    "פנאי": "פנאי / שטח", "שטח": "רכב שטח", "טנדר": "טנדר", "מסחרי": "מסחרי / ואן"
};

function resolveBodyType(car, row) {
    const rawMerkav = toText(row?.merkav) || toText(car?.merkav) || toText(row?.shilda_nm);
    if (rawMerkav) {
        const clean = rawMerkav.trim();
        if (BODY_TYPE_MAP[clean]) return BODY_TYPE_MAP[clean];
        if (BODY_TYPE_MAP[clean.toUpperCase()]) return BODY_TYPE_MAP[clean.toUpperCase()];
        return clean;
    }
    const sug = toText(car?.sug_degem) || toText(row?.sug_degem);
    if (sug && BODY_TYPE_MAP[sug.trim().toUpperCase()]) {
        return BODY_TYPE_MAP[sug.trim().toUpperCase()];
    }
    return null;
}

function resolveDrivetrain(row, car) {
    const rawCode = pick([row, car], ["hanaa_cd", "hanaa", "sug_hanaa_cd"]);
    const rawNm = pick([row, car], ["hanaa_nm", "sug_hanaa_nm", "drive_type_nm"]);
    const combined = ((rawCode || '') + ' ' + (rawNm || '')).toLowerCase();

    if (combined.includes('4x4') || combined.includes('4wd') || combined.includes('awd') || combined.includes('כפולה') || rawCode === '4') {
        return 'הנעה כפולה (4X4)';
    }
    if (combined.includes('rwd') || combined.includes('אחורית') || rawCode === '2') {
        return 'הנעה אחורית (RWD)';
    }
    return 'הנעה קדמית (FWD)';
}

async function checkDisabled(plate) {
    try {
        const cleanPlate = String(plate).replace(/\D/g, "");
        let records = await searchDatastore(DISABLED_ID, { "MISPAR RECHEV": cleanPlate }, 5);
        if (!records || records.length === 0) {
            records = await searchDatastore(DISABLED_ID, { "MISPAR RECHEV": Number(cleanPlate) }, 5);
        }
        if (records && records.length > 0) {
            const match = records[0];
            return {
                hasBadge: true,
                badgeType: match["SUG TAV"] || match["SUG_TAV"] || null,
                issueDate: match["TAARICH HAFAKAT TAG"] || match["TAARICH_HAFAKAT_TAG"] || null
            };
        }
        return { hasBadge: false, badgeType: null, issueDate: null };
    } catch (e) {
        return { hasBadge: false, badgeType: null, issueDate: null };
    }
}

async function fetchCarRecord(plate) {
    const records = await searchDatastore(CAR_REGISTRY_ID, { mispar_rechev: Number(plate) }, 1);
    return records[0] || null;
}

async function fetchHistoryRecord(plate) {
    const records = await searchDatastore(HISTORY_ID, { mispar_rechev: Number(plate) }, 1);
    return records[0] || null;
}

async function fetchOwnershipRows(plate) {
    const rows = await searchDatastore(OWNERSHIP_ID, { mispar_rechev: Number(plate) }, 100);
    return rows
        .map(r => ({ date: toText(r.baalut_dt), type: labelOwnership(r.baalut) }))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function buildHistory(h) {
    if (!h) return null;
    const changes = [];
    if (Number(h.shinui_mivne_ind) === 1) changes.push("שינוי במבנה הרכב");
    if (Number(h.shnui_zeva_ind) === 1) changes.push("שינוי צבע");
    if (Number(h.shinui_zmig_ind) === 1) changes.push("שינוי צמיגים");
    return {
        origin: labelOwnership(h.mkoriut_nm),
        firstRegistration: toText(h.rishum_rishon_dt),
        kmSinceTest: toNumber(h.kilometer_test_aharon),
        changes
    };
}

async function findModelRow(car) {
    const year = car.shnat_yitzur != null ? Number(car.shnat_yitzur) : null;
    const tozeret_cd = car.tozeret_cd != null ? Number(car.tozeret_cd) : null;
    const degem_cd_raw = car.degem_cd != null ? String(car.degem_cd).trim() : null;

    const attempts = [];
    if (tozeret_cd && degem_cd_raw && year) {
        attempts.push({ tozeret_cd, degem_cd: degem_cd_raw, shnat_yitzur: year });
        if (!isNaN(Number(degem_cd_raw))) attempts.push({ tozeret_cd, degem_cd: Number(degem_cd_raw), shnat_yitzur: year });
    }
    if (tozeret_cd && degem_cd_raw) {
        attempts.push({ tozeret_cd, degem_cd: degem_cd_raw });
    }
    if (car.degem_nm && year) {
        attempts.push({ degem_nm: String(car.degem_nm).trim(), shnat_yitzur: year });
    }

    for (const filters of attempts) {
        const rows = await searchDatastore(MODELS_ID, filters, 25);
        if (rows && rows.length > 0) {
            return rows.find(r => r.mishkal_kolel != null || r.koah_sus != null || r.gova != null) || rows[0];
        }
    }
    return null;
}

app.get('/', (req, res) => {
    res.status(200).send('Car API is running successfully!');
});

// Endpoint סריקה רוחבית לסקרנות
app.get('/api/scan-all', async (req, res) => {
    try {
        const packageSearchUrl = "https://data.gov.il/api/3/action/package_search?q=רכב&rows=50";
        const response = await fetch(packageSearchUrl);
        const data = await response.json();

        if (!data.success || !data.result || !data.result.results) {
            return res.json({ success: false, message: "לא הצלחנו לשלוף מאגרים." });
        }

        const packages = data.result.results;
        const scanResults = [];

        for (const pkg of packages) {
            const pkgInfo = { packageName: pkg.title || pkg.name, resources: [] };
            if (pkg.resources && Array.isArray(pkg.resources)) {
                for (const res of pkg.resources) {
                    if (res.format && res.format.toLowerCase() === 'json' || res.datastore_active || res.id) {
                        let fields = [];
                        try {
                            const sampleUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${res.id}&limit=1`;
                            const sampleRes = await fetch(sampleUrl);
                            const sampleData = await sampleRes.json();
                            if (sampleData.success && sampleData.result?.records?.length > 0) {
                                fields = Object.keys(sampleData.result.records[0]);
                            }
                        } catch (err) {}
                        pkgInfo.resources.push({ resourceName: res.name || 'ללא שם', resourceId: res.id, fields });
                    }
                }
            }
            scanResults.push(pkgInfo);
        }

        res.json({ success: true, results: scanResults });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");

    try {
        const car = await fetchCarRecord(plate);
        if (!car) {
            return res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }

        const [row, historyRaw, ownershipList, disabledResult] = await Promise.all([
            findModelRow(car),
            fetchHistoryRecord(plate),
            fetchOwnershipRows(plate),
            checkDisabled(plate)
        ]);
        const history = buildHistory(historyRaw);

        const manufacturer = car.tozeret_nm || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || row?.kinuy_mishari || "לא ידוע";
        const trim = pick([row, car], ["ramat_gimur", "ramat_eivzur", "gimur"]);
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = pick([row, car], ["koah_sus", "hespak", "hp"], true);
        const engineCc = pick([row, car], ["nefah_manoa", "cc"], true);
        const testExpiry = car.tokef_dt || null;
        const bodyType = resolveBodyType(car, row);

        const registryOwnership = labelRegistryOwnership(car.baalut);
        const historyOwnership = ownershipList.length ? ownershipList[ownershipList.length - 1].type : (history?.origin ?? null);
        const currentOwnership = registryOwnership || historyOwnership;

        const makeTexts = [manufacturer, car.tozeret_nm, car.kinuy_mishari, car.sug_degem].filter(Boolean);
        for (const [he, en] of Object.entries(HE_MAKE_ALIASES)) {
            if (String(manufacturer).includes(he) || String(car.tozeret_nm || "").includes(he)) makeTexts.push(en);
        }
        const modelTexts = [car.kinuy_mishari, car.degem_nm, trim, model].filter(Boolean);
        const acceleration = lookupAccel(makeTexts, modelTexts, year, hp, engineCc);
        const hasDisabledBadge = Boolean(disabledResult?.hasBadge);

        const sources = [row, car];

        const safetyScore = toNumber(pick(sources, ["ramat_eivzur_betihut", "nikud_bitahon"], true)) || 0;
        const yearNum = Number(year) || 2020;
        const isModernCar = yearNum >= 2018;

        res.json({
            success: true,
            data: {
                plate,
                manufacturer,
                model,
                trim,
                year,
                color: car.zeva_rechev || car.tzeva_rechev || "לא ידוע",
                chassis: toText(car.misgeret),
                tireFront: toText(car.zmig_kidmi),
                tireRear: toText(car.zmig_ahori),
                lastTest: toText(car.mivchan_acharon_dt),
                engineCc,
                horsepower: hp,
                acceleration0to100: acceleration ? acceleration.seconds : null,
                accelerationSource: acceleration ? acceleration.source : null,
                testExpiry,
                testValid: testStatus(testExpiry),
                ownership: currentOwnership,
                firstRegistration: history?.firstRegistration ?? null,
                changes: history?.changes ?? [],
                owners: ownershipList.length || null,
                disabled: hasDisabledBadge,
                disabledBadgeDetails: hasDisabledBadge ? { badgeType: disabledResult.badgeType, issueDate: disabledResult.issueDate } : null,
                bodyType,
                merkav: bodyType,
                kmSinceTest: history?.kmSinceTest ?? null,

                technical: {
                    drivetrain: resolveDrivetrain(row, car),
                    totalWeight: toNumber(pick(sources, ["mishkal_kolel", "mishkal_kolel_kg"], true)),
                    curbWeight: toNumber(pick(sources, ["mishkal_azmi", "mishkal_azmi_kg"], true)),
                    height: toNumber(pick(sources, ["gova", "gova_rechev"], true)),
                    length: toNumber(pick(sources, ["orech_klali", "orech", "orech_rechev"], true)),
                    width: toNumber(pick(sources, ["rohav_klali", "rohav", "rohav_rechev"], true)),
                    wheelbase: toNumber(pick(sources, ["merhak_sranim", "basis_galgalim"], true)),
                    doors: toNumber(pick(sources, ["mispar_dlatot", "dlatot"], true)),
                    seats: toNumber(pick(sources, ["mispar_moshavim", "moshavim"], true)),
                    powerWindows: toNumber(pick(sources, ["halonot_hashmal", "halonot_hashmal_halonot"], true)) ?? 4,
                    airbags: toNumber(pick(sources, ["kariot_avir", "mispar_kariot_avir"], true)),
                    transmission: toText(pick(sources, ["tevat_hiluhim_nm", "tevat_hiluhim", "gear_nm"])) || 'אוטומטי',
                    fuelType: toText(pick(sources, ["sug_delek_nm", "delek_nm", "sug_delek"])) || 'בנזין',
                    engineCode: toText(pick(sources, ["degem_manoa", "kod_manoa", "degem_manoa_cd"])),
                    hasTowHitch: pickBool(sources, ["vav_grira_ind", "vav_grira"], false),
                    towBrakes: toNumber(pick(sources, ["kosher_grira_im_blamim", "kosher_grira_im_blamim_kg"], true)),
                    towNoBrakes: toNumber(pick(sources, ["kosher_grira_lelo_blamim", "kosher_grira_lelo_blamim_kg"], true))
                },

                equipment: {
                    ac: pickBool(sources, ["mazgan_ind", "mazgan", "bakarat_aklim_ind"], true),
                    alloyWheels: pickBool(sources, ["galgalei_sagsoget_kala_ind", "galgaley_sagsoget_ind"], isModernCar),
                    sunroof: pickBool(sources, ["sunroof_ind", "halon_bagag_ind"], false),
                    abs: pickBool(sources, ["abs_ind", "abs"], true),
                    esp: pickBool(sources, ["bakarat_yatzivut_ind", "esp_ind"], true),
                    powerSteering: pickBool(sources, ["hege_koah_ind", "hege_koach_ind"], true),
                    cruiseControl: pickBool(sources, ["bakarat_shyut_ind", "bakarat_shyut_adaptivit_ind"], isModernCar),
                    leatherSeats: pickBool(sources, ["ripudey_or_ind", "ripud_or_ind"], false),
                    powerSeats: pickBool(sources, ["kivnun_moshavim_hashmali_ind"], false),
                    heatedSeats: pickBool(sources, ["himum_moshavim_ind"], false),
                    keyless: pickBool(sources, ["keyless_ind", "hanaya_bekaftor_ind"], isModernCar),
                    fogLights: pickBool(sources, ["pansey_arafel_ind"], true),
                    ledHeadlights: pickBool(sources, ["pansey_led_ind", "pansey_ksenon_ind"], isModernCar),
                    leatherSteeringWheel: pickBool(sources, ["hege_metzupa_or_ind"], isModernCar),
                    steeringControls: pickBool(sources, ["shlita_mehahege_ind"], true),
                    soundSystem: pickBool(sources, ["maarehet_shema_ind"], true)
                },

                safety: {
                    safetyScore: safetyScore || null,
                    autonomousBraking: pickBool(sources, ["blimat_herum_otonomit_ind", "blimat_herum_ind"], isModernCar),
                    laneDeparture: pickBool(sources, ["hatraat_stiat_nativ_ind", "stiat_nativ_ind", "bakarat_stiya_activ_s"], isModernCar),
                    laneKeepAssist: pickBool(sources, ["mneiat_stiat_nativ_ind"], isModernCar),
                    adaptiveCruise: pickBool(sources, ["bakarat_shyut_adaptivit_ind"], isModernCar),
                    blindSpot: pickBool(sources, ["zihuy_rehev_beshetah_met_ind", "shetah_met_ind"], isModernCar),
                    forwardCollision: pickBool(sources, ["hatraat_hitnagshut_kidmit_ind"], isModernCar),
                    pedestrianDetection: pickBool(sources, ["zihuy_holhey_regel_ind"], isModernCar),
                    trafficSigns: pickBool(sources, ["zihuy_tamrurey_tnua_ind"], safetyScore >= 5),
                    rearviewCamera: pickBool(sources, ["matzlema_ahorit_ind", "matzlewat_reverse_ind"], isModernCar),
                    parkingSensors: pickBool(sources, ["hayeyshey_hanaya_ind"], isModernCar),
                    autoHighBeam: pickBool(sources, ["shlita_beor_gvoha_ind"], safetyScore >= 5),
                    tirePressure: pickBool(sources, ["hayeyshey_lahatz_avir_ind"], true)
                },

                environment: {
                    pollutionLevel: toNumber(pick(sources, ["ramat_zihum", "darjat_zihum"], true)),
                    co2Emissions: toNumber(pick(sources, ["plitat_co2", "co2"], true)),
                    licenseGroup: toNumber(pick(sources, ["kvutzat_agrah_cd", "kvutzat_agrah"], true))
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
