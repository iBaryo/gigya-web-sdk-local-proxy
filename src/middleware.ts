import {Request, Response, NextFunction} from "express-serve-static-core";
import {GigyaProxy} from "./gigya-proxy";
import {paths} from "./common";

export default function gigyaProxyMiddleware(dynScripts : boolean, proxyHost: string, proxyApiKey : string, targetHost : string) {
    const proxy = new GigyaProxy(dynScripts, proxyHost, proxyApiKey, targetHost);

    return async(req: Request, res: Response, next: NextFunction) => {
        let file: string;

        console.log(`request for ${req.originalUrl}`);
        const reqPath = req.path.toLowerCase();
        const apiKey = getByCaseInsensitive(req.query, 'apiKey');
        res.header('X-Server', 'prox');

        try {
            if (req.path == '/favicon.ico') {
                return res.status(404);
            }
            else if (paths.core.includes(reqPath)) {
                console.log('serving gigya.js ...');
                file = await proxy.getCore(apiKey);
                res.contentType('text/javascript');
            }
            else if (paths.api.includes(reqPath)) {
                console.log('serving api.aspx ...');
                file = await proxy.getApi(apiKey);
                res.contentType('text/html');
            }
            else if (paths.sso.includes(reqPath)) {
                console.log('serving sso.htm ...');
                file = await proxy.getSso(apiKey);
                res.contentType('text/html');
            }
            else if (reqPath.includes('.plugins.')) {
                file = await proxy.getPlugin(req);
                res.contentType('text/javascript');
            }
            else if (reqPath.startsWith('/js/')) {
                file = await proxy.getDefault(req);
                res.contentType('text/javascript');
            }
            else {
                file = 'not supported';
            }

            res.send(file);
        }
        catch (e) {
            const errResponse = e.response;
            if (!errResponse) {
                res.send('proxy error! see details in log.');
                console.log(`error!`);
                console.log(JSON.stringify(e, undefined, 4));
            }
            else {
                console.log(e);
                res.status(errResponse.statusCode);
                Object.keys(errResponse.headers).forEach(header => res.setHeader(header, errResponse.headers[header]));
                res.send(errResponse.body);
            }
        }
    };
}

function getByCaseInsensitive(obj : Object, prop : string) : string|undefined {
    const activeProp = Object.keys(obj).find(key => key.toLowerCase() == prop.toLowerCase());
    return activeProp && obj[activeProp];
}