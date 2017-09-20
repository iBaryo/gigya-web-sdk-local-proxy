import {Request, Response, NextFunction} from "express-serve-static-core";
import {GigyaProxy} from "./gigya-proxy";
import {paths} from "./common";

export default function gigyaProxyMiddleware(proxyHost: string, proxyApiKey : string) {
    const proxy = new GigyaProxy(proxyHost, proxyApiKey);

    return async(req: Request, res: Response, next: NextFunction) => {
        let file: string;

        console.log(`request for ${req.originalUrl}`);
        try {
            if (req.path == '/favicon.ico') {
                return res.status(404);
            }
            else if (paths.core.includes(req.path.toLowerCase())) {
                console.log('serving gigya.js ...');
                file = await proxy.getCore(getByCaseInsensitive(req.query, 'apiKey'));
                res.contentType('text/javascript');
            }
            else if (paths.api.includes(req.path.toLowerCase())) {
                console.log('serving api.aspx ...');
                file = await proxy.getApi(getByCaseInsensitive(req.query, 'apiKey'));
                res.contentType('text/html');
            }
            else if (req.path.toLowerCase().startsWith('/js/')) {
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