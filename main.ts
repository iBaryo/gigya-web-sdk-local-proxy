#!/usr/bin/env node

import gigyaProxyMiddleware from "./src/middleware";
const app = require('express')();
const https = require('https');
const fs = require('fs');
const path = require('path');

const consoleIlApiKey = '3_HkXvtGOzd1QMcVfHye7gcamXbLAoC77C4TCB7gk8mych-xEm5HTL0bCKBTNp56hk';
const httpPort = 8080;
const httpsPort = 8081;

const args = process.argv.slice(2).reduce((res : {__p? : string}, curr : string) => {
    if (curr.indexOf('-') == 0) {
        res[curr] = null;
        res.__p = curr;
    }
    else if (res.__p) {
        res[res.__p] = curr;
    }

    return res;
}, {});

console.log(`don't forget to set the following fiddler auto-responders:
~~~
regex:http://cdn(.*)\\.gigya\\.com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
http://localhost:${httpPort}/$2$3
~~~
regex:https://cdn(.*)\\.gigya\\.com/com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
https://localhost:${httpsPort}/$2$3
~~~
`);

const extMode = args.hasOwnProperty('-x');

if (extMode) {
    console.log(`experimental source maps support -- ON! (requires local websdk ^7.4.20)`);
}

app.use(gigyaProxyMiddleware(extMode, 'localhost', consoleIlApiKey));


console.log('listening...');
app.listen(httpPort);
https.createServer({
    cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem')),
    key: fs.readFileSync(path.join(__dirname,'cert/key.pem')),
    passphrase: 'Gigya123'
}, app).listen(httpsPort);