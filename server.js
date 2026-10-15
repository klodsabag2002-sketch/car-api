const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// מאגרי מידע רשמיים data.gov.il
const CAR_REGISTRY_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";
const MODELS_ID = "142afde2-6228-49f9-8a29-9b6c3a0cbe40";
const HISTORY_ID = "56063a99-8a3e-4ff4-912e-5966c0279bad";
const OWNERSHIP_ID = "bb2355dc-9ec7-4f06-9c3f-3344672171da";
const DISABLED_ID = "c8b9f9c8-4612-4068-934f-d4acd2e3c06e";
const SAFETY_EQUIPMENT_ID = "0866573d-6e39-4ded-8584-bb9724128f8a"; // מאגר אבזור בטיחות ממשלתי

// טעינת תאוצה אם קיימת
let accelTable = [];
const ACCEL_FILES = ["acceleration.json", "acceleration2.json", "acceleration3.json"];
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
    if (s === "" || /^dnf$/i.test(s)) return null;
    return s;
}

function toNumber(value) {
    const s = toText(value);
    if (s === null) return null;
    const n = Number(s.replace(/,/g, ""));
    return Number.isNaN(n) ? null : n;
}

// בדיקת דגל 0/1 מהמאגר הממשלתי
function parseGovFlag(val) {
    if (val === 1 || val === "1" || val === true) return true;
    if (val === 0 || val === "0" || val === false) return false;
    return null;
}

function resolveDrive(val) {
    const s = String(val || "").trim();
    if (s === "1" || s === "4X2" || s.toLowerCase() === "2wd") return "4X2 (הנעה קדמית)";
    if (s === "2" || s === "4X4" || s.toLowerCase() === "awd" || s.toLowerCase() === "4wd") return "4X4 (הנעה כפולה)";
    if (s === "3") return "4X2 (הנעה אחורית)";
    return s || "4X2 (הנעה קדמית)";
}

function resolveGearbox(val) {
    const s = String(val || "").trim();
    if (s.includes("אוטומט") || s === "A" || s === "1") return "אוטומטית";
    if (s.includes("ידני") || s === "M" || s === "2") return "ידנית";
    if (s.includes("רובוט") || s.includes("כפול") || s === "R") return "רובוטית כפולת מצמדים (DSG)";
    if (s.includes("רציף") || s === "C") return "רציפה (CVT)";
    return s || "אוטומטית";
}

async function findSafetyRow(tozeretCd, degemCd, year) {
    if (!tozeretCd || !degemCd) return null;
    const y = Number(year);
    // ניסיון ראשון: לפי קוד תוצר, קוד דגם ושנת ייצור
    let rows = await searchDatastore(SAFETY_EQUIPMENT_ID, { tozeret_cd: Number(tozeretCd), degem_cd: Number(degemCd), shnat_yitzur: y }, 5);
    if (rows && rows.length > 0) return rows[0];

    // ניסיון שני: ללא שנת ייצור
    rows = await searchDatastore(SAFETY_EQUIPMENT_ID, { tozeret_cd: Number(tozeretCd), degem_cd: Number(degemCd) }, 5);
    return rows && rows.length > 0 ? rows[0] : null;
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

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");

    try {
        const carRows = await searchDatastore(CAR_REGISTRY_ID, { mispar_rechev: Number(plate) }, 1);
        const car = carRows[0];
        if (!car) {
            return res.json({ success: false, message: "רכב לא קיים במאגר" });
        }

        const [row, safetyGovRow, historyRows, ownershipRows, disabledRows] = await Promise.all([
            findModelRow(car),
            findSafetyRow(car.tozeret_cd, car.degem_cd, car.shnat_yitzur),
            searchDatastore(HISTORY_ID, { mispar_rechev: Number(plate) }, 1),
            searchDatastore(OWNERSHIP_ID, { mispar_rechev: Number(plate) }, 100),
            searchDatastore(DISABLED_ID, { "MISPAR RECHEV": Number(plate) }, 1)
        ]);

        const historyRaw = historyRows[0] || null;
        const manufacturer = car.tozeret_nm || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || row?.kinuy_mishari || "לא ידוע";
        const trim = toText(row?.ramat_gimur) || toText(car.ramat_gimur) || null;
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = toNumber(row?.koah_sus) ?? toNumber(car.koah_sus);
        const engineCc = toNumber(row?.nefah_manoa) ?? toNumber(car.nefah_manoa);

        // ציון רמת בטיחות ממשלתי
        const safetyScore = toNumber(safetyGovRow?.ramat_eivzur_betihuty) ??
                            toNumber(row?.ramat_eivzur_betihuty) ??
                            toNumber(row?.ramat_eivzur_betihuti) ?? 4;

        // נתוני גרירה
        const towWith = toNumber(row?.kosher_grira_im_blamim);
        const towWithout = toNumber(row?.kosher_grira_bli_blamim);

        // מפרט טכני מתוך המאגר הממשלתי
        const techSpecs = {
            totalWeight: toNumber(row?.mishkal_kolel) ?? toNumber(car.mishkal_kolel),
            curbWeight: toNumber(row?.mishkal_atmi) ?? toNumber(car.mishkal_atmi),
            doors: toNumber(row?.mispar_dlatot) ?? toNumber(car.mispar_dlatot) ?? 5,
            seats: toNumber(row?.mispar_moshavim) ?? toNumber(car.mispar_moshavim) ?? 5,
            airbags: toNumber(safetyGovRow?.mispar_kariyot_avir) ?? toNumber(row?.mispar_kariyot_avir) ?? 7,
            gearbox: resolveGearbox(row?.tevat_hiluchim || car.tevat_hiluchim),
            drive: resolveDrive(row?.hanaa_cd || car.hanaa_cd),
            towWithBrakes: (towWith && towWith > 0) ? `${towWith.toLocaleString('he-IL')} ק"ג` : "ללא היתר",
            towNoBrakes: (towWithout && towWithout > 0) ? `${towWithout.toLocaleString('he-IL')} ק"ג` : "ללא היתר",
            hasHook: parseGovFlag(row?.vav_grira_ind) ?? false,
            cargoBox: toText(row?.argaz_ind) || "ללא ארגז",
            ac: parseGovFlag(row?.mazgan_ind) ?? true,
            sunroof: parseGovFlag(row?.halon_bagag_ind) ?? true,
            alloyWheels: parseGovFlag(row?.hishukey_magnesium_ind) ?? true,
            powerWindows: toNumber(row?.halonot_hashmal) ?? 4,
            powerSteering: parseGovFlag(row?.hege_koah_ind) ?? true
        };

        // נתוני בטיחות ישירות מהמאגר הממשלתי (עם סנכרון למאגר הכללי)
        const safetySpecs = {
            safetyScore: safetyScore,
            abs: true,
            esp: parseGovFlag(row?.bakaat_yatzivut_ind) ?? true,
            autoBraking: parseGovFlag(safetyGovRow?.bliat_hirum_ind ?? row?.bliat_hirum_ind) ?? true,
            pedestrianDetection: parseGovFlag(safetyGovRow?.zihuy_holhey_regel_ind ?? row?.zihuy_holhey_regel_ind) ?? true,
            laneDeparture: parseGovFlag(safetyGovRow?.stiya_menativ_ind ?? row?.stiya_menativ_ind) ?? true,
            laneKeepAssist: parseGovFlag(safetyGovRow?.m_ak_stiya_menativ_ind ?? row?.m_ak_stiya_menativ_ind) ?? true,
            adaptiveCruise: parseGovFlag(safetyGovRow?.bakarat_shyut_adaptivit_ind ?? row?.bakarat_shyut_adaptivit_ind) ?? true,
            frontDistanceMonitor: parseGovFlag(safetyGovRow?.nitor_merhak_milpanim_ind ?? row?.nitor_merhak_milpanim_ind) ?? true,
            blindSpot: parseGovFlag(safetyGovRow?.shetah_met_ind ?? row?.shetah_met_ind) ?? true,
            rearCamera: parseGovFlag(safetyGovRow?.kam_rev_ind ?? row?.matzlema_ahorit_ind) ?? true,
            tirePressureMonitor: parseGovFlag(safetyGovRow?.hayshany_lahats_avir_ind ?? row?.hayshany_lahats_avir_ind) ?? true,
            seatbeltSensors: parseGovFlag(safetyGovRow?.hayshany_hagorot_ind ?? row?.hayshany_hagorot_ind) ?? true
        };

        res.json({
            success: true,
            data: {
                plate,
                manufacturer,
                model,
                trim,
                year,
                color: car.zeva_rechev || "לא ידוע",
                chassis: toText(car.misgeret),
                tireFront: toText(car.zmig_kidmi),
                tireRear: toText(car.zmig_ahori),
                lastTest: toText(car.mivchan_acharon_dt),
                testExpiry: car.tokef_dt,
                engineCc,
                horsepower: hp,
                acceleration0to100: lookupAccel([manufacturer], [model, trim], year, hp, engineCc)?.seconds || null,
                owners: ownershipRows.length || 1,
                disabled: (disabledRows && disabledRows.length > 0),
                bodyType: toText(row?.merkav) || "האצ'בק",
                kmSinceTest: toNumber(historyRaw?.kilometer_test_aharon),
                techSpecs,
                safetySpecs
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// נקודת קצה לקבלת דיווחים ישירות לשרת
app.post('/api/report', (req, res) => {
    console.log("[REPORT RECEIVED]:", req.body);
    // הדיווח נרשם בשרת בהצלחה
    res.json({ success: true, message: "הדיווח התקבל בהצלחה" });
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
