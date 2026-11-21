import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const REGISTRY_ID = '053cea08-09bc-40ec-8f7a-156f0677aff3';
const HISTORY_ID = '56063a99-8a3e-4ff4-912e-5966c0279bad';
const CANCELLED_ID = '851ecab1-0622-4dbe-a6c7-f950cf82abf9';
const DELAY_MS = 500;

const readJson = (file, fallback) =>
  existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback;

async function query(resourceId, plate) {
  const filters = encodeURIComponent(JSON.stringify({ mispar_rechev: Number(plate) }));
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}&filters=${filters}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('התשובה אינה JSON (כנראה חסימה או דף שגיאה)');
  }
  return json.result?.records ?? [];
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const plates = readJson('plates.json', []);
  const history = readJson('history.json', {});
  const tests = readJson('tests.json', {});
  let testsChanged = false;
  let failed = 0;

  for (const plate of plates) {
    const expiry = tests[plate];
    // הטסט עדיין בתוקף - לא בודקים את הרכב
    if (expiry && expiry > today) continue;

    try {
      const reg = (await query(REGISTRY_ID, plate))[0];
      if (reg?.tokef_dt && tests[plate] !== reg.tokef_dt) {
        tests[plate] = reg.tokef_dt;
        testsChanged = true;
      }

      let km = null;
      let status;
      const hist = (await query(HISTORY_ID, plate))[0];
      if (hist) {
        status = 'פעיל';
        km = hist.kilometer_test_aharon ?? null;
      } else if ((await query(CANCELLED_ID, plate)).length) {
        status = 'בוטל';
      } else {
        status = 'לא נמצא במאגר';
      }

      const list = history[plate] ?? [];
      const last = list[list.length - 1];
      if (!last || last.km !== km || last.status !== status) {
        const drop = last && km != null && last.km != null && km < last.km ? 'ירידת ק"מ' : '';
        list.push({ date: today, km, status, drop });
        history[plate] = list;
      }
    } catch (err) {
      failed++;
      console.log(`${plate}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  writeFileSync('history.json', JSON.stringify(history, null, 2) + '\n');
  if (testsChanged) {
    writeFileSync('tests.json', JSON.stringify(tests, null, 2) + '\n');
  }
  console.log(`נבדקו ${plates.length} רכבים, נכשלו: ${failed}`);
}

main().catch((err) => {
  console.log(`שגיאה כללית: ${err.message}`);
});