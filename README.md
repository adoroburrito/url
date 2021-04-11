# URL
A simple URL shortener, using typescript and postgres database

## How to use
- Clone repo
- run `npm install`
- Place your .env file following .env.sample example
- run `npm run migrate up` to run all migrations necessary to have your db setup to run everything
- run `npm run dev` to test (API will run on default port `3000`)

## How it works
When you POST an endpoint you like, with content following the schema below, you create a redirect for that link using this URL shortener. Later when you /get the same endpoint, you will be redirected to the redirect link that was provided earlier.

###### sample schema
```json
{
  "redirect": "https://github.com/andrestevao"
}
```


## example

POST "/myCoolUrl"
body:
```json
{
  "redirect": "https://google.com"
}
```
###### _this will create a redirect pointing the slug "/myCoolUrl" to "https://google.com"_

GET "/myCoolUrl"
CURL demo:
```bash
[nog@ikigai:~/fun/andre/url] main ± curl -v localhost:3000/myCoolUrl
*   Trying 127.0.0.1:3000...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 3000 (#0)
> GET /myCoolUrl HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.68.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 302 Found
< X-Powered-By: Express
< Location: https://google.com
< Vary: Accept
< Content-Type: text/plain; charset=utf-8
< Content-Length: 40
< Date: Sun, 11 Apr 2021 18:58:12 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
<
* Connection #0 to host localhost left intact
Found. Redirecting to https://google.com
```

#TO-DO
- tests
- make sure everything is reproducible and documented enough
- create docker container to run project
- drink more water
- like a lot of water, you need to drink more water man
- make sure to be hydrated
