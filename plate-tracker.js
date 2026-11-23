const REPO = 'klodsabag2002-sketch/car-api';
const FILE = 'plates.json';
const seen = new Set();

async function trackPlate(plate) {
  const token = process.env.GITHUB_TOKEN;
  const p = String(plate || '');
  if (!token || !/^\d{5,9}$/.test(p) || seen.has(p)) return;
  seen.add(p);

  const api = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'car-api',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const getRes = await fetch(api, { headers });
      if (!getRes.ok) return;
      const file = await getRes.json();
      const list = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
      if (list.includes(p)) return;
      list.push(p);
      const putRes = await fetch(api, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `add plate ${p}`,
          content: Buffer.from(JSON.stringify(list, null, 2) + '\n').toString('base64'),
          sha: file.sha
        })
      });
      if (putRes.ok) return;
      if (putRes.status !== 409 && putRes.status !== 422) return;
    }
  } catch (e) {
    console.error('[TRACK ERROR]', e.message);
  }
}


const COLOR_FILE = 'plate-colors.json';

async function trackColor(plate, color) {
  const token = process.env.GITHUB_TOKEN;
  const p = String(plate || '');
  if (!token || !/^\d{5,9}$/.test(p) || !['green', 'red'].includes(color)) return;

  const api = `https://api.github.com/repos/${REPO}/contents/${COLOR_FILE}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'car-api',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const getRes = await fetch(api, { headers });
      let map = {};
      let sha;
      if (getRes.ok) {
        const file = await getRes.json();
        sha = file.sha;
        map = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
      } else if (getRes.status !== 404) {
        return;
      }
      if (map[p] === color) return;
      map[p] = color;
      const body = {
        message: `color ${p} ${color}`,
        content: Buffer.from(JSON.stringify(map, null, 2) + '\n').toString('base64')
      };
      if (sha) body.sha = sha;
      const putRes = await fetch(api, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (putRes.ok) return;
      if (putRes.status !== 409 && putRes.status !== 422) return;
    }
  } catch (e) {
    console.error('[COLOR TRACK ERROR]', e.message);
  }
}

module.exports = { trackPlate, trackColor };
