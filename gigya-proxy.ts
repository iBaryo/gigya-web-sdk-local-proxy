import {paths} from "./common";
const rp = require('request-promise');
const endServerInjectedCode = '// ### end server injected code ###';

export class GigyaProxy {
    private _siteInjectedHeaders: {
        [apiKey: string]: string
    } = {};

    constructor(public proxyHost: string, public prodHost = 'http://cdn.gigya.com') {
    }

    public async getCore(apiKey: string) {
        const header = await this.getHeader(apiKey);
        const localScript = await rp(`${this.proxyHost}${paths.core[0]}?apiKey=${apiKey}&dbg=1`) as string;
        const body = localScript.substr(this.getHeaderEndIndex(header));

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
        <script src="${this.proxyHost}/js/gigya.services.api.js?apiKey=${apiKey}&dbg=1"></script>
    </body>
</html>`;
    }

    private async getHeader(apiKey: string) {
        if (!this._siteInjectedHeaders[apiKey]) {
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
}