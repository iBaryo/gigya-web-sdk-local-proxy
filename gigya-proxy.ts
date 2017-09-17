import {paths} from "./common";
import {Request} from "express-serve-static-core";
const rp = require('request-promise');

const endServerInjectedCode = '// ### end server injected code ###';
const dbgQueryParam = 'dbg=1';

export class GigyaProxy {
    private _siteInjectedHeaders: {
        [apiKey: string]: string
    } = {};

    constructor(public proxyHost: string, public proxyApiKey? : string, public prodHost = 'http://cdn.gigya.com') {
    }

    public async getCore(apiKey: string) {
        const header = await this.getHeader(apiKey);
        const url = `http://${this.proxyHost}${paths.core[0]}?${dbgQueryParam}&apiKey=${this.proxyApiKey || apiKey}`;
        console.log(url);
        const proxyScript = await rp(url) as string;
        const body = proxyScript.substr(this.getHeaderEndIndex(proxyScript));

        return `// proxy magic
${header}
${body}`;
    }

    public async getApi(apiKey: string) {
        const header = await this.getHeader(apiKey);
        return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>proxy magic</title>
        <script>
            ${header}
             gigya.gmidTicketExpiration = 3600;
            }
        </script>
    </head>
    <body>
        <script src="//${this.proxyHost}/js/gigya.services.api.js?${dbgQueryParam}"></script>
    </body>
</html>`;
    }

    private async getHeader(apiKey: string) {
        if (!apiKey) {
            throw 'missing api key';
        }
        else if (!this._siteInjectedHeaders[apiKey]) {
            const core = await rp(`${this.prodHost}/${paths.core[0]}?apiKey=${apiKey}`) as string;
            const headerEndIndex = this.getHeaderEndIndex(core);
            this._siteInjectedHeaders[apiKey] = core.substr(0, headerEndIndex);
        }

        return this._siteInjectedHeaders[apiKey];
    }

    private getHeaderEndIndex(file) {
        const headerEnd = file.indexOf(endServerInjectedCode);

        if (headerEnd == -1) {
            throw `can't find server injected code`;
        }
        else {
            return headerEnd + endServerInjectedCode.length
        }
    }

    public getDefault(req : Request) : Promise<string> {
        const connector = Object.keys(req.query).length ? '&' : '?';
        return rp(`http://${this.proxyHost}${req.originalUrl}${connector}${dbgQueryParam}`);
    }
}