'use strict';

var http = require('http')
    , url = require('url')
    , os = require('os')
    , phantom = require('../node-phantom-simple')
    , Promise = require('bluebird')
    , assert = require('assert');


describe('phantom command line options', function() {
    var phantomInstance, proxyServer;
    var usingProxy = false;


    before(function (done) {
        proxyServer = http.createServer(function (request, response) {
            console.log("Req!");
            var requestedUrl = url.parse(request.url);
            if (requestedUrl.path === '/testPhantomPagePushNotifications'){
                usingProxy = true;
                response.writeHead(200,{"Content-Type": "text/html"});
                response.end('okay');
                return;
            }
            var req = http.request(
                {
                    hostname: requestedUrl.hostname,
                    port: requestedUrl.port,
                    path: requestedUrl.path,
                    method: request.method
                },
                function(res){
                    response.writeHead(res.statusCode, res.headers);
                    res.on('data', function (data) {
                        response.write(data)
                    });
                    res.on('end', function () {
                        response.end()
                    });
                }
            );
            req.on('error', function (error) {
                console.log(error);
                response.end();
                phantomInstance && phantomInstance.exit();
                proxyServer.close();
            });
            req.end();
        }).listen(function () {
            // console.log("Listening");
            done();
        });
    });


    after(function (done) {
        // console.log("tearing down...");
        proxyServer.close(done);
    });


    it('should use proxy if passed', function() {
        var opts = {parameters: {proxy: 'localhost:' + proxyServer.address().port}};
        
        return phantom.create(opts)
        .then(function (ph) {
            phantomInstance = ph;
            return ph.createPage();
        })
        .then(function (page) {
            return page.open('http://localhost/testPhantomPagePushNotifications');
        })
        .then(function () {
            if (os.platform() === 'darwin')
                return console.log('Proxy doesn\'t work on OSX');

            assert.equal(usingProxy, true, "Check if using proxy");
        })
        .finally(function() {
            return phantomInstance.exit();
        });
    });
});
