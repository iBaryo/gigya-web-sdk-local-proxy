import {Request, Response, NextFunction} from "express-serve-static-core";
import {GigyaProxy} from "./gigya-proxy";
import {paths} from "./common";

const rp = require('request-promise');

export default function gigyaProxyMiddleware(proxyHost: string) {
    const proxy = new GigyaProxy(proxyHost);

    return async(req: Request, res: Response, next: NextFunction) => {
        let file: string;

        console.log(`request for ${req.originalUrl}`);
        try {
            if (req.path == '/favicon.ico') {
                return res.status(404);
            }
            else if (paths.core.includes(req.path.toLowerCase())) {
                console.log('serving gigya.js ...');
                file = await proxy.getCore(req.query['apiKey']);
            }
            else if (paths.api.includes(req.path.toLowerCase())) {
                console.log('serving api.aspx ...');
                file = await proxy.getApi(req.query['apiKey']);
            }
            else {
                file = await rp(`${proxyHost}${req.originalUrl}`);
            }

            res.contentType('text/javascript');
            res.send(file);
        }
        catch (e) {
            const errResponse = e.response;
            if (!errResponse) {
                res.send('proxy error! see details in log.');
                console.log(JSON.stringify(e, undefined, 4));
            }
            else {
                res.status(errResponse.statusCode);
                Object.keys(errResponse.headers).forEach(header => res.setHeader(header, errResponse.headers[header]));
                res.send(errResponse.body);
            }
        }
    };
}