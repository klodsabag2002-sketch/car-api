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
    "acceleration.json",
    "acceleration2.json",
    "acceleration3.json",
    "acceleration4.json",
    "acceleration5.json",
    "acceleration6.json",
    "acceleration7.json",
    "acceleration8.json",
    "acceleration9.json",
    "acceleration10.json",
    "acceleration11.json",
    "acceleration12.json",
    "acceleration13.json",
    "acceleration14.json",
    "acceleration15.json",
    "acceleration16.json",
    "acceleration17.json",
    "acceleration18.json",
    "acceleration19.json",
    "acceleration20.json",
    "acceleration21.json",
    "acceleration22.json",
    "acceleration23.json",
    "acceleration24.json",
    "acceleration25.json",
    "acceleration26.json",
    "acceleration27.json",
    "acceleration28.json",
    "acceleration29.json",
    "acceleration30.json"
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
    "אבארט": "Abarth",
    "קופרה": "Cupra",
    "אאודי": "Audi",
    "אודי": "Audi",
    "אופל": "Opel",
    "אופל גרמניה": "Opel",
    "אופל פולין": "Opel",
    "אופל ספרד": "Opel",
    "אופל צרפת": "Opel",
    "אופל אנגליה": "Opel",
    "אופל סלובקיה": "Opel",
    "אינפיניטי": "Infiniti",
    "אינפיניטי יפן": "Infiniti",
    "אינפיניטי אנגליה": "Infiniti",
    "אינפיניטי בריטניה": "Infiniti",
    "אינפיניטי ארה\"ב": "Infiniti",
    "אינפיניטי ארהב": "Infiniti",
    "אינפיניטי מקסיקו": "Infiniti",
    "ניסאן": "Nissan",
    "ניסאן יפן": "Nissan",
    "ניסאן מקסיקו": "Nissan",
    "ניסאן ארה\"ב": "Nissan",
    "ניסאן ארהב": "Nissan",
    "ניסאן ארהב\"": "Nissan",
    "\"ניסאן ארהב": "Nissan",
    "ניסאן ספרד": "Nissan",
    "ניסאן אנגליה": "Nissan",
    "איווייס": "Aiways",
    "איווייס סין": "Aiways",
    "איווויס": "Aiways",
    "איוויס סין": "Aiways",
    "איויאיסי": "EVEASY",
    "איויאיסי סין": "EVEASY",
    "אי.וי איזי": "EVEASY",
    "אי וי איזי": "EVEASY",
    "אורה": "ORA",
    "אורה סין": "ORA",
    "אוואטר": "AVATR",
    "אווטר": "AVATR",
    "אוואטר סין": "AVATR",
    "אומודה": "OMODA",
    "אומודה סין": "OMODA",
    "איסוזו": "Isuzu",
    "איסוזו יפן": "Isuzu",
    "איסוזו תאילנד": "Isuzu",
    "איסוזו ארה\"ב": "Isuzu",
    "איסוזו ארהב": "Isuzu",
    "איסוזו ארהב\"": "Isuzu",
    "\"איסוזו ארהב": "Isuzu",
    "אל אי וי סי": "LEVC",
    "אל.אי.וי.סי": "LEVC",
    "אל אי וי סי אנגליה": "LEVC",
    "אלפא רומיאו": "Alfa Romeo",
    "אלפא רומיאו_אי": "Alfa Romeo",
    "אלפא רומאו": "Alfa Romeo",
    "אלפא רומאו_אי": "Alfa Romeo",
    "מ.ג": "MG",
    "מ.ג סין": "MG",
    "מ ג סין": "MG",
    "אם ג'י": "MG",
    "אם גי": "MG",
    "אסטון מרטין": "Aston Martin",
    "אסטון מרטין אנ": "Aston Martin",
    "אסטון מרטין אנגליה": "Aston Martin",
    "אקספנג": "XPENG",
    "אקספנג סין": "XPENG",
    "ב.מ.וו": "BMW",
    "ב מ וו": "BMW",
    "ב מ וו גרמניה": "BMW",
    "ב מ וו מקסיקו": "BMW",
    "ב מ וו סין": "BMW",
    "ב מ וו ארה\"ב": "BMW",
    "ב מ וו ארהב": "BMW",
    "ב מ וו ארהב\"": "BMW",
    "\"ב מ וו ארהב": "BMW",
    "ב מ וו אוסטריה": "BMW",
    "ב מ וו דרום אפריקה": "BMW",
    "ב מ וו הולנד": "BMW",
    "ב מ וו אנגליה": "BMW",
    "בי ווי די": "BYD",
    "בי ווי די סין": "BYD",
    "בי.ווי.די": "BYD",
    "בי וי די": "BYD",
    "בי וי די סין": "BYD",
    "ביואיק": "Buick",
    "ביואיק ארה\"ב": "Buick",
    "ביואיק ארהב": "Buick",
    "ביואיק ארהב\"": "Buick",
    "\"ביואיק ארהב": "Buick",
    "ביואיק קנדה": "Buick",
    "בנטלי": "Bentley",
    "בנטלי אנגליה": "Bentley",
    "בנטלי בריטניה": "Bentley",
    "ג'אקו": "JAECOO",
    "ג'אקו סין": "JAECOO",
    "גאקו": "JAECOO",
    "גאקו סין": "JAECOO",
    "ג'.איי.סי": "GAC",
    "ג'.איי.סי סין": "GAC",
    "ג'י.איי.סי": "GAC",
    "ג'י.איי.סי סין": "GAC",
    "ג'י איי סי": "GAC",
    "ג'י איי סי סין": "GAC",
    "גי אי סי": "GAC",
    "גי אי סי סין": "GAC",
    "ג'.אמ.סי": "GMC",
    "ג'.אמ.סי ארה": "GMC",
    "ג'.אמ.סי ארה\"ב": "GMC",
    "ג'.אמ.סי ארהב": "GMC",
    "ג'י.אם.סי": "GMC",
    "ג'י אם סי": "GMC",
    "ג'י אם סי ארה\"ב": "GMC",
    "ג'י אם סי ארהב": "GMC",
    "ג'י.אם.סי ארה\"ב": "GMC",
    "ג'י.אם.סי ארהב": "GMC",
    "ג'י.אמ.סי ארה": "GMC",
    "ג'י.אמ.סי": "GMC",
    "ג'יפ": "Jeep",
    "גיפ": "Jeep",
    "ג'יפ פולין": "Jeep",
    "ג'יפ איטליה": "Jeep",
    "ג'יפ ארה\"ב": "Jeep",
    "ג'יפ ארהב": "Jeep",
    "ג'יפ ארהב\"": "Jeep",
    "\"ג'יפ ארהב": "Jeep",
    "גיפ ארהב": "Jeep",
    "יונדאי קוריאה": "Hyundai",
    "יונדאי טורקיה": "Hyundai",
    "יונדאי צ'כיה": "Hyundai",
    "יונדאי צכיה": "Hyundai",
    "יונדאי הודו": "Hyundai",
    "יונדאי ארה\"ב": "Hyundai",
    "יונדאי ארהב": "Hyundai",
    "יונדאי ארהב\"": "Hyundai",
    "\"יונדאי ארהב": "Hyundai",
    "יונדאי": "Hyundai",
    "Hyundai": "Hyundai",
    "ג'נסיס": "Genesis",
    "גנסיס": "Genesis",
    "ג'נסיס קוריאה": "Genesis",
    "גיאיוואן": "Jiayuan",
    "גיאיוואן סין": "Jiayuan",
    "ג'יאיוואן": "Jiayuan",
    "ג'יאיוואן סין": "Jiayuan",
    "ג'יי איי סי": "JAC",
    "גיי איי סי": "JAC",
    "ג'יי.איי.סי": "JAC",
    "ג'אק": "JAC",
    "ג'אק סין": "JAC",
    "גאק": "JAC",
    "גאק סין": "JAC",
    "ג'ילי": "Geely",
    "ג'ילי סין": "Geely",
    "גילי": "Geely",
    "גילי סין": "Geely",
    "דאצ'יה": "Dacia",
    "דאציה": "Dacia",
    "דאצ'יה רומניה": "Dacia",
    "דאציה רומניה": "Dacia",
    "דאצ'יה מרוקו": "Dacia",
    "דאציה מרוקו": "Dacia",
    "רנו דאצ'יה": "Dacia",
    "רנו דאציה": "Dacia",
    "דודג'": "Dodge",
    "דודג": "Dodge",
    "דודג' קנדה": "Dodge",
    "דודג קנדה": "Dodge",
    "דודג' ארה\"ב": "Dodge",
    "דודג' ארהב": "Dodge",
    "דודג ארהב": "Dodge",
    "דונגפנג": "Dongfeng",
    "דונגפנג סין": "Dongfeng",
    "דונג פנג": "Dongfeng",
    "דונג פנג סין": "Dongfeng",
    "דונפינג": "Dongfeng",
    "דונפינג סין": "Dongfeng",
    "די אף אס קיי": "DFSK",
    "די.אף.אס.קיי": "DFSK",
    "די אס": "DS",
    "די אס צרפת": "DS",
    "די אס גרמניה": "DS",
    "די.אס": "DS",
    "די.אס צרפת": "DS",
    "די.אס גרמניה": "DS",
    "די-אס": "DS",
    "דיאס": "DS",
    "דייהטסו": "Daihatsu",
    "דייהטסו יפן": "Daihatsu",
    "דיהטסו": "Daihatsu",
    "דיהטסו יפן": "Daihatsu",
    "דיפאל": "Deepal",
    "דיפאל סין": "Deepal",
    "דיפל": "Deepal",
    "דיפל סין": "Deepal",
    "צ'אנגאן דיפאל": "Deepal",
    "אף אי דאבל יו": "Hongqi",
    "אף אי דאבליו": "Hongqi",
    "הונגצ'י": "Hongqi",
    "הונגצי": "Hongqi",
    "הונג צ'י": "Hongqi",
    "הונצי": "Hongqi",
    "פאו": "Hongqi",
    "FAW": "Hongqi",
    "הונדה": "Honda",
    "הונדה יפן": "Honda",
    "הונדה אנגליה": "Honda",
    "הונדה מקסיקו": "Honda",
    "הונדה הודו": "Honda",
    "הונדה טורקיה": "Honda",
    "הונדה ארה\"ב": "Honda",
    "הונדה ארהב": "Honda",
    "הונדה ארהב\"": "Honda",
    "\"הונדה ארהב": "Honda",
    "וויה": "Voyah",
    "וויה סין": "Voyah",
    "וויה מוטורס": "Voyah",
    "Voyah": "Voyah",
    "וולבו": "Volvo",
    "וולוו": "Volvo",
    "וולבו שבדיה": "Volvo",
    "וולוו שבדיה": "Volvo",
    "וולבו בלגיה": "Volvo",
    "וולוו בלגיה": "Volvo",
    "וולבו סין": "Volvo",
    "וולוו סין": "Volvo",
    "וולבו ארהב": "Volvo",
    "וולוו ארהב": "Volvo",
    "וולבו ארה\"ב": "Volvo",
    "וולוו ארה\"ב": "Volvo",
    "Volvo": "Volvo",
    "וואי": "WEY",
    "וואי סין": "WEY",
    "ווי": "WEY",
    "ווי סין": "WEY",
    "WEY": "WEY",
    "זיקר": "Zeekr",
    "זיקר סין": "Zeekr",
    "זייקר": "Zeekr",
    "זייקר סין": "Zeekr",
    "Zeekr": "Zeekr",
    "טויוטה": "Toyota",
    "טיוטה": "Toyota",
    "טויוטה יפן": "Toyota",
    "טויוטה טורקיה": "Toyota",
    "טויוטה אנגליה": "Toyota",
    "טויוטה צ'כיה": "Toyota",
    "טויוטה צכיה": "Toyota",
    "טויוטה צרפת": "Toyota",
    "טויוטה ספרד": "Toyota",
    "טויוטה תאילנד": "Toyota",
    "טויוטה דרום אפריקה": "Toyota",
    "טויוטה ארה\"ב": "Toyota",
    "טויוטה ארהב": "Toyota",
    "טויוטה ארהב\"": "Toyota",
    "\"טויוטה ארהב": "Toyota",
    "Toyota": "Toyota",
    "טסלה": "Tesla",
    "טסלה סין": "Tesla",
    "טסלה גרמניה": "Tesla",
    "טסלה ארה\"ב": "Tesla",
    "טסלה ארהב": "Tesla",
    "טסלה ארהב\"": "Tesla",
    "\"טסלה ארהב": "Tesla",
    "Tesla": "Tesla",
    "יגואר": "Jaguar",
    "יגואר אנגליה": "Jaguar",
    "יגואר בריטניה": "Jaguar",
    "Jaguar": "Jaguar",
    "יודו": "Yudo",
    "יודו סין": "Yudo",
    "יו דו": "Yudo",
    "יו דו סין": "Yudo",
    "Yudo": "Yudo",
    "YUDO": "Yudo",
    "לינק אנד קו": "Lynk & Co",
    "לינק אנד קו סין": "Lynk & Co",
    "לינק & קו": "Lynk & Co",
    "Lynk & Co": "Lynk & Co",
    "LYNK&CO": "Lynk & Co",
    "LYNKCO": "Lynk & Co",
    "ליפמוטור": "Leapmotor",
    "ליפמוטור סין": "Leapmotor",
    "ליפ מוטור": "Leapmotor",
    "ליפ מוטור סין": "Leapmotor",
    "ליפטומור": "Leapmotor",
    "Leapmotor": "Leapmotor",
    "למבורגיני": "Lamborghini",
    "למבורגיני איטליה": "Lamborghini",
    "למבורג'יני": "Lamborghini",
    "למבורג'יני איטליה": "Lamborghini",
    "Lamborghini": "Lamborghini",
    "לנד רובר": "Land Rover",
    "לנדרובר": "Land Rover",
    "לנדרובר אנגליה": "Land Rover",
    "לנד רובר אנגליה": "Land Rover",
    "רובר": "Land Rover",
    "רובר אנגליה": "Land Rover",
    "ריינג' רובר": "Land Rover",
    "ריינג רובר": "Land Rover",
    "Land Rover": "Land Rover",
    "Range Rover": "Land Rover",
    "לקסוס": "Lexus",
    "לקסוס יפן": "Lexus",
    "Lexus": "Lexus",
    "מאזדה": "Mazda",
    "מזדה": "Mazda",
    "מזדה יפן": "Mazda",
    "מאזדה יפן": "Mazda",
    "מזדה תאילנד": "Mazda",
    "מאזדה תאילנד": "Mazda",
    "מאזדה ארה\"ב": "Mazda",
    "מזדה ארה\"ב": "Mazda",
    "מאזדה ארהב": "Mazda",
    "מזדה ארהב": "Mazda",
    "Mazda": "Mazda",
    "מיני קופר": "Mini",
    "מיני": "Mini",
    "Mini": "Mini",
    "מזארטי": "Maserati",
    "מזארטי איטליה": "Maserati",
    "מזראטי": "Maserati",
    "מזראטי איטליה": "Maserati",
    "Maserati": "Maserati",
    "מרצדס": "Mercedes-Benz",
    "מרצדס בנץ": "Mercedes-Benz",
    "מרצדס בנץ גרמן": "Mercedes-Benz",
    "מרצדס בנץ הונג": "Mercedes-Benz",
    "מרצדס בנץ ארהב": "Mercedes-Benz",
    "מרצדס בנץ ארה\"ב": "Mercedes-Benz",
    "מרצדס בנץ אוסט": "Mercedes-Benz",
    "מרצדס בנץ מקסי": "Mercedes-Benz",
    "מרצדס בנץ ספרד": "Mercedes-Benz",
    "מרצדס בנץ צרפת": "Mercedes-Benz",
    "מרצדס בנץ טורק": "Mercedes-Benz",
    "דיימלר קרייזלר": "Mercedes-Benz",
    "דימלר קריזלר": "Mercedes-Benz",
    "Mercedes-Benz": "Mercedes-Benz",
    "Mercedes": "Mercedes-Benz",
    "מקלארן": "McLaren",
    "מקלארן אנגליה": "McLaren",
    "מקלרן": "McLaren",
    "McLaren": "McLaren",
    "מיצובישי": "Mitsubishi",
    "מיצובושי": "Mitsubishi",
    "מיצובישי יפן": "Mitsubishi",
    "מיצובישי תאילנ": "Mitsubishi",
    "מיצובישי תאילנד": "Mitsubishi",
    "מיצובישי ארה\"ב": "Mitsubishi",
    "מיצובישי ארהב": "Mitsubishi",
    "מיצובישי הולנד": "Mitsubishi",
    "Mitsubishi": "Mitsubishi",
    "מקסוס": "Maxus",
    "מקסוס סין": "Maxus",
    "Maxus": "Maxus",
    "MAXUS": "Maxus",
    "ניאו": "NIO",
    "ניאו סין": "NIO",
    "ניאו רכב סין": "NIO",
    "NIO": "NIO",
    "Nio": "NIO",
    "סאאב": "Saab",
    "סאאב שבדיה": "Saab",
    "Saab": "Saab",
    "סיאט": "Seat",
    "סיאט ספרד": "Seat",
    "סיאט צ'כיה": "Seat",
    "סיאט צכיה": "Seat",
    "סיאט גרמניה": "Seat",
    "סיאט סלובקיה": "Seat",
    "סיאט פורטוגל": "Seat",
    "Seat": "Seat",
    "סובארו": "Subaru",
    "סובארו יפן": "Subaru",
    "סובארו ארה\"ב": "Subaru",
    "סובארו ארהב": "Subaru",
    "סובארו ארהב\"": "Subaru",
    "\"סובארו ארהב": "Subaru",
    "Subaru": "Subaru",
    "סוזוקי": "Suzuki",
    "סוזוקי יפן": "Suzuki",
    "סוזוקי הונגריה": "Suzuki",
    "מרוטי סוזוקי": "Suzuki",
    "מרוטי": "Suzuki",
    "Suzuki": "Suzuki",
    "סמארט": "Smart",
    "סמארט סין": "Smart",
    "סמארט צרפת": "Smart",
    "סמארט גרמניה": "Smart",
    "Smart": "Smart",
    "סיטרואן": "Citroen",
    "סיטרואן צרפת": "Citroen",
    "סיטרואן ספרד": "Citroen",
    "סיטרואן צ'כיה": "Citroen",
    "סיטרואן צכיה": "Citroen",
    "סיטרואן סלובק": "Citroen",
    "סיטרואן סלובקיה": "Citroen",
    "סיטרואן פורטוג": "Citroen",
    "סיטרואן פורטוגל": "Citroen",
    "Citroen": "Citroen",
    "Citroën": "Citroen",
    "סקודה": "Skoda",
    "סקודה צ'כיה": "Skoda",
    "סקודה צכיה": "Skoda",
    "סקודה סלובקיה": "Skoda",
    "Skoda": "Skoda",
    "סקייוול": "Skywell",
    "סקייוול סין": "Skywell",
    "סקיוול": "Skywell",
    "סקיוול סין": "Skywell",
    "Skywell": "Skywell",
    "פולסטאר": "Polestar",
    "פולסטאר סין": "Polestar",
    "פולסטר": "Polestar",
    "פולסטר סין": "Polestar",
    "Polestar": "Polestar",
    "סרס": "Seres",
    "סרס סין": "Seres",
    "Seres": "Seres",
    "SERES": "Seres",
    "פוטון": "Foton",
    "פוטון סין": "Foton",
    "Foton": "Foton",
    "FOTON": "Foton",
    "פולקסווגן": "Volkswagen",
    "פולצבאגן": "Volkswagen",
    "פולקסוגן": "Volkswagen",
    "פולקסווגן גרמן": "Volkswagen",
    "פולקסווגן גרמניה": "Volkswagen",
    "פולקסווגן-ספרד": "Volkswagen",
    "פולקסווגן ספרד": "Volkswagen",
    "פולקסווגן פורט": "Volkswagen",
    "פולקסווגן פורטוגל": "Volkswagen",
    "פולקסווגן פולי": "Volkswagen",
    "פולקסווגן פולין": "Volkswagen",
    "פולקסווגן מקסי": "Volkswagen",
    "פולקסווגן מקסיקו": "Volkswagen",
    "פולקסווגן סלוב": "Volkswagen",
    "פולקסווגן סלובקיה": "Volkswagen",
    "פולקסווגן ארהב": "Volkswagen",
    "פולקסווגן ארה\"ב": "Volkswagen",
    "Volkswagen": "Volkswagen",
    "VW": "Volkswagen",
    "פורד": "Ford",
    "פורד גרמניה": "Ford",
    "פורד ספרד": "Ford",
    "פורד בלגיה": "Ford",
    "פורד תורכיה": "Ford",
    "פורד טורקיה": "Ford",
    "פורד קנדה": "Ford",
    "פורד מקסיקו": "Ford",
    "פורד רומניה": "Ford",
    "פורד ד אפריקה": "Ford",
    "פורד דרום אפריקה": "Ford",
    "פורד ארה\"ב": "Ford",
    "פורד ארהב": "Ford",
    "פורד ארהב\"": "Ford",
    "\"פורד ארהב": "Ford",
    "Ford": "Ford",
    "פורשה": "Porsche",
    "פורשה גרמניה": "Porsche",
    "פורשה סלובקיה": "Porsche",
    "Porsche": "Porsche",
    "פורתינג": "Forthing",
    "פורתינג סין": "Forthing",
    "Forthing": "Forthing",
    "פיאט": "Fiat",
    "פיאט איטליה": "Fiat",
    "פיאט פולין": "Fiat",
    "פיאט סרביה": "Fiat",
    "פיאט טורקיה": "Fiat",
    "פיאט תורכיה": "Fiat",
    "פיאט פורטוגל": "Fiat",
    "פיאט/מדייר סוז": "Fiat",
    "פיאט תאילנד": "Fiat",
    "פיאט קרייזלר": "Fiat",
    "Fiat": "Fiat",
    "פיג'ו": "Peugeot",
    "פיגו": "Peugeot",
    "פיג'ו צרפת": "Peugeot",
    "פיג'ו ספרד": "Peugeot",
    "פיג'ו סלובקיה": "Peugeot",
    "פיג'ו צ'כיה": "Peugeot",
    "פיג'ו צכיה": "Peugeot",
    "פיג'ו אוסטריה": "Peugeot",
    "פיג'ו פורטוגל": "Peugeot",
    "פיג'ו איטליה": "Peugeot",
    "פיג'ו טורקיה": "Peugeot",
    "Peugeot": "Peugeot",
    "פרארי": "Ferrari",
    "פרארי איטליה": "Ferrari",
    "Ferrari": "Ferrari",
    "FERRARI": "Ferrari",
    "צ'רי": "Chery",
    "צרי": "Chery",
    "צ'רי סין": "Chery",
    "צרי סין": "Chery",
    "Chery": "Chery",
    "CHERY": "Chery",
    "קאדילאק": "Cadillac",
    "קאדילק": "Cadillac",
    "קדילאק": "Cadillac",
    "קדילק": "Cadillac",
    "קאדילאק ארה\"ב": "Cadillac",
    "קאדילאק ארהב": "Cadillac",
    "קאדילאק ארהב\"": "Cadillac",
    "\"קאדילאק ארהב": "Cadillac",
    "קאדילאק מקסיקו": "Cadillac",
    "Cadillac": "Cadillac",
    "CADILLAC": "Cadillac",
    "קיה": "Kia",
    "קיה ד. קוריאה": "Kia",
    "קיה ד.קוריאה": "Kia",
    "קיה קוריאה": "Kia",
    "קיה סלובקיה": "Kia",
    "קיה ארה\"ב": "Kia",
    "קיה ארהב": "Kia",
    "קיה ארהב\"": "Kia",
    "\"קיה ארהב": "Kia",
    "Kia": "Kia",
    "KIA": "Kia",
    "קיי גי מוביליט": "KGM",
    "קיי גי מוביליטי": "KGM",
    "קיי ג'י מוביליטי": "KGM",
    "קיי ג'י אם": "KGM",
    "קיי גי אם": "KGM",
    "KGM": "KGM",
    "סאנגיונג": "KGM",
    "סאנג יונג": "KGM",
    "סאנגיונג ד.קור": "KGM",
    "סאנג יונג ד.קור": "KGM",
    "סאנגיונג קוריאה": "KGM",
    "SsangYong": "KGM",
    "קרייזלר": "Chrysler",
    "קריזלר": "Chrysler",
    "קרייזלר ארה\"ב": "Chrysler",
    "קרייזלר ארהב": "Chrysler",
    "קרייזלר ארהב\"": "Chrysler",
    "\"קרייזלר ארהב": "Chrysler",
    "קריזלר ארה\"ב": "Chrysler",
    "קריזלר ארהב": "Chrysler",
    "קריזלר ארהב\"": "Chrysler",
    "\"קריזלר ארהב": "Chrysler",
    "קרייזלר אוסטריה": "Chrysler",
    "קריזלר אוסטריה": "Chrysler",
    "קרייזלר מקסיקו": "Chrysler",
    "קריזלר מקסיקו": "Chrysler",
    "קרייזלר קנדה": "Chrysler",
    "קריזלר קנדה": "Chrysler",
    "Chrysler": "Chrysler",
    "CHRYSLER": "Chrysler",
    "רולס רויס": "Rolls-Royce",
    "רולס-רויס": "Rolls-Royce",
    "רולס רויס אנגליה": "Rolls-Royce",
    "רולס-רויס אנגליה": "Rolls-Royce",
    "רולס רויס בריטניה": "Rolls-Royce",
    "רולס רויס אנגל": "Rolls-Royce",
    "Rolls-Royce": "Rolls-Royce",
    "Rolls Royce": "Rolls-Royce",
    "ROLLS-ROYCE": "Rolls-Royce",
    "שברולט": "Chevrolet",
    "שברולט ד.קוריאה": "Chevrolet",
    "שברולט ד. קוריאה": "Chevrolet",
    "שברולט קוריאה": "Chevrolet",
    "שברולט ארה\"ב": "Chevrolet",
    "שברולט ארהב": "Chevrolet",
    "שברולט ארהב\"": "Chevrolet",
    "\"שברולט ארהב": "Chevrolet",
    "שברולט קנדה": "Chevrolet",
    "שברולט מקסיקו": "Chevrolet",
    "Chevrolet": "Chevrolet",
    "CHEVROLET": "Chevrolet",
    "רנו": "Renault",
    "רנו צרפת": "Renault",
    "רנו ספרד": "Renault",
    "רנו טורקיה": "Renault",
    "רנו תורכיה": "Renault",
    "רנו סלובניה": "Renault",
    "רנו ד.קוריאה": "Renault",
    "רנו ד. קוריאה": "Renault",
    "רנו קוריאה": "Renault",
    "רנו רומניה": "Renault",
    "רנו מרוקו": "Renault",
    "Renault": "Renault",
    "RENAULT": "Renault"
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
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ---------- עזרים ----------

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

async function checkDisabled(plate) {
    try {
        const byFilter = await searchDatastore(DISABLED_ID, { mispar_rechev: Number(plate) }, 5);
        if (byFilter.length > 0) return true;

        const byText = await searchDatastore(DISABLED_ID, null, 50, plate);
        const found = byText.some(r =>
            Object.values(r).some(v => String(v).replace(/\D/g, "") === plate)
        );
        return found;
    } catch (e) {
        return null;
    }
}

// ---------- מאגרים ----------

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

// ---------- API ----------

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");
    const timestamp = new Date().toISOString();

    try {
        const car = await fetchCarRecord(plate);

        if (!car) {
            console.warn(`[SEARCH LOG] ❌ 🚗 חיפוש רכב (לא נמצא במאגר): מספר ${plate} | שעה: ${timestamp}`);
            return res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }

        const [row, historyRaw, ownershipList, disabled] = await Promise.all([
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

        console.log(`--------------------------------------------------`);
        console.log(`[SEARCH LOG] 🔍 מישהו חיפש רכב!`);
        console.log(`📅 זמן: ${timestamp}`);
        console.log(`🚗 מספר רכב: ${plate}`);
        console.log(`🏭 יצרן ודגם: ${manufacturer} ${model} ${trim || ""} (${year})`);
        console.log(`⚡ כוח סוס: ${hp != null ? hp : "לא ידוע"} | נפח: ${engineCc != null ? engineCc : "לא ידוע"}`);
        console.log(`🏷️ סוג בעלות: ${currentOwnership || "לא ידוע"}`);
        console.log(`🏁 תאוצה 0-100: ${acceleration ? acceleration.seconds + " שניות" : "לא נמצאה בטבלה"}`);
        console.log(`♿ תג נכה: ${disabled === null ? "לא ידוע" : (disabled ? "יש" : "אין")}`);
        console.log(`🔁 מעברי בעלות: ${ownershipList.length}`);
        console.log(`--------------------------------------------------`);

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
                disabled,
                kmSinceTest: history?.kmSinceTest ?? null
            }
        });
    } catch (error) {
        console.error(`[SEARCH LOG] 💥 שגיאה בחיפוש מספר ${plate}:`, error);
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

app.get('/api/debug/:plate', async (req, res) => {
    try {
        const car = await fetchCarRecord(req.params.plate);
        if (!car) return res.json({ success: false, message: "לא נמצא" });
        const row = await findModelRow(car);
        const hist = await fetchHistoryRecord(req.params.plate);
        const own = await fetchOwnershipRows(req.params.plate);
        const disabledSample = await searchDatastore(DISABLED_ID, null, 1);
        const disabledMatch = await checkDisabled(req.params.plate);
        res.json({
            success: true,
            car_fields: Object.keys(car),
            car,
            model_row: row,
            history: hist,
            ownership: own,
            disabled_sample_fields: disabledSample[0] ? Object.keys(disabledSample[0]) : [],
            disabled_sample: disabledSample[0] || null,
            disabled_match: disabledMatch,
            accel_table_rows: accelTable.length
        });
    } catch (error) {
        console.error("שגיאה:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
