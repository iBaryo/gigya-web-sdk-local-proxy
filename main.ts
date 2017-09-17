import gigyaProxyMiddleware from "./src/middleware";
const app = require('express')();
const https = require('https');
const fs = require('fs');

const consoleIlApiKey = '3_HkXvtGOzd1QMcVfHye7gcamXbLAoC77C4TCB7gk8mych-xEm5HTL0bCKBTNp56hk';
const httpPort = 8080;
const httpsPort = 8081;

app.use(gigyaProxyMiddleware('localhost', consoleIlApiKey));

console.log('listening...');
app.listen(httpPort);
https.createServer({
    cert: fs.readFileSync('./cert/cert.pem'),
    key: fs.readFileSync('./cert/key.pem'),
    passphrase: 'Gigya123'
}, app).listen(httpsPort);