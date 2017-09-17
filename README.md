# gigya web sdk local proxy
```
npm i
npm start
```

set the following fiddler auto-responder rules:
```
regex:http://cdn(.*)\.gigya\.com/(js|JS|gs/webSdk|gs/websdk)(/.*)
http://localhost:8080/$2$3
```

and for https:
```
regex:https://cdn(.*)\.gigya\.com/(js|JS|gs/webSdk|gs/websdk)(/.*)
https://localhost:8081/$2$3
```