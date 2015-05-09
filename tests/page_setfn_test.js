'use strict';

var phantom = require('../node-phantom-simple')
    , createServer = require('./utils/create_server')
    , assert = require('assert');


describe('page callbacks', function() {
    var server;

    beforeEach(function() {
        return createServer('<html><head>\
<script>console.log("handled on phantom-side");</script></head>\
<body><h1>Hello World</h1></body></html>')
        .then(function(_server) {
            server = _server;
        });
    });


    afterEach(function (done) {
        server.close(done);
    });


    describe('assignment and setFn', function() {
        var ph, page;
        beforeEach(function() {
            return phantom.create({ignoreErrorPattern: /CoreText performance note/})
            .then(function (_ph) {
                ph = _ph;
                return ph.createPage();
            })
            .then(function (_page) {
                page = _page;
            });
        });


        afterEach(function() {
            return ph.exit();
        });


        it('assignment should register local callback', function() {
            var messagefromOnConsoleMessage, localMsg;
            page.onConsoleMessage = function (msg) { messagefromOnConsoleMessage = msg; };
            return page.open('http://localhost:' + server.address().port + '/')
            .then(function() {
                assert.equal(messagefromOnConsoleMessage, 'handled on phantom-side');
            });
        });


        it('setFn should set callback in phantomjs environment', function() {
            var messageFromOnCallback;
            page.onCallback = function(msg) { messageFromOnCallback = msg; };
            // function passed to setFn will have page in its scope referencing the current page
            // that's implemented in the bridge
            return page.setFn('onConsoleMessage', function (msg) { page.onCallback(msg); })
            .then(function() {
                return page.open('http://localhost:' + server.address().port + '/');
            })
            .then(function() {
                assert.equal(messageFromOnCallback, 'handled on phantom-side');
            });
        });
    });
});
