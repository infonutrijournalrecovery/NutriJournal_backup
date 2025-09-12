const https = require('https');
https.get('https://api.nal.usda.gov/', (res) => {
  console.log('statusCode:', res.statusCode);
  res.on('data', d => process.stdout.write(d));
}).on('error', (e) => {
  console.error('Errore:', e);
});