#!/usr/bin/env node

import gigyaProxyMiddleware from "./src/middleware";
const app = require('express')();
const https = require('https');
const fs = require('fs');
const path = require('path');

const consoleIlApiKey = '3_HkXvtGOzd1QMcVfHye7gcamXbLAoC77C4TCB7gk8mych-xEm5HTL0bCKBTNp56hk';
const httpPort = 8080;
const httpsPort = 8081;

const args = getArgs() as {
    x: boolean,  // extended mode
    e: string,   // environment for injected
    o: string   // sources origin
};

console.log(`don't forget to set the following fiddler auto-responders:
~~~
regex:http://cdn(.*)\\.gigya\\.com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
http://localhost:${httpPort}/$2$3
~~~
regex:https://cdn(.*)\\.gigya\\.com/com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
https://localhost:${httpsPort}/$2$3
~~~
`);

if (args.x) {
    console.log(`experimental source maps support -- ON! (requires local websdk ^7.4.20)`);
}

const env = args.e || 'us1';

let origin : string;
if (!args.o) {
    origin = 'localhost';
}
else if (args.o.startsWith('http')) {
    origin = args.o;
}
else {
    origin = `http://cdn.${args.o}.gigya.com`;
}

console.log(`getting injected data from ${env} and sources from ${origin}`);
app.use(gigyaProxyMiddleware(args.x, origin, consoleIlApiKey, `http://cdn.${env}.gigya.com`));


console.log('listening...');
app.listen(httpPort);
https.createServer({
    cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem')),
    key: fs.readFileSync(path.join(__dirname,'cert/key.pem')),
    passphrase: 'Gigya123'
}, app).listen(httpsPort);



function getArgs() {
    const endToken = '__end';
    const args = process.argv.slice(2).concat([endToken]).reduce((res, curr) => {
        if (curr.startsWith('-') || curr == endToken) {
            if (res.__p) {
                res[res.__p] = true;
            }

            res.__p = curr.substr(1);
        }
        else if (res.__p) {
            res[res.__p] = curr;
            delete res.__p;
        }
        else {
            res[res.__c++] = curr;
        }
        return res;

    }, {
        __p: null,
        __c: 0
    });

    delete args.__p;
    delete args.__c;

    return args as Object;
}