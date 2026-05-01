export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-language, x-fingerprint, x-idempotency-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'No path' });

  const targetUrl = `https://api-proxy.choco.kz/${Array.isArray(path) ? path.join('/') : path}${req.url.includes('?') ? '?' + req.url.split('?')[1].replace(/path=[^&]+&?/, '') : ''}`;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': req.headers['content-type'] || 'application/json',
  };

  ['authorization', 'x-language', 'x-fingerprint', 'x-idempotency-key'].forEach(h => {
    if (req.headers[h]) headers[h] = req.headers[h];
  });

  try {
    let body = undefined;
    if (req.method !== 'GET') {
      if (req.headers['content-type']?.includes('multipart')) {
        // Forward raw body for multipart
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = Buffer.concat(chunks);
        headers['content-type'] = req.headers['content-type'];
      } else {
        body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });

    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
