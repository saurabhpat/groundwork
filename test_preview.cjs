const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/VITE_GEMINI_API_KEY=(.*)/)[1].trim();

const modelsToTest = [
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

async function checkModel(model) {
  return new Promise(resolve => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: {'Content-Type': 'application/json'}
    };
    const req = https.request(options, res => {
      resolve(`${model}: ${res.statusCode}`);
    });
    req.write(JSON.stringify({contents: [{parts: [{text: 'hi'}]}]}));
    req.end();
  });
}

async function run() {
  for (const m of modelsToTest) {
    console.log(await checkModel(m));
  }
}
run();
