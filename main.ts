#!/usr/bin/env node

import gigyaProxyMiddleware from "./src/middleware";
const app = require('express')();
const https = require('https');
const fs = require('fs');
const path = require('path');

const consoleIlApiKey = '3_HkXvtGOzd1QMcVfHye7gcamXbLAoC77C4TCB7gk8mych-xEm5HTL0bCKBTNp56hk';
const httpPort = 8080;
const httpsPort = 8081;

app.use(gigyaProxyMiddleware('localhost', consoleIlApiKey));

console.log(`don't forget to set the following fiddler auto-responders:
~~~
regex:http://cdn(.*)\\.gigya\\.com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
http://localhost:${httpPort}/$2$3
~~~
regex:https://cdn(.*)\\.gigya\\.com/com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
https://localhost:${httpsPort}/$2$3
~~~
`);

console.log('listening...');
app.listen(httpPort);
https.createServer({
    cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem')),
    key: fs.readFileSync(path.join(__dirname,'cert/key.pem')),
    passphrase: 'Gigya123'
}, app).listen(httpsPort);