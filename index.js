var http = require('http'),
    querystring = require('querystring'),
    url = require("url"),
    FibonacciClient = require('./fibonacci-client');

var fibonacciClient = new FibonacciClient();

http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url);
    var n = querystring.parse(parsedUrl.query).n;
    res.writeHead(200, {'Content-Type': 'text/plain'});
    if (n) {
        //Make async call to the fibonacci rpc
        fibonacciClient.call(n, function (result) {
            res.end("n=" + n + " result=" + result.toString());
        })
    } else {
        //If n isn't pass then print hello.
        res.end("hello");
    }
}).listen(8082, '127.0.0.1');

console.log('Server running at http://127.0.0.1:8082/');