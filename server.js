const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ---------- טעינת מאגר PHEV ----------
let getCombinedPHEVPower = (m, mod, hp) => hp;
let hasPhevData = false;
try {
    const phevModule = require('./phevData');
    if (phevModule && phevModule.getCombinedPHEVPower) {
        getCombinedPHEVPower = phevModule.getCombinedPHEVPower;
        hasPhevData = true;
    }
} catch (e) {
    console.log('[PHEV DATA] phevData.js לא נטען, ממשיך כרגיל.');
}

// ---------- תוספת: טעינת מאגר HEV / MHEV ----------
let getCombinedHEVPower = (m, mod, hp, cc) => hp;
let hasHevData = false;
try {
    const hevModule = require('./hevData');
    if (hevModule && hevModule.getCombinedHEVPower) {
        getCombinedHEVPower = hevModule.getCombinedHEVPower;
        hasHevData = true;
    }
} catch (e) {
    console.log('[HEV DATA] hevData.js לא נטען, ממשיך כרגיל.');
}
// --------------------------------------------------

app.use(cors());
app.use(express.json());

const CAR_REGISTRY_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";
const MODELS_ID = "142afde2-6228-49f9-8a29-9b6c3a0cbe40";
const HISTORY_ID = "56063a99-8a3e-4ff4-912e-5966c0279bad";
const OWNERSHIP_ID = "bb2355dc-9ec7-4f06-9c3f-3344672171da";
const DISABLED_ID = "c8b9f9c8-4612-4068-934f-d4acd2e3c06e";
const IMPORTER_PRICE_ID = "39f455bf-6db0-4926-859d-017f34eacbcb";

// ---------- מנוע טבלת צייד הרכבים (ענן - Firebase) ----------
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
    "acceleration29.json", "acceleration30.json"
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

async function searchDatastore(resourceId, filters, limit = 100, q = "") {
    const f = filters ? `&filters=${encodeURIComponent(JSON.stringify(filters))}` : "";
    const qq = q ? `&q=${encodeURIComponent(q)}` : "";
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}${f}${qq}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.success ? (data.result?.records || []) : [];
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
        return rows.find(r => toNumber(r.koah_sus) != null) || rows[0];
    }
    return null;
}

app.get('/', (req, res) => {
    res.status(200).send('Car API is running successfully!');
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

        const importerData = await fetchImporterPriceApi(car, row);
        const history = buildHistory(historyRaw);

        const manufacturer = car.tozeret_nm || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || row?.kinuy_mishari || "לא ידוע";
        const trim = toText(row?.ramat_gimur) || toText(car.ramat_gimur) || null;
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = toNumber(row?.koah_sus) ?? toNumber(car.koah_sus);
        const engineCc = toNumber(row?.nefah_manoa) ?? toNumber(car.nefah_manoa);

        // ---------- בדיקה ושילוב נתוני PHEV או HEV/MHEV ----------
        let combinedHp = hp;
        let isPhev = false;

        const carDesc = `${manufacturer} ${car.degem_nm || ''} ${trim || ''} ${model}`;

        if (hasPhevData) {
            const phevVal = getCombinedPHEVPower(carDesc, model, hp);
            if (phevVal && phevVal !== hp) {
                combinedHp = phevVal;
                isPhev = true;
            }
        }

        if (!isPhev && hasHevData) {
            const hevVal = getCombinedHEVPower(carDesc, model, hp, engineCc);
            if (hevVal && hevVal !== hp) {
                combinedHp = hevVal;
                isPhev = true; // משתמש באותו מנגנון כפתור חשיפה גם ל-HEV!
            }
        }
        // -------------------------------------------------------------

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
            rearCamera: fflag("matzlemat_reverse_ind") ?? fflag("matzlemet_reverse_ind")
        };

        res.json({
            success: true,
            data: {
                plate, manufacturer, model, trim, year,
                color: car.zeva_rechev || car.tzeva_rechev || "לא ידוע",
                chassis: toText(car.misgeret),
                tireFront: toText(car.zmig_kidmi),
                tireRear: toText(car.zmig_ahori),
                lastTest: toText(car.mivchan_acharon_dt),
                engineCc, 
                horsepower: hp,
                combinedHorsepower: isPhev ? combinedHp : null, 
                isPhev,                                         
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
                technical, equipment, safety
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
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

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
