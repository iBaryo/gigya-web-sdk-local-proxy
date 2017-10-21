import {paths} from "./common";
import {Request} from "express-serve-static-core";
const rp = require('request-promise');

const endServerInjectedCode = '// ### end server injected code ###';
const dbgQueryParam = 'dbg=1';

export class GigyaProxy {
    private _siteInjectedHeaders: {
        [apiKey: string]: string
    } = {};

    constructor(public proxyHost: string, public proxyApiKey?: string, public prodHost = 'http://cdn.gigya.com') {
    }

    public async getCore(apiKey: string) {
        const header = await this.getHeader(apiKey);
        const url = `http://${this.proxyHost}${paths.core[0]}?${dbgQueryParam}&apiKey=${this.proxyApiKey || apiKey}`;
        const proxyScript = await rp(url) as string;
        let body: string;

        let dynamicLoad = false;

        if (dynamicLoad) {
            body = proxyScript.substr(this.getHeaderEndIndex(proxyScript));
        }
        else {
            body = `
            (() => {
                // to immediately load these scripts - order matters
                document.write(\`
                <script src="//localhost/webSdk/latest/ApiAdapters/gigya.adapters.web.js"></script>
                <script src="//localhost/webSdk/latest/ApiAdapters/gigya.adapters.mobile.js"></script>
                <script src="//localhost/webSdk/latest/gigya.js"></script>
                \`);
            })();
        } // closing for an 'if' in the header
`;
        }

        return `// proxy magic
${header}
${body}`;
    }

    public async getSso(apiKey: string) {
        if (!apiKey) {
            throw 'missing api key';
        }
        else {
            const sso = await rp(`${this.prodHost}/${paths.sso[0]}?apiKey=${apiKey}`) as string;
            const ssoStartToken = `//server injected code`;
            const startIndex = sso.indexOf(ssoStartToken) + ssoStartToken.length;
            const ssoHeader = sso.substr(
                startIndex,
                sso.indexOf(`//end server injected code`) - startIndex
            );

            return `<!DOCTYPE html>
<html>
    <head>
        <title>proxy magic</title>
        <script language="javascript">
            //proxy injected code
            ${ssoHeader}
            //end proxy injected code
        </script>
        <script src="//${this.proxyHost}/websdk/latest/gigya.sso.js?${dbgQueryParam}"></script>
    </head>
</html>`
        }
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
        <script src="//${this.proxyHost}/websdk/latest/gigya.services.api.js?${dbgQueryParam}"></script>
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

    public getDefault(req: Request): Promise<string> {
        const connector = Object.keys(req.query).length ? '&' : '?';
        return rp(`http://${this.proxyHost}${req.originalUrl}${connector}${dbgQueryParam}`);
    }

    public async getPlugin(pluginName : string, lang = 'en', includeBasePlugin = false) {
        const translations = await this.getTranslations(pluginName, lang);
        return `
        (() => {
            function loadScript(name) {
                return new gigya.Promise(resolve => {
                    const script = document.createElement('script');
                    script.src = \`//localhost/webSdk/latest/\${name}\`;
                    script.async = false;
                    script.onload = resolve;
                    document.body.appendChild(script);
                });
            }
            
            const srcScript = document.querySelector("script[src*='${pluginName}']");
            const done = srcScript.onload;
            srcScript.onload = () => {};
            
            const loadBasePlugin = ${includeBasePlugin} ? 
                    loadScript('gigya.services.plugins.base.js')
                    : gigya.Promise.resolve(); 
            
            loadBasePlugin
            // .then(() => new gigya.Promise(resolve => gigya._.UI.registerPlugin(resolve)))
            .then(()=> {
                ${translations}            
            })
            .then(() => loadScript('${pluginName}.js'))
            .then(done);
        })();
`;
    }

    private async getTranslations(plugin : string, lang : string) {
        const pluginRes = await rp(`http://${this.proxyHost}/js/${plugin}?lang=${lang}`) as string;

        const transStartToken = '// Injected language object';
        const transEndToken = '// End injected language object';
        return pluginRes.substr(
            pluginRes.indexOf(transStartToken),
            pluginRes.indexOf(transEndToken) + transEndToken.length
        );
    }
}