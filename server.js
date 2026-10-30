// server.js - Car API Server Production
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ---------- טעינת מאגר PHEV ----------
let getCombinedPHEVPower = (m, mod, hp, cc) => hp;
let hasPhevData = false;
try {
    const phevModule = require('./phevData');
    if (phevModule && typeof phevModule.getCombinedPHEVPower === 'function') {
        getCombinedPHEVPower = phevModule.getCombinedPHEVPower;
        hasPhevData = true;
    }
} catch (e) {
    console.log('[PHEV DATA] לא נטען:', e.message);
}

// ---------- טעינת מאגר HEV / MHEV ----------
let getCombinedHEVPower = (m, mod, hp, cc, fuel) => hp;
let hasHevData = false;
try {
    const hevModule = require('./hevData');
    if (hevModule && typeof hevModule.getCombinedHEVPower === 'function') {
        getCombinedHEVPower = hevModule.getCombinedHEVPower;
        hasHevData = true;
    }
} catch (e) {
    console.log('[HEV DATA] לא נטען:', e.message);
}

app.use(cors());
app.use(express.json());

const CAR_REGISTRY_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";
const MODELS_ID = "142afde2-6228-49f9-8a29-9b6c3a0cbe40";
const HISTORY_ID = "56063a99-8a3e-4ff4-912e-5966c0279bad";
const OWNERSHIP_ID = "bb2355dc-9ec7-4f06-9c3f-3344672171da";
const DISABLED_ID = "c8b9f9c8-4612-4068-934f-d4acd2e3c06e";
const IMPORTER_PRICE_ID = "39f455bf-6db0-4926-859d-017f34eacbcb";

// ---------- מנוע טבלת צייד הרכבים (Firebase) ----------
const FIREBASE_DB_URL = "https://carhunterleaderboard-default-rtdb.europe-west1.firebasedatabase.app";

async function getCloudLeaderboard() {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}/leaderboard.json`);
        const data = await response.json();
        return data || {};
    } catch (e) {
        return {};
    }
}

async function saveCloudLeaderboard(leaderboardData) {
    try {
        await fetch(`${FIREBASE_DB_URL}/leaderboard.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaderboardData)
        });
    } catch (e) {}
}

app.get('/api/hunter/leaderboard', async (req, res) => {
    const hunterLeaderboard = await getCloudLeaderboard();
    const sorted = Object.entries(hunterLeaderboard)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    res.json({ success: true, leaderboard: sorted });
});

app.post('/api/hunter/update', async (req, res) => {
    const { nickname, count } = req.body;
    if (!nickname) return res.status(400).json({ success: false, message: "Missing nickname" });

    let hunterLeaderboard = await getCloudLeaderboard();
    hunterLeaderboard[nickname] = Number(count) || 0;
    await saveCloudLeaderboard(hunterLeaderboard);

    res.json({
        success: true,
        leaderboard: Object.entries(hunterLeaderboard)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
    });
});

let accelTable = [];
const ACCEL_FILES = [
    "acceleration.json", "acceleration2.json", "acceleration3.json", "acceleration4.json",
    "acceleration5.json", "acceleration6.json", "acceleration7.json", "acceleration8.json",
    "acceleration9.json", "acceleration10.json", "acceleration11.json", "acceleration12.json",
    "acceleration13.json", "acceleration14.json", "acceleration15.json", "acceleration16.json",
    "acceleration17.json", "acceleration18.json", "acceleration19.json", "acceleration20.json",
    "acceleration21.json", "acceleration22.json", "acceleration23.json", "acceleration24.json",
    "acceleration25.json", "acceleration26.json", "acceleration27.json", "acceleration28.json",
    "acceleration29.json", "acceleration30.json", "acceleration31.json"
];

ACCEL_FILES.forEach(fileName => {
    try {
        const filePath = path.join(__dirname, fileName);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(raw);
            if (Array.isArray(data)) accelTable = accelTable.concat(data);
        }
    } catch (e) {}
});

const HE_MAKE_ALIASES = {
    "אבארט": "Abarth", "קופרה": "Cupra", "אאודי": "Audi", "אודי": "Audi",
    "אופל": "Opel", "אינפיניטי": "Infiniti", "ניסאן": "Nissan", "איווייס": "Aiways",
    "אורה": "ORA", "אוואטר": "AVATR", "אומודה": "OMODA", "איסוזו": "Isuzu",
    "אל אי וי סי": "LEVC", "אלפא רומיאו": "Alfa Romeo", "מ.ג": "MG", "אם ג'י": "MG",
    "אסטון מרטין": "Aston Martin", "אקספנג": "XPENG", "ב.מ.וו": "BMW", "בי ווי די": "BYD",
    "ביואיק": "Buick", "בנטלי": "Bentley", "ג'אקו": "JAECOO", "גאקו": "JAECOO",
    "ג'י.איי.סי": "GAC", "ג'י.אם.סי": "GMC", "ג'יפ": "Jeep", "יונדאי": "Hyundai",
    "ג'נסיס": "Genesis", "ג'ילי": "Geely", "דאצ'יה": "Dacia", "דודג'": "Dodge",
    "דונגפנג": "Dongfeng", "די אס": "DS", "דייהטסו": "Daihatsu", "דיפאל": "Deepal",
    "הונצי": "Hongqi", "הונדה": "Honda", "וויה": "Voyah", "וולבו": "Volvo",
    "וואי": "WEY", "זיקר": "Zeekr", "טויוטה": "Toyota", "טסלה": "Tesla",
    "יגואר": "Jaguar", "יודו": "Yudo", "לינק אנד קו": "Lynk & Co", "ליפמוטור": "Leapmotor",
    "למבורגיני": "Lamborghini", "לנד רובר": "Land Rover", "לקסוס": "Lexus",
    "מאזדה": "Mazda", "מיני": "Mini", "מזארטי": "Maserati", "מרצדס": "Mercedes-Benz",
    "מקלארן": "McLaren", "מיצובישי": "Mitsubishi", "מקסוס": "Maxus", "ניאו": "NIO",
    "סאאב": "Saab", "סיאט": "Seat", "סובארו": "Subaru", "סוזוקי": "Suzuki",
    "סמארט": "Smart", "סיטרואן": "Citroen", "סקודה": "Skoda", "סקייוול": "Skywell",
    "פולסטאר": "Polestar", "סרס": "Seres", "פוטון": "Foton", "פולקסווגן": "Volkswagen",
    "פורד": "Ford", "פורשה": "Porsche", "פורתינג": "Forthing", "פיאט": "Fiat",
    "פיג'ו": "Peugeot", "פרארי": "Ferrari", "צ'רי": "Chery", "קאדילאק": "Cadillac",
    "קיה": "Kia", "קיי גי מוביליט": "KGM", "קרייזלר": "Chrysler", "רולס רוייס": "Rolls-Royce",
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

app.use((req, res, next) => {
    if (req.url !== '/') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
});

// מטמון לתשובות המאגר: אותו רכב לא נשאל שוב מהמאגר במשך 10 דקות.
// זה מפחית מאוד את מספר הבקשות, כי מאגר משרד התחבורה מגביל קצב.
const dsCache = new Map();
const DS_CACHE_TTL_MS = 10 * 60 * 1000;

async function searchDatastore(resourceId, filters, limit = 100, q = "") {
    const f = filters ? `&filters=${encodeURIComponent(JSON.stringify(filters))}` : "";
    const qq = q ? `&q=${encodeURIComponent(q)}` : "";
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}${f}${qq}&limit=${limit}`;
    const cached = dsCache.get(url);
    if (cached && Date.now() - cached.at < DS_CACHE_TTL_MS) return cached.records;

    // כשמאגר העירוני מגביל קצב או מחזיר דף שגיאה (לא JSON) – מנסים שוב פעם אחת
    let data = null;
    for (let attempt = 0; attempt < 2 && !data; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
        const response = await fetch(url);
        const text = await response.text();
        try { data = JSON.parse(text); } catch (e) { data = null; }
    }
    if (!data) {
        throw new Error('DATASTORE_UNAVAILABLE');
    }
    if (!data.success) return [];
    const records = data.result?.records || [];
    dsCache.set(url, { at: Date.now(), records });
    return records;
}

function toText(value) {
    if (value == null) return null;
    const s = String(value).trim();
    if (s === "" || /^dnf$/i.test(s)) return null;
    return s;
}

function toNumber(value) {
    const s = toText(value);
    if (s === null) return null;
    const n = Number(s.replace(/,/g, ""));
    return Number.isNaN(n) ? null : n;
}

const ORIGIN_LABELS = {
    "": "פרטי", "החכר": "החכרה (ליסינג)", "השכרה": "השכרה",
    "יבוא אישי": "יבוא אישי", "יבוא אישי-משומש": "יבוא אישי משומש",
    "מדינת ישראל": "רכב ממשלתי", "ביס לנהיגה\"": "בית ספר לנהיגה", "משומש מיבואן": "משומש מיבואן"
};

function labelOwnership(raw) {
    const t = toText(raw);
    if (t === null) return "פרטי";
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
    "ESTATE": "סטיישן", "STATION": "סטיישן", "COUPE": "קופה", "CABRIO": "קבריולה (גג פתוח)",
    "CABRIOLET": "קבריולה (גג פתוח)", "CONVERTIBLE": "קבריולה (גג פתוח)", "PICKUP": "טנדר",
    "VAN": "מסחרי / ואן", "MINIVAN": "מיניוואן", "CROSSOVER": "קרוסאובר"
};

function resolveBodyType(car, row) {
    const rawMerkav = toText(row?.merkav) || toText(car?.merkav);
    if (rawMerkav) {
        const clean = rawMerkav.trim();
        if (BODY_TYPE_MAP[clean]) return BODY_TYPE_MAP[clean];
        if (BODY_TYPE_MAP[clean.toUpperCase()]) return BODY_TYPE_MAP[clean.toUpperCase()];
        return clean;
    }
    return null;
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
            return { hasBadge: true, badgeType: match["SUG TAV"] || match["SUG_TAV"] || null };
        }
        return { hasBadge: false, badgeType: null };
    } catch (e) {
        return { hasBadge: false, badgeType: null };
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

async function fetchImporterPriceApi(car, row) {
    try {
        const tozeretCd = toNumber(car.tozeret_cd) ?? (row ? toNumber(row.tozeret_cd) : null);
        const degemCd = toNumber(car.degem_cd) ?? (row ? toNumber(row.degem_cd) : null);
        const year = toNumber(car.shnat_yitzur);

        if (tozeretCd == null || degemCd == null) {
            return { importerPrice: null, importerName: null };
        }

        const records = await searchDatastore(IMPORTER_PRICE_ID, { tozeret_cd: tozeretCd, degem_cd: degemCd }, 20);

        if (records && records.length > 0) {
            const match = records.find(r => !year || Number(r.shnat_yitzur) === year) || records[0];
            return {
                importerPrice: toNumber(match.mehir) || null,
                importerName: toText(match.shem_yevuan) || null
            };
        }
    } catch (e) {
        console.error('[IMPORTER API ERROR]', e.message);
    }
    return { importerPrice: null, importerName: null };
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
    const attempts = [];
    if (car.tozeret_cd != null && car.degem_cd != null && year) {
        attempts.push({ tozeret_cd: Number(car.tozeret_cd), degem_cd: Number(car.degem_cd), shnat_yitzur: year });
    }
    if (car.degem_nm && year) {
        attempts.push({ degem_nm: String(car.degem_nm), shnat_yitzur: year });
    }
    for (const filters of attempts) {
        const rows = await searchDatastore(MODELS_ID, filters, 100);
        if (rows.length === 0) continue;
        return rows.find(r => toNumber(r.koah_sus) != null && toNumber(r.CO2_WLTP) != null)
            || rows.find(r => toNumber(r.koah_sus) != null)
            || rows[0];
    }
    return null;
}

app.get('/', (req, res) => {
    res.status(200).send('Car API is running successfully!');
});

app.get('/api/car/inspect', async (req, res) => {
    try {
        const [carRows, modelRows] = await Promise.all([
            searchDatastore(CAR_REGISTRY_ID, null, 1),
            searchDatastore(MODELS_ID, null, 1)
        ]);
        res.json({
            success: true,
            carFields: Object.keys(carRows[0] || {}),
            modelFields: Object.keys(modelRows[0] || {})
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");
    // מספר רכב לא תקין לא נשלח למאגר (למשל "0")
    if (plate.length < 5 || plate.length > 9 || Number(plate) === 0) {
        return res.status(400).json({ success: false, message: "מספר רכב לא תקין" });
    }
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

        const importerData = await fetchImporterPriceApi(car, row);
        const history = buildHistory(historyRaw);

        const manufacturer = car.tozeret_nm || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || row?.kinuy_mishari || "לא ידוע";
        const trim = toText(row?.ramat_gimur) || toText(car.ramat_gimur) || null;
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = toNumber(row?.koah_sus) ?? toNumber(car.koah_sus);
        const engineCc = toNumber(row?.nefah_manoa) ?? toNumber(car.nefah_manoa);
        const fuelType = toText(row?.sug_delek_nm) || toText(car.sug_delek_nm) || "";

        let combinedHp = hp;
        let isPhev = false;
        let isHev = false;

        const carDesc = `${manufacturer} ${car.degem_nm || ''} ${trim || ''} ${model} ${fuelType}`;

        try {
            if (hasPhevData) {
                const phevVal = getCombinedPHEVPower(carDesc, model, hp, engineCc);
                if (phevVal && phevVal > hp) {
                    combinedHp = phevVal;
                    isPhev = true;
                }
            }

            if (!isPhev && hasHevData) {
                const hevVal = getCombinedHEVPower(carDesc, model, hp, engineCc, fuelType);
                if (hevVal && hevVal > hp) {
                    combinedHp = hevVal;
                    isHev = true;
                }
            }
        } catch (calcErr) {
            console.error('[HYBRID CALC ERROR]', calcErr);
        }

        const isHybridOrPhev = isPhev || isHev;

        const testExpiry = car.tokef_dt || null;
        const bodyType = resolveBodyType(car, row);

        const makeTexts = [manufacturer, car.tozeret_nm, car.kinuy_mishari, car.sug_degem].filter(Boolean);
        for (const [he, en] of Object.entries(HE_MAKE_ALIASES)) {
            if (String(manufacturer).includes(he) || String(car.tozeret_nm || "").includes(he)) {
                makeTexts.push(en);
            }
        }
        const modelTexts = [car.kinuy_mishari, car.degem_nm, car.ramat_gimur, model].filter(Boolean);
        const acceleration = lookupAccel(makeTexts, modelTexts, year, hp, engineCc);

        const fv = (key) => {
            const a = row ? row[key] : undefined;
            const b = car[key];
            const v = (a !== undefined && a !== null && String(a).trim() !== "") ? a : b;
            return (v === undefined || v === null || String(v).trim() === "") ? null : v;
        };
        const fnum = (key) => {
            const v = fv(key);
            if (v === null) return null;
            const n = Number(v);
            return Number.isNaN(n) ? null : n;
        };
        const fflag = (key) => {
            const n = fnum(key);
            return n === null ? null : n === 1;
        };

        const isAutomatic = fflag("automatic_ind");
        const transmission = isAutomatic === null ? null : (isAutomatic ? "אוטומטי" : "ידני");

        const technical = {
            drivetrain: fv("hanaa_nm"),
            totalWeight: fnum("mishkal_kolel"),
            towWithBrakes: fnum("kosher_grira_im_blamim"),
            towWithoutBrakes: fnum("kosher_grira_bli_blamim"),
            doors: fnum("mispar_dlatot"),
            seats: fnum("mispar_moshavim"),
            windows: fnum("mispar_halonot_hashmal"),
            airbags: fnum("mispar_kariot_avir"),
            safetyLevel: fnum("ramat_eivzur_betihuty")
        };

        const equipment = {
            ac: fflag("mazgan_ind"), abs: fflag("abs_ind"),
            sunroof: fflag("halon_bagg_ind"), alloyWheels: fflag("galgaley_sagsoget_kala_ind"),
            powerSteering: fflag("hege_koah_ind")
        };

        const safety = {
            laneDeparture: fflag("bakarat_stiya_menativ_ind") ?? fflag("bakarat_stiya_activ_s"),
            pedestrianDetection: fflag("zihuy_holchey_regel_ind") ?? fflag("blimat_hirum_lifnei_holhei_regel_ofanaim"),
            rearCamera: fflag("matzlemat_reverse_ind") ?? fflag("matzlemet_reverse_ind"),
            blindSpot: fflag("zihuy_beshetah_nistar_ind"),
            adaptiveCruise: fflag("bakarat_shyut_adaptivit_ind"),
            signRecognition: fflag("zihuy_tamrurey_tnua_ind"),
            parkingSensorsFront: fflag("nitur_merhak_milfanim_ind"),
            autoBrakeForward: fflag("teura_automatit_benesiya_kadima_ind"),
            autoBrakeReverse: fflag("blima_otomatit_nesia_leahor_ind"),
            autoHighBeam: fflag("shlita_automatit_beorot_gvohim_ind"),
            driverDrowsiness: fflag("zihuy_matzav_hitkarvut_mesukenet_ind"),
            tirePressure: fflag("hayshaney_lahatz_avir_batzmigim_ind")
        };

        const fnumGramsToMg = (key) => {
            const n = fnum(key);
            return n === null ? null : Math.round(n * 1000 * 10) / 10;
        };
        const emissions = {
            co2Wltp: fnum("CO2_WLTP") ?? fnum("kamut_CO2"),
            noxWltp: fnum("NOX_WLTP") ?? fnumGramsToMg("kamut_NOX"),
            hcWltp: fnum("HC_WLTP") ?? fnumGramsToMg("kamut_HC"),
            pmWltp: fnum("PM_WLTP") ?? fnumGramsToMg("kamut_PM10"),
            co2City: fnum("kamut_CO2_city"),
            co2Highway: fnum("kamut_CO2_hway"),
            source: fnum("CO2_WLTP") !== null ? "WLTP"
                : fnum("kamut_CO2") !== null ? "kamut"
                : (fnum("kamut_CO2_city") !== null || fnum("kamut_CO2_hway") !== null) ? "kamut_city_highway"
                : null
        };

        const FUEL_CO2_PER_LITER = { petrol: 2310, diesel: 2680 };
        const isElectricFuel = /חשמל/.test(fuelType);
        let fuelKind = null;
        if (/דיזל|סולר/.test(fuelType)) fuelKind = 'diesel';
        else if (/בנזין/.test(fuelType)) fuelKind = 'petrol';
        const kmPerLiterFor = (perL) => (!isElectricFuel && emissions.co2Wltp > 0)
            ? Math.round((perL / emissions.co2Wltp) * 10) / 10
            : null;
        const kmPerLiterPetrol = kmPerLiterFor(FUEL_CO2_PER_LITER.petrol);
        const kmPerLiterDiesel = kmPerLiterFor(FUEL_CO2_PER_LITER.diesel);
        const perLiterForKind = fuelKind === 'diesel' ? FUEL_CO2_PER_LITER.diesel : fuelKind === 'petrol' ? FUEL_CO2_PER_LITER.petrol : null;
        const kmPerLiterOf = (co2) => (perLiterForKind && !isElectricFuel && co2 > 0)
            ? Math.round((perLiterForKind / co2) * 10) / 10
            : null;
        const fuel = {
            type: fuelKind,
            kmPerLiterCity: kmPerLiterOf(emissions.co2City),
            kmPerLiterHighway: kmPerLiterOf(emissions.co2Highway),
            kmPerLiter: fuelKind === 'petrol' ? kmPerLiterPetrol : fuelKind === 'diesel' ? kmPerLiterDiesel : null,
            kmPerLiterPetrol,
            kmPerLiterDiesel,
            isHybridOrPhev: Boolean(isHybridOrPhev),
            isPhev: Boolean(isPhev),
            isElectric: isElectricFuel,
            note: 'הערכה לפי מבחן מעבדה WLTP ולא לפי נהיגה אמיתית'
        };

        res.json({
            success: true,
            data: {
                plate, manufacturer, model, trim, year, transmission,
                color: car.zeva_rechev || car.tzeva_rechev || "לא ידוע",
                chassis: toText(car.misgeret),
                tireFront: toText(car.zmig_kidmi),
                tireRear: toText(car.zmig_ahori),
                lastTest: toText(car.mivchan_acharon_dt),
                engineCc,
                horsepower: hp,
                combinedHorsepower: isHybridOrPhev ? combinedHp : null,
                isPhev: Boolean(isPhev),
                isHybridOrPhev: Boolean(isHybridOrPhev),
                acceleration0to100: acceleration ? acceleration.seconds : null,
                accelerationSource: acceleration ? acceleration.source : null,
                importerPrice: importerData.importerPrice,
                importerName: importerData.importerName,
                testExpiry,
                testValid: testStatus(testExpiry),
                ownership: ownershipList.length ? ownershipList[ownershipList.length - 1].type : labelOwnership(car.baalut),
                owners: ownershipList.length || null,
                disabled: Boolean(disabledResult?.hasBadge),
                bodyType, merkav: bodyType,
                kmSinceTest: history?.kmSinceTest ?? null,
                pollutionGroup: fnum("kvutzat_zihum"),
                greenScore: fnum("madad_yarok"),
                technical, equipment, safety, emissions, fuel
            }
        });
    } catch (error) {
        console.error('[CAR API ERROR]', error);
        if (error.message === 'DATASTORE_UNAVAILABLE') {
            return res.status(503).json({ success: false, message: 'שירות משרד התחבורה לא זמין כרגע, נסה שוב בעוד דקה' });
        }
        res.status(500).json({ success: false, error: "שגיאה בשליפה", message: 'שגיאה בשליפת הנתונים, נסה שוב' });
    }
});

app.get('/api/history/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");
    try {
        const [historyRaw, ownershipList] = await Promise.all([
            fetchHistoryRecord(plate),
            fetchOwnershipRows(plate)
        ]);
        const history = buildHistory(historyRaw);
        res.json({ success: true, history: history || {}, ownershipList });
    } catch (e) {
        res.status(500).json({ success: false, message: "שגיאה בשליפת ההיסטוריה" });
    }
});

function mapCandidate(r) {
    return {
        plate: String(r.mispar_rechev ?? ''),
        manufacturer: toText(r.tozeret_nm) || '',
        model: toText(r.kinuy_mishari) || toText(r.degem_nm) || '',
        year: r.shnat_yitzur ?? null
    };
}

app.get('/api/search/chassis/:chassis', async (req, res) => {
    const chassis = String(req.params.chassis || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (chassis.length < 5) {
        return res.status(400).json({ success: false, results: [], message: 'מספר שלדה קצר מדי' });
    }
    try {
        const records = await searchDatastore(CAR_REGISTRY_ID, { misgeret: chassis }, 50);
        res.json({ success: true, results: records.map(mapCandidate) });
    } catch (e) {
        console.error('[CHASSIS SEARCH ERROR]', e);
        res.status(500).json({ success: false, results: [], message: 'שגיאה בחיפוש' });
    }
});

const BIKE_REGISTRY_ID = "bf9df4e2-d90d-4c0a-a400-19e15af8e95f";

const BIKE_ALLOWED_FIELDS = [
    "mispar_rechev", "tozeret_nm", "tozeret_eretz_nm", "degem_nm",
    "shnat_yitzur", "sug_delek_nm", "nefach_manoa", "hespek",
    "mishkal_kolel", "mispar_mekomot", "misgeret", "moed_aliya_lakvish",
    "baalut", "mkoriut_nm"
];

function pickBikeFields(rec) {
    const out = {};
    for (const key of BIKE_ALLOWED_FIELDS) {
        const v = rec[key];
        if (v === null || v === undefined) continue;
        const s = String(v).trim();
        if (s === "" || /^dnf$/i.test(s)) continue;
        out[key] = s;
    }
    return out;
}

app.get('/api/bike/inspect', async (req, res) => {
    try {
        const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${BIKE_REGISTRY_ID}&limit=1`;
        const r = await fetch(url);
        const text = await r.text();
        let j;
        try {
            j = JSON.parse(text);
        } catch (e) {
            return res.json({
                success: false,
                stage: 'parse',
                httpStatus: r.status,
                contentType: r.headers.get('content-type'),
                preview: text.slice(0, 200)
            });
        }
        if (!j.success) {
            return res.json({ success: false, stage: 'datastore', error: j.error || null, httpStatus: r.status });
        }
        const sample = j.result.records[0] || {};
        res.json({ success: true, total: j.result.total, fields: Object.keys(sample) });
    } catch (e) {
        res.json({ success: false, stage: 'network', error: e.message });
    }
});

app.get('/api/bike/datasets', async (req, res) => {
    const terms = ['אופנוע', 'דו גלגלי', 'דגמי רכב', 'כלי רכב', 'רישוי רכב', 'מנוע הילוכים'];
    try {
        const results = await Promise.all(terms.map(async t => {
            try {
                const r = await fetch('https://data.gov.il/api/3/action/package_search?q=' + encodeURIComponent(t) + '&rows=20');
                const j = await r.json();
                return (j && j.result && j.result.results) || [];
            } catch (e) { return []; }
        }));
        const seen = new Map();
        for (const list of results) {
            for (const p of list) {
                if (!seen.has(p.id)) {
                    seen.set(p.id, {
                        title: p.title,
                        resources: (p.resources || []).map(x => ({ id: x.id, name: x.name, format: x.format }))
                    });
                }
            }
        }
        const out = [...seen.values()];
        res.json({ success: true, count: out.length, datasets: out });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/bike/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, '');
    if (plate.length < 5) return res.json({ success: false, message: 'מספר לא תקין' });
    try {
        const filters = encodeURIComponent(JSON.stringify({ mispar_rechev: Number(plate) }));
        const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${BIKE_REGISTRY_ID}&filters=${filters}&limit=1`;
        const r = await fetch(url);
        const j = await r.json();
        const rec = j?.success ? j.result.records[0] : null;
        if (!rec) return res.json({ success: false, message: 'לא נמצא אופנוע במספר זה' });
        res.json({ success: true, data: pickBikeFields(rec) });
    } catch (e) {
        res.status(500).json({ success: false, message: 'שגיאה בשליפה' });
    }
});

const HEAVY_REGISTRY_ID = "cd3acc5c-03c3-4c89-9c54-d40f93c0d790";

app.get('/api/heavy/inspect', async (req, res) => {
    try {
        const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${HEAVY_REGISTRY_ID}&limit=1`;
        const r = await fetch(url);
        const text = await r.text();
        let j;
        try {
            j = JSON.parse(text);
        } catch (e) {
            return res.json({ success: false, stage: 'parse', httpStatus: r.status, preview: text.slice(0, 200) });
        }
        if (!j.success) {
            return res.json({ success: false, stage: 'datastore', error: j.error || null, httpStatus: r.status });
        }
        const sample = (j.result && j.result.records && j.result.records[0]) || {};
        res.json({ success: true, total: j.result.total, fields: Object.keys(sample) });
    } catch (e) {
        res.json({ success: false, stage: 'network', error: e.message });
    }
});

const HEAVY_ALLOWED_FIELDS = [
    "mispar_rechev", "tozeret_nm", "tozeret_eretz_nm", "degem_nm", "shnat_yitzur",
    "sug_delek_nm", "nefach_manoa", "mishkal_kolel", "hanaa_nm", "grira_nm",
    "zmig_kidmi", "zmig_ahori", "moed_aliya_lakvish", "kvutzat_sug_rechev"
];

app.get('/api/heavy/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, '');
    if (plate.length < 5) return res.json({ success: false, message: 'מספר לא תקין' });
    try {
        const filters = encodeURIComponent(JSON.stringify({ mispar_rechev: Number(plate) }));
        const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${HEAVY_REGISTRY_ID}&filters=${filters}&limit=1`;
        const r = await fetch(url);
        const j = await r.json();
        const rec = j?.success ? j.result.records[0] : null;
        if (!rec) return res.json({ success: false, message: 'לא נמצא רכב כבד במספר זה' });
        const out = {};
        for (const key of HEAVY_ALLOWED_FIELDS) {
            const v = rec[key];
            if (v === null || v === undefined) continue;
            const s = String(v).trim();
            if (s === "" || /^dnf$/i.test(s)) continue;
            out[key] = s;
        }
        res.json({ success: true, data: out });
    } catch (e) {
        res.status(500).json({ success: false, message: 'שגיאה בשליפה' });
    }
});

// ---------- מאגר כלי רכב ביבוא אישי (data.gov.il) ----------
const PERSONAL_IMPORT_ID = "03adc637-b6fe-402b-9937-7c3d3afc9140";

app.get('/api/personal-import/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, '');
    if (plate.length < 5) return res.json({ success: false, message: 'מספר לא תקין' });
    try {
        const records = await searchDatastore(PERSONAL_IMPORT_ID, { mispar_rechev: Number(plate) }, 1);
        const r = records[0];
        if (!r) return res.json({ success: false, message: 'הרכב לא נמצא במאגר יבוא אישי' });

        // למאגר יבוא אישי אין כוח סוס. מנסים למצוא אותו במאגר הדגמים הרשמי לפי שם דגם, שנה ונפח מנוע
        let horsepower = null;
        try {
            const year = toNumber(r.shnat_yitzur);
            const cc = toNumber(r.nefach_manoa);
            const rows = await searchDatastore(MODELS_ID, { degem_nm: String(r.degem_nm || ''), shnat_yitzur: year }, 100);
            const match = rows.find(x => toNumber(x.koah_sus) != null
                && (cc == null || toNumber(x.nefah_manoa) == null || Math.abs(toNumber(x.nefah_manoa) - cc) <= 30));
            if (match) horsepower = toNumber(match.koah_sus);
        } catch (e) {}

        res.json({
            success: true,
            data: {
                plate,
                horsepower,
                manufacturer: toText(r.tozeret_nm),
                manufacturerCountry: toText(r.tozeret_eretz_nm),
                model: toText(r.degem_nm),
                engineModel: toText(r.degem_manoa),
                year: toNumber(r.shnat_yitzur),
                engineCc: toNumber(r.nefach_manoa),
                totalWeight: toNumber(r.mishkal_kolel),
                fuel: toText(r.sug_delek_nm),
                vehicleType: toText(r.sug_rechev_nm),
                importType: toText(r.sug_yevu),
                firstOnRoad: toText(r.moed_aliya_lakvish),
                lastTest: toText(r.mivchan_acharon_dt),
                licenseValidUntil: toText(r.tokef_dt)
            }
        });
    } catch (e) {
        if (e.message === 'DATASTORE_UNAVAILABLE') {
            return res.status(503).json({ success: false, message: 'שירות משרד התחבורה לא זמין כרגע, נסה שוב בעוד דקה' });
        }
        res.status(500).json({ success: false, message: 'שגיאה בשליפה' });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
