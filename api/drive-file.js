export default async function handler(req, res) {
  const { fileId } = req.query;
  if (!fileId) return res.status(400).json({ error: 'Missing fileId' });

  const GDRIVE_KEY = process.env.GDRIVE_KEY || 'AIzaSyBxyqkUdhTSuxzBL1SNOo7NAGEwmvUh0A0';

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GDRIVE_KEY}`;
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(r.status).json({ error: 'Drive error: ' + r.status });
    }

    const contentType = r.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const buffer = await r.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
