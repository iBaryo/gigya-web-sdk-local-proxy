import gigyaProxyMiddleware from "./middleware";
const app = require('express')();
const https = require('https');
const fs = require('fs');

const consoleIlApiKey = '3_HkXvtGOzd1QMcVfHye7gcamXbLAoC77C4TCB7gk8mych-xEm5HTL0bCKBTNp56hk';

app.use(gigyaProxyMiddleware('localhost', consoleIlApiKey));

console.log('listening...');
app.listen(8080);
https.createServer({
    cert: fs.readFileSync('./cert.pem'),
    key: fs.readFileSync('./key.pem'),
    passphrase: 'Gigya123'
}, app).listen(8081);