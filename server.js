const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    console.log(`\n=== בדיקת עומק למספר רישוי: ${plate} ===`);
    
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&q=${plate}`;

    try {
        const response = await fetch(govUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();

        if (data && data.success && data.result && data.result.records.length > 0) {
            // מוצא את הרכב המדויק
            const car = data.result.records.find(r => r.mispar_rechev == plate) || data.result.records[0];
            
            // הדפסה מלאה וקריאה של כל שדה אפשרי באובייקט של משרד התחבורה
            console.log("--- תוצאות מלאות ממשרד התחבורה ---");
            for (let key in car) {
                console.log(`${key}: ${car[key]}`);
            }
            console.log("----------------------------------");

            const tozeretCd = car.tozeret_cd;
            const degemCd = String(car.degem_cd).trim();
            const manufacturer = car.shem_yatzran || car.tozeret_nm || "לא ידוע";
            const year = car.shnat_yitzur || "לא ידוע";
            const displayModel = car.toar_degem || car.כינוי_מסחרי || car.degem_nm || degemCd;
            const gimur = car.ramat_gimur || "";
            const engineCode = car.degem_manoa || "לא ידוע";

            let hpValue = "מחפש נתונים בלוגים...";

            // ננסה לשלוף במקביל את כל טבלת המפרטים המלאה של הקוד דגם הזה
            if (tozeretCd && degemCd) {
                try {
                    const specsResource = "142aee44-ac7c-4db4-b426-8eaf28f13fb0";
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&q=${degemCd}`;
                    const specsResponse = await fetch(specsUrl);
                    if (specsResponse.ok) {
                        const specsData = await specsResponse.json();
                        if (specsData.success && specsData.result.records.length > 0) {
                            const specRecord = specsData.result.records.find(r => String(r.tozeret_cd) === String(tozeretCd)) || specsData.result.records[0];
                            console.log("--- מפרט טכני מלא מהמאגר הממשלתי ---");
                            console.log(JSON.stringify(specRecord, null, 2));
                            console.log("---------------------------------------");
                        }
                    }
                } catch (err) {
                    console.error("שגיאה بشליפת מפרט נוסף:", err);
                }
            }

            res.json({
                success: true,
                data: {
                    manufacturer: manufacturer,
                    model: displayModel,
                    year: year,
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: `קוד מנוע: ${engineCode} (בדוק לוגים ב-Render)`,
                    testExpiry: car.tokef_dt || null
                }
            });
        } else {
            res.json({ success: false, message: "המספר אינו קיים במאגר" });
        }
    } catch (error)  {
        console.error("שגיאה ראשית:", error);
        res.status(500).json({ success: false, error: "שגיאה כללית בשליפה" });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
