'use strict';

var phantom = require('../node-phantom-async')
    , http = require('http')
    , assert = require('assert');


describe('page callbacks', function() {
    var server, gotFile;

    before(function(done) {
        server = http.createServer(function (req, res) {
            if (req.url == '/upload') {
                req.on('data', function (buffer) {
                    gotFile = buffer.toString('ascii').indexOf('Hello World') > 0;
                });
            }
            else {
                res.writeHead(200, {"Content-Type": "text/html"});
                res.end('<html><head></head><body>\
<form id="testform" action="/upload" method="post" enctype="multipart/form-data">\
<input id="test" name="test" type="file"></form></body></html>');
            }
        }).listen(done);
    });


    after(function (done) {
        server.close(done);
    });


    it.skip('should upload file (fails with phantomjs 2.0)', function() {
        return phantom.create({ignoreErrorPattern: /CoreText performance note/})
        .bind({})
        .then(function (ph) {
            this.ph = ph;
            return ph.createPage();
        })
        .then(function(page) {
            this.page = page;
            return page.open('http://localhost:' + server.address().port);
        })
        .then(function (status) {
            assert.equal(status, 'success');
            return this.page.uploadFile('input[name=test]', __dirname + '/files/uploadtest.txt');
        })
        .then(function() {
            return this.page.evaluate(function () {
                document.forms['testform'].submit();
            });
        })
        .then(function() {
            assert(gotFile);            
        })
        .finally(function() {
            return this.ph.exit();
        });
    });
});
