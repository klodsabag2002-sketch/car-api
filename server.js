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
            
            // נסיון לאתר כוח סוס ממגוון שדות אפשריים במאגר
            let hp = car.koach_sus || car.mispar_mekamot || car. הספק_מנוע || car.balam_koach || car.nefach_manoa || car.engine_power || car.p_poten || car.koach || null;
            
            // אם יש נפח מנוע או סמ"ק אבל אין כוח סוס ישיר, נוכל להציג את נתוני המנוע הקיימים
            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || "לא ידוע",
                    year: car.shnat_yitzur || "לא ידוע",
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: hp ? `${hp} כ"ס` : (car.nefach_manoa ? `נפח: ${car.nefach_manoa} סמ"ק` : "לא זמין במאגר זה"),
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
