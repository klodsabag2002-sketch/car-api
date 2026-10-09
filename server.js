const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&filters={"mispar_rechev":${plate}}`;

    try {
        const response = await fetch(govUrl);
        const data = await response.json();

        if (data && data.success && data.result && data.result.records && data.result.records.length > 0) {
            const car = data.result.records[0];
            const degemCd = car.degem_cd;

            let horsepowerText = "לא זמין";
            let fuelType = car.sog_delek_nm || "בנזין";

            // שליפת נתונים מתקדמת ממפרט טכני לפי קוד דגם
            if (degemCd) {
                try {
                    // מאגר מפרטים טכניים ממשלתי
                    const specsResource = "14283188-4357-463d-a7a2-ee851b22e177";
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&filters={"degem_cd":${degemCd}}`;
                    
                    const specsResponse = await fetch(specsUrl);
                    const specsData = await specsResponse.json();

                    if (specsData && specsData.success && specsData.result && specsData.result.records && specsData.result.records.length > 0) {
                        const spec = specsData.result.records[0];
                        const hp = spec.koach_sus || spec.הספק_מנוע || spec.hp;
                        if (hp) {
                            horsepowerText = `${hp} כ"ס`;
                        }
                    }
                } catch (specErr) {
                    console.error("שגיאה בשליפת מפרט טכני:", specErr);
                }
            }

            // גיבוי למקרה שהשדה קיים בבסיס או לפי נפח
            if (horsepowerText === "לא זמין") {
                if (car.koach_sus || car.הספק_מנוע) {
                    horsepowerText = `${car.koach_sus || car.הספק_מנוע} כ"ס`;
                } else if (car.nefach_manoa) {
                    horsepowerText = `${car.nefach_manoa} סמ"ק`;
                }
            }

            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || "לא ידוע",
                    year: car.shnat_yitzur || "לא ידוע",
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: horsepowerText,
                    fuel: fuelType,
                    testExpiry: car.tokef_dt || null
                }
            });
        } else {
            res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
