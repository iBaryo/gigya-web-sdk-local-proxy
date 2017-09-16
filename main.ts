import gigyaProxyMiddleware from "./middleware";
const app = require('express')();

app.use(gigyaProxyMiddleware('http://cdn.gigya.com'));
console.log('listening...');
app.listen(8080);