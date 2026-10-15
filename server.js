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

// ---------- תאוצה 0-100 מקבצים ידניים (קבצים 1 עד 30) ----------
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
            if (Array.isArray(data)) {
                accelTable = accelTable.concat(data);
                console.log(`[DATA OK] נטען בהצלחה: ${fileName} (${data.length} רשומות)`);
            }
        }
    } catch (e) {
        console.error(`[DATA ERROR] שגיאה בטעינת ${fileName}:`, e.message);
    }
});

// שמות יצרנים בעברית מהרישוי -> שם באנגלית כמו בקובץ התאוצה
const HE_MAKE_ALIASES = {
    "אבארט": "Abarth", "קופרה": "Cupra", "אאודי": "Audi", "אודי": "Audi",
    "אופל": "Opel", "אופל גרמניה": "Opel", "אופל פולין": "Opel", "אופל ספרד": "Opel",
    "אופל צרפת": "Opel", "אופל אנגליה": "Opel", "אופל סלובקיה": "Opel",
    "אינפיניטי": "Infiniti", "ניסאן": "Nissan", "איווייס": "Aiways", "איווויס": "Aiways",
    "איויאיסי": "EVEASY", "אורה": "ORA", "אוואטר": "AVATR", "אומודה": "OMODA",
    "איסוזו": "Isuzu", "אלפא רומיאו": "Alfa Romeo", "מ.ג": "MG", "אם ג'י": "MG",
    "אסטון מרטין": "Aston Martin", "אקספנג": "XPENG", "ב מ וו": "BMW", "בי ווי די": "BYD",
    "ביואיק": "Buick", "בנטלי": "Bentley", "ג'אקו": "JAECOO", "גאקו": "JAECOO",
    "GAC": "GAC", "GMC": "GMC", "ג'יפ": "Jeep", "גיפ": "Jeep", "יונדאי": "Hyundai",
    "ג'נסיס": "Genesis", "גילי": "Geely", "דאצ'יה": "Dacia", "דאציה": "Dacia",
    "דודג'": "Dodge", "דונגפנג": "Dongfeng", "DS": "DS", "דייהטסו": "Daihatsu",
    "דיפאל": "Deepal", "הונגצ'י": "Hongqi", "הונדה": "Honda", "וויה": "Voyah",
    "וולבו": "Volvo", "וולוו": "Volvo", "וואי": "WEY", "זיקר": "Zeekr",
    "טויוטה": "Toyota", "טסלה": "Tesla", "יגואר": "Jaguar", "יודו": "Yudo",
    "לינק אנד קו": "Lynk & Co", "ליפמוטור": "Leapmotor", "למבורגיני": "Lamborghini",
    "לנדרובר": "Land Rover", "רובר": "Land Rover", "לקסוס": "Lexus", "מאזדה": "Mazda",
    "מזדה": "Mazda", "מיני": "Mini", "מזראטי": "Maserati", "מרצדס": "Mercedes-Benz",
    "מקלארן": "McLaren", "מיצובישי": "Mitsubishi", "מקסוס": "Maxus", "ניאו": "NIO",
    "סאאב": "Saab", "סיאט": "Seat", "סובארו": "Subaru", "סוזוקי": "Suzuki",
    "סמארט": "Smart", "סיטרואן": "Citroen", "סקודה": "Skoda", "סקייוול": "Skywell",
    "פולסטאר": "Polestar", "סרס": "Seres", "פוטון": "Foton", "פולקסווגן": "Volkswagen",
    "פורד": "Ford", "פורשה": "Porsche", "פורתינג": "Forthing", "פיאט": "Fiat",
    "פיג'ו": "Peugeot", "פרארי": "Ferrari", "צ'רי": "Chery", "קאדילאק": "Cadillac",
    "קיה": "Kia", "קיי גי מוביליט": "KGM", "סאנגיונג": "KGM", "קרייזלר": "Chrysler",
    "רולס רויס": "Rolls-Royce", "שברולט": "Chevrolet", "רנו": "Renault"
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
    "": "פרטי",
    "החכר": "החכרה (ליסינג)",
    "השכרה": "השכרה",
    "יבוא אישי": "יבוא אישי",
    "יבוא אישי-משומש": "יבוא אישי משומש",
    "מדינת ישראל": "רכב ממשלתי",
    "ביס לנהיגה\"": "בית ספר לנהיגה",
    "משומש מיבואן": "משומש מיבואן"
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
    "ESTATE": "סטיישן", "STATION": "סטיישן", "COUPE": "קופה", "CABRIO": "קבריולה (גג פתוח)",
    "CABRIOLET": "קבריולה (גג פתוח)", "CONVERTIBLE": "קבריולה (גג פתוח)", "PICKUP": "טנדר",
    "PICK-UP": "טנדר", "VAN": "מסחרי / ואן", "MINIVAN": "מיניוואן", "CROSSOVER": "קרוסאובר",
    "הצ'בק": "האצ'בק", "הצבק": "האצ'בק", "האצ'בק": "האצ'בק", "האצבק": "האצ'בק",
    "סדאן": "סדאן", "סטיישן": "סטיישן", "קופה": "קופה", "פנאי": "פנאי / שטח",
    "שטח": "רכב שטח", "טנדר": "טנדר", "מסחרי": "מסחרי / ואן", "ואן": "מסחרי / ואן",
    "מיניוואן": "מיניוואן", "משא אחוד": "מסחרי סגור (משא אחוד)", "משא בלתי אחוד": "טנדר / מסחרי פתוח",
    "רכב שדה": "רכב שטח", "אוטובוס זעיר": "טרנזיט / היסעים"
};

function resolveBodyType(car, row) {
    const rawMerkav = toText(row?.merkav) || toText(car?.merkav) || toText(row?.shilda_nm) || toText(car?.shilda_nm);
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

async function checkDisabled(plate) {
    try {
        const cleanPlate = String(plate).replace(/\D/g, "");
        let records = await searchDatastore(DISABLED_ID, { "MISPAR RECHEV": cleanPlate }, 5);
        if (!records || records.length === 0) {
            records = await searchDatastore(DISABLED_ID, { "MISPAR RECHEV": Number(cleanPlate) }, 5);
        }
        if (!records || records.length === 0) {
            const byText = await searchDatastore(DISABLED_ID, null, 10, cleanPlate);
            records = (byText || []).filter(r => {
                const val = r["MISPAR RECHEV"] || r["mispar_rechev"] || Object.values(r)[1];
                return String(val).replace(/\D/g, "") === cleanPlate;
            });
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
        return { hasBadge: false, badgeType: null, issueDate: null, error: true };
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

        // ==========================================
        // הוספת הדפסה בלוגים של כל השדות שחוזרים מהמאגר
        // ==========================================
        if (row) {
            console.log("=== מפתחות זמינים בשורת המאגר (row) ===");
            console.log(Object.keys(row));
        } else {
            console.log("=== לא נמצאה שורת דגם (row) במאגר MODELS_ID עבור רכב זה ===");
        }

        const history = buildHistory(historyRaw);

        const manufacturer = car.tozeret_nm || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || row?.kinuy_mishari || "לא ידוע";
        const trim = toText(row?.ramat_gimur) || toText(car.ramat_gimur) || null;
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = toNumber(row?.koah_sus) ?? toNumber(car.koah_sus);
        const engineCc = toNumber(row?.nefah_manoa) ?? toNumber(car.nefah_manoa);
        const testExpiry = car.tokef_dt || null;
        const bodyType = resolveBodyType(car, row);

        const registryOwnership = labelRegistryOwnership(car.baalut);
        const historyOwnership = ownershipList.length
            ? ownershipList[ownershipList.length - 1].type
            : (history?.origin ?? null);
        const currentOwnership = registryOwnership || historyOwnership;

        const makeTexts = [manufacturer, car.tozeret_nm, car.kinuy_mishari, car.sug_degem].filter(Boolean);
        for (const [he, en] of Object.entries(HE_MAKE_ALIASES)) {
            if (String(manufacturer).includes(he) || String(car.tozeret_nm || "").includes(he)) {
                makeTexts.push(en);
            }
        }
        const modelTexts = [car.kinuy_mishari, car.degem_nm, car.ramat_gimur, model].filter(Boolean);
        const acceleration = lookupAccel(makeTexts, modelTexts, year, hp, engineCc);
        const hasDisabledBadge = Boolean(disabledResult?.hasBadge);

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
            ac: fflag("mazgan_ind"),
            abs: fflag("abs_ind"),
            sunroof: fflag("halon_bagg_ind"),
            alloyWheels: fflag("galgaley_sagsoget_kala_ind"),
            powerSteering: fflag("hege_koah_ind")
        };

        const safety = {
            laneDeparture: fflag("bakarat_stiya_menativ_ind"),
            pedestrianDetection: fflag("zihuy_holchey_regel_ind"),
            rearCamera: fflag("matzlema_ahorit_ind") || fflag("matzlemet_reverse_ind")
        };

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
                disabledBadgeDetails: hasDisabledBadge ? {
                    badgeType: disabledResult.badgeType,
                    issueDate: disabledResult.issueDate
                } : null,
                bodyType,
                merkav: bodyType,
                kmSinceTest: history?.kmSinceTest ?? null,
                technical,
                equipment,
                safety
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
        if (!history && ownershipList.length === 0) {
            return res.json({ success: false, message: "לא נמצאה היסטוריה לרכב זה" });
        }
        res.json({ success: true, history: history || {}, ownershipList });
    } catch (e) {
        res.status(500).json({ success: false, message: "שגיאה בשליפת ההיסטוריה" });
    }
});

app.post('/api/report', async (req, res) => {
    try {
        const { plate, category, notes, carInfo } = req.body;
        const params = new URLSearchParams();
        params.append("access_key", "57cbc2ae-17ad-4c60-b73a-6558c56e8f01");
        params.append("subject", `דיווח מהאפליקציה: רכב ${plate} [${category}]`);
        params.append("from_name", "מערכת בדיקת רכב");
        params.append("מספר רכב", plate);
        params.append("סוג דיווח", category);
        params.append("הערות", notes || "ללא הערות");
        params.append("פרטי רכב", carInfo || "");

        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: params
        });

        const rawText = await response.text();
        const result = JSON.parse(rawText);
        if (result.success) {
            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        return res.status(500).json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
