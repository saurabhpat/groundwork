const https = require('https');

const API_KEY = process.env.VITE_GEMINI_API_KEY;

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${API_KEY}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const flash3 = data.models.filter(m => m.name.includes('flash') && m.name.includes('3'));
      console.log("Found Flash 3 models:", JSON.stringify(flash3, null, 2));
      const allFlash = data.models.filter(m => m.name.includes('flash'));
      console.log("All Flash models:", JSON.stringify(allFlash.map(m => m.name), null, 2));
    } catch (e) {
      console.log("Parse error", e);
    }
  });
});
req.end();
