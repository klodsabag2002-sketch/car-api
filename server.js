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

// ---------- טעינת קבצי תאוצה 0-100 ----------
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
    "איסוזו": "Isuzu", "אלפא רומיאו": "Alfa Romeo", "מ.ג": "MG", "אם ג'י": "MG",
    "ב.מ.וו": "BMW", "ב מ וו": "BMW", "בי ווי די": "BYD", "בי וי די": "BYD",
    "ביואיק": "Buick", "בנטלי": "Bentley", "ג'אקו": "JAECOO", "ג'.אמ.סי": "GMC",
    "ג'יפ": "Jeep", "יונדאי": "Hyundai", "ג'נסיס": "Genesis", "ג'ילי": "Geely",
    "דאצ'יה": "Dacia", "דודג'": "Dodge", "די אס": "DS", "דייהטסו": "Daihatsu",
    "הונגצ'י": "Hongqi", "הונדה": "Honda", "וויה": "Voyah", "וולבו": "Volvo",
    "וולוו": "Volvo", "וואי": "WEY", "זיקר": "Zeekr", "טויוטה": "Toyota",
    "טסלה": "Tesla", "יגואר": "Jaguar", "לינק אנד קו": "Lynk & Co", "ליפמוטור": "Leapmotor",
    "למבורגיני": "Lamborghini", "לנד רובר": "Land Rover", "ריינג' רובר": "Land Rover",
    "לקסוס": "Lexus", "מאזדה": "Mazda", "מזדה": "Mazda", "מיני": "Mini",
    "מרצדס": "Mercedes-Benz", "מיצובישי": "Mitsubishi", "סאאב": "Saab", "סיאט": "Seat",
    "סובארו": "Subaru", "סוזוקי": "Suzuki", "סיטרואן": "Citroen", "סקודה": "Skoda",
    "פולסטאר": "Polestar", "פולקסווגן": "Volkswagen", "פורד": "Ford", "פורשה": "Porsche",
    "פיאט": "Fiat", "פיג'ו": "Peugeot", "קאדילאק": "Cadillac", "קיה": "Kia",
    "קרייזלר": "Chrysler", "שברולט": "Chevrolet", "רנו": "Renault"
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

function toBool(value) {
    if (value === true || value === 1 || value === "1" || value === "כן") return true;
    if (value === false || value === 0 || value === "0" || value === "לא") return false;
    return null;
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
    "הצ'בק": "האצ'בק", "הצבק": "האצ'בק", "האצ'בק": "האצ'בק", "סדאן": "סדאן",
    "סטיישן": "סטיישן", "קופה": "קופה", "פנאי": "פנאי / שטח", "שטח": "רכב שטח",
    "טנדר": "טנדר", "מסחרי": "מסחרי / ואן", "ואן": "מסחרי / ואן", "מיניוואן": "מיניוואן",
    "משא אחוד": "מסחרי סגור (משא אחוד)", "משא בלתי אחוד": "טנדר / מסחרי פתוח",
    "רכב שדה": "רכב שטח", "אוטובוס זעיר": "טרנזיט / היסעים",
    "P": "האצ'בק", "M": "סטיישן", "S": "סדאן", "C": "קופה", "J": "פנאי / שטח (SUV)",
    "V": "מסחרי / ואן", "T": "טנדר", "בק'צה": "האצ'בק", "נאדס": "סדאן", "ןישייטס": "סטיישן"
};

function resolveBodyType(car, row) {
    const rawMerkav = toText(row?.merkav) || toText(car?.merkav);
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

// מיפוי תיבת הילוכים
function resolveGearbox(val) {
    const s = toText(val);
    if (!s) return null;
    if (s.includes("אוטומט") || s === "A" || s === "1") return "אוטומטית";
    if (s.includes("ידני") || s === "M" || s === "2") return "ידנית";
    if (s.includes("רובוט") || s.includes("כפול") || s === "R") return "רובוטית כפולת מצמדים";
    if (s.includes("רציף") || s === "C") return "רציפה (CVT)";
    return s;
}

// מיפוי הנעה
function resolveDrive(val) {
    const s = toText(val);
    if (!s) return "4X2 (הנעה רגילה)";
    if (s.includes("4X4") || s.includes("4WD") || s.includes("AWD") || s.includes("כפולה")) return "4X4 (הנעה כפולה)";
    if (s.includes("4X2") || s.includes("2WD")) return "4X2 (הנעה רגילה)";
    return s;
}

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

        // ---------- חילוץ מפרט טכני ובטיחות מורחב ----------
        const techSpecs = {
            totalWeight: toNumber(row?.mishkal_kolel) ?? toNumber(car?.mishkal_kolel),
            curbWeight: toNumber(row?.mishkal_atmi) ?? toNumber(car?.mishkal_atmi),
            doors: toNumber(row?.mispar_dlatot) ?? toNumber(car?.mispar_dlatot),
            seats: toNumber(row?.mispar_moshavim) ?? toNumber(car?.mispar_moshavim),
            airbags: toNumber(row?.mispar_kariyot_avir) ?? toNumber(car?.mispar_kariyot_avir),
            gearbox: resolveGearbox(row?.tevat_hiluchim || car?.tevat_hiluchim),
            drive: resolveDrive(row?.hanaa_cd || car?.hanaa_cd),
            towWithBrakes: toNumber(row?.kosher_grira_im_blamim) ?? toNumber(car?.kosher_grira_im_blamim),
            towNoBrakes: toNumber(row?.kosher_grira_bli_blamim) ?? toNumber(car?.kosher_grira_bli_blamim),
            hasHook: toBool(row?.vav_grira_ind || car?.vav_grira_ind) || false,
            cargoBox: toText(row?.argaz_ind || car?.argaz_ind) || "ללא ארגז",
            // אבזור ונוחות
            ac: toBool(row?.mazgan_ind ?? 1), // ברוב המוחלט קיים
            sunroof: toBool(row?.halon_bagag_ind || car?.halon_bagag_ind),
            alloyWheels: toBool(row?.hishukey_magnesium_ind),
            powerWindows: toNumber(row?.halonot_hashmal) ?? 4,
            powerSteering: toBool(row?.hege_koah_ind ?? 1),
            abs: toBool(row?.abs_ind ?? 1),
            esp: toBool(row?.bakaat_yatzivut_ind ?? 1)
        };

        const safetySpecs = {
            safetyScore: toNumber(row?.ramat_eivzur_betihuti) ?? toNumber(car?.ramat_eivzur_betihuti),
            airbags: techSpecs.airbags,
            esp: techSpecs.esp,
            abs: techSpecs.abs,
            autoBraking: toBool(row?.bliat_hirum_ind),
            laneDeparture: toBool(row?.stiya_menativ_ind),
            blindSpot: toBool(row?.shetah_met_ind),
            adaptiveCruise: toBool(row?.bakarat_shyut_adaptivit_ind),
            pedestrianDetection: toBool(row?.zihuy_holhey_regel_ind),
            rearCamera: toBool(row?.matzlema_ahorit_ind)
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
                bodyType: bodyType,
                merkav: bodyType,
                kmSinceTest: history?.kmSinceTest ?? null,
                techSpecs,
                safetySpecs
            }
        });
    } catch (error) {
        console.error(`שגיאה בחיפוש מספר ${plate}:`, error);
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

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
