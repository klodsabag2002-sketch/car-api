const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    console.log(`\n========================================`);
    console.log(`🔍 שליפת נתונים מלאה ומקיפה למספר: ${plate}`);
    console.log(`========================================`);
    
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const specsResource = "142aee44-ac7c-4db4-b426-8eaf28f13fb0";
    
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&q=${plate}`;

    try {
        const response = await fetch(govUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();

        if (data && data.success && data.result && data.result.records.length > 0) {
            const car = data.result.records.find(r => r.mispar_rechev == plate) || data.result.records[0];
            
            console.log("\n📋 --- [1] כל שדות הרישוי מהמאגר הפעיל ---");
            for (let key in car) {
                console.log(`   🔸 ${key}: ${car[key]}`);
            }
            console.log("------------------------------------------\n");

            const tozeretCd = car.tozeret_cd;
            const degemCd = String(car.degem_cd).trim();

            // שליפת כל טבלת המפרטים האפשרית לפי קוד דגם
            if (tozeretCd && degemCd) {
                try {
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&q=${degemCd}`;
                    const specsResponse = await fetch(specsUrl);
                    if (specsResponse.ok) {
                        const specsData = await specsResponse.json();
                        if (specsData.success && specsData.result.records.length > 0) {
                            console.log(`📋 --- [2] נמצאו ${specsData.result.records.length} רשומות מפרט עבור קוד דגם: ${degemCd} ---`);
                            specsData.result.records.forEach((rec, idx) => {
                                console.log(`\n   🔹 רשומה מפרט מספר ${idx + 1}:`);
                                for (let sKey in rec) {
                                    console.log(`      - ${sKey}: ${rec[sKey]}`);
                                }
                            });
                            console.log("--------------------------------------------------\n");
                        } else {
                            console.log("⚠️ לא נמצאו רשומות במאגר המפרטים עבור קוד דגם זה.");
                        }
                    }
                } catch (specErr) {
                    console.error("❌ שגיאה בשליפת מפרט:", specErr);
                }
            }

            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || degemCd,
                    year: car.shnat_yitzur || "לא ידוע",
                    color: car.zeva_rechev || car.rechev_col || "לא ידוע",
                    horsepower: `ראה לוגים מלאים ב-Render עבור מספר ${plate}`,
                    testExpiry: car.tokef_dt || null
                }
            });
        } else {
            res.json({ success: false, message: "המספר אינו קיים במאגר" });
        }
    } catch (error) {
        console.error("❌ שגיאה ראשית:", error);
        res.status(500).json({ success: false, error: "שגיאה כללית בשליפה" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 השרת רץ בפורט ${PORT}`);
});
