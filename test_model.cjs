const https = require('https');

const API_KEY = process.env.VITE_GEMINI_API_KEY;

function queryModel(model) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: "hi" }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ model, status: res.statusCode, body }));
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  const models = ['gemini-3.0-flash', 'gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const m of models) {
    const res = await queryModel(m);
    console.log(`${res.model}: ${res.status}`);
  }
}
run();
