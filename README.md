# gigya web sdk local proxy
getting websdk resources from localhost but with server injected data from production!

## installation
```
npm i -g gigya-web-sdk-local-proxy
```

set the following fiddler auto-responder rules:
```
regex:http://cdn(.*)\.gigya\.com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
http://localhost:8080/$2$3
```

and for https:
```
regex:https://cdn(.*)\.gigya\.com/(js|JS|gs/web[Ss]dk|gs/sso.htm)(.*)
https://localhost:8081/$2$3
```

## running
simply:
```
prox
```

## installation for local dev
after cloning:
```
npm i
npm start
```