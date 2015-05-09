'use strict';


var phantom = require('../node-phantom-simple')
    , createServer = require('./utils/create_server')
    , assert = require('assert');


describe('page events', function() {
    var server;

    before(function () {
        return createServer('<html><head></head><body>\
<button onclick="document.getElementsByTagName(\'h1\')[0].innerText=\'Hello Test\';">Test</button>\
<h1>Hello World</h1></body></html>')
        .then(function(_server) {
            server = _server;
        });
    });


    after(function (done) {
        server.close(done);
    });


    it('should send events to the page', function() {
        return phantom.create({ignoreErrorPattern: /CoreText performance note/})
        .bind({})
        .then(function (ph) {
            this.ph = ph;
            return ph.createPage();
        })
        .then(function (page) {
            this.page = page;
            return page.open('http://localhost:' + server.address().port);
        })
        .then(function (status) {
            assert.equal(status,'success');
            return this.page.sendEvent('click', 30, 20);
        })
        .then(function() {
            return this.page.evaluate(function(){
                return document.getElementsByTagName('h1')[0].innerText;
            });
        })
        .then(function (result) {
            assert.equal(result,'Hello Test');            
        })
        .then(function() {
            return this.ph.exit();
        });
    });
});
