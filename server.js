const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    const resourceId = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}&filters={"mispar_rechev":${plate}}`;

    try {
        const response = await fetch(govUrl);
        const data = await response.json();

        if (data && data.success && data.result && data.result.records && data.result.records.length > 0) {
            const car = data.result.records[0];
            
            // חיפוש מתקדם של נתוני הספק או נפח מנוע ברשומות המאגר
            let hp = car.koach_sus || car.mispar_mekamot || car.הספק_מנוע || car.balam_koach || car.nefach_manoa || car.engine_power || car.p_poten || null;
            
            let horsepowerText = "לא זמין במאגר";
            if (hp) {
                horsepowerText = `${hp} כ"ס`;
            } else if (car.nefach_manoa) {
                horsepowerText = `נפח מנוע: ${car.nefach_manoa} סמ"ק`;
            }

            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || "לא ידוע",
                    year: car.shnat_yitzur || "לא ידוע",
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: horsepowerText,
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
