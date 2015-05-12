'use strict';

var http = require('http')
    , phantom = require('../node-phantom-async')
    , assert = require('assert');


describe('page methods', function() {
    var server, ph, page;

    before(function (done) {
        server = http.createServer(function (request,response) {
            if (request.url==='/test.js') {
                response.writeHead(200, {"Content-Type": "text/javascript"});
                response.end('document.getElementsByTagName("h1")[0].innerText="Hello Test";');
            }
            else {
                response.writeHead(200,{"Content-Type": "text/html"});
                response.end('<html><head></head><body><h1>Hello World</h1></body></html>');
            }
        }).listen(function (err) {
            if (err) return done(err);
            phantom.create({ignoreErrorPattern: /CoreText performance note/})
            .then(function (_ph) {
                ph = _ph;
                done();
            })
            .catch(done);
        });
    });

    beforeEach(function() {
        return ph.createPage()
        .then(function (_page) {
            page = _page;
        });
    });

    afterEach(function() {
        return page.close();
    });

    after(function (done) {
        ph.exit()
        .finally(function() {
            server.close(done);
        });
    });


    it('should open page', function() {
        return page.open('http://localhost:' + server.address().port)
        .then(function (status) {
            assert.equal(status,'success');
        });
    })


    it('should evaluate JS in the page', function() {
        return page.open('http://localhost:' + server.address().port)
        .then(function (status) {
            assert.equal(status, 'success');
            return page.evaluate(function (tag) {
                return { text: document.getElementsByTagName(tag)[0].innerText };
            }, 'h1');
        })
        .then(function (result) {
            assert.equal(result.text, 'Hello World');
        });
    });


    it('should include JS in the page', function() {
        return page.open('http://localhost:' + server.address().port)
        .then(function (status) {
            assert.equal(status, 'success');
            return page.includeJs('http://localhost:' + server.address().port + '/test.js');
        })
        .then(function() {
            return page.evaluate(function (tag) {
                return [document.getElementsByTagName(tag)[0].innerText, document.getElementsByTagName('script').length];
            }, 'h1');
        })
        .then(function (result) {
            assert.equal(result[0], 'Hello Test', 'Script was executed');
            assert.equal(result[1], 1, 'Added a new script tag');
        });
    });


    it('should inject JS in the page', function() {
        return page.open('http://localhost:' + server.address().port)
        .then(function (status) {
            assert.equal(status, 'success');
            return page.injectJs('tests/files/modifytest.js');
        })
        .then(function() {
            return page.evaluate(function(){
                return [document.getElementsByTagName('h1')[0].innerText,document.getElementsByTagName('script').length];
            });
        })
        .then(function (result) {
            assert.equal(result[0], 'Hello Test');   //the script should have been executed
            assert.equal(result[1], 0);              //it should not have added a new script-tag (see: https://groups.google.com/forum/?fromgroups#!topic/phantomjs/G4xcnSLrMw8)
        });
    });


    describe('render methods', function() {
        var testFilename = __dirname+'/files/testrender.png'
            , verifyFilename = __dirname+'/files/verifyrender.png'
            , fs = require('fs')
            , crypto = require('crypto');

        it('should render page to file', function() {
            return page.open('http://localhost:' + server.address().port)
            .then(function (status) {
                assert.equal(status, 'success');
                return page.render(testFilename);
            })
            .then(function() {
                assert.equal(fileHash(testFilename), fileHash(verifyFilename));
                fs.unlinkSync(testFilename);    //clean up the testfile
            });
        });


        it('should render page to Buffer in base64 encoding', function() {
            return page.open('http://localhost:' + server.address().port)
            .then(function (status) {
                assert.equal(status, 'success');
                return page.renderBase64('png');
            })
            .then(function (imagedata) {
                assert.equal(bufferHash(new Buffer(imagedata, 'base64')), fileHash(verifyFilename));
            })
        });            


        function fileHash (filename) {
            var shasum = crypto.createHash('sha256');
            var f = fs.readFileSync(filename);
            shasum.update(f);
            return shasum.digest('hex');
        }


        function bufferHash(buffer){
            var shasum = crypto.createHash('sha256');
            shasum.update(buffer);
            return shasum.digest('hex');    
        }
    });
});
