import { readFileSync, writeFileSync } from 'node:fs';

const API = 'https://data.gov.il/api/3/action/datastore_search';
const HISTORY_ID = '56063a99-8a3e-4ff4-912e-5966c0279bad';
const CANCELLED_ID = '851ecab1-0622-4dbe-a6c7-f950cf82abf9';

async function query(resourceId, plate) {
  const filters = encodeURIComponent(JSON.stringify({ mispar_rechev: Number(plate) }));
  const res = await fetch(`${API}?resource_id=${resourceId}&filters=${filters}&limit=5`);
  const j = await res.json();
  return (j.result && j.result.records) || [];
}

const plates = JSON.parse(readFileSync('plates.json', 'utf8'));
const history = JSON.parse(readFileSync('history.json', 'utf8'));
const today = new Date().toISOString().slice(0, 10);

for (const plate of plates) {
  const entries = history[plate] || [];
  const last = entries[entries.length - 1];
  let km = last ? last.km : 0;
  let status;

  const rec = (await query(HISTORY_ID, plate))[0];
  if (rec) {
    status = 'פעיל';
    km = Number(rec.kilometer_test_aharon) || km;
  } else if ((await query(CANCELLED_ID, plate)).length) {
    status = 'בוטל';
  } else {
    status = 'לא נמצא במאגר';
  }

  if (!last || last.km !== km || last.status !== status) {
    const drop = last && km < last.km ? 'ירידת ק"מ' : '';
    entries.push({ date: today, km, status, drop });
    history[plate] = entries;
  }
  await new Promise(r => setTimeout(r, 500));
}

writeFileSync('history.json', JSON.stringify(history, null, 2) + '\n');