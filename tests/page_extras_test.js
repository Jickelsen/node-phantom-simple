'use strict';

var phantom = require('../node-phantom-async')
    , http = require('http')
    , assert = require('assert');


describe('page extras', function() {
    var server, ph, page, messages;


    before(function (done) {
        server = http.createServer(function (req, res) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            if (req.url==='/login') {
                var body = '';
                req.on('data', function (data) { body += data; });
                req.on('end', function () { messages.push({ reqBody: body }); });
                res.end('post received');
            } else {
                res.end('<html><head></head>\
<body style="position:relative"><h1>Hello World</h1>\
<div id="button1" class="button1">Button 1</div>\
<form id="my_form" method="post" action="/login">\
<input type="text" name="name"><input type="password" name="password">\
<div name="not_input"></div></form>\
</body></html>');
            }
        }).listen(function (err) {
            if (err) return done(err);
            return phantom.create({ignoreErrorPattern: /CoreText performance note/})
            .then(function (_ph) {
                ph = _ph;
                done();
            })
            .catch(done);
        })
    });


    beforeEach(function() {
        messages = [];
        return ph.createPage()
        .then(function (_page) {
            page = _page;
            return page.open('http://localhost:' + server.address().port);
        })
        .then(function (status) {
            assert.equal(status, 'success');
            page.onConsoleMessage = function (msg) { messages.push(msg); };
            return page.evaluate(browserPrepareTestPage);
        });
    });

    function browserPrepareTestPage() {
        var button1 = document.getElementById('button1');
        listen(button1);

        setTimeout(function() {
            var button2 = document.createElement('div');
            button2.id = 'button2';
            button2.innerHTML = 'Button 2';
            document.body.appendChild(button2);
            listen(button2);
        }, 500);

        function listen(button) {
            button.addEventListener('click', function(e) {
                var mouseButton = e.button == 0
                                    ? 'left'
                                    : e.button == 2
                                        ? 'right'
                                        : 'other';
                console.log(button.id + ' ' + mouseButton + ' clicked');
            });
        }
    }

    afterEach(function() {
        return page.close();
    });

    after(function (done) {
        ph.exit()
        .finally(function() {
            server.close(done);
        });
    });


    describe('waitForSelector method', function() {
        it('should resolve if selector exists', function() {
            return page.waitForSelector('#button1');
        });

        it('should resolve if selector appears', function() {
            return page.waitForSelector('#button2');
        });

        it('should reject if timeout expires before selector appears', function() {
            return isRejected(page.waitForSelector('#button2', 400));
        });

        it('should reject if selector never appears', function() {
            return isRejected(page.waitForSelector('#button3', 1000));
        });
    });


    describe('checkSelector method', function() {
        it('should resolve if selector exists', function() {
            return page.checkSelector('#button1');
        });

        it('should reject if selector does not exist and no retryOptions passed', function() {
            return isRejected(page.checkSelector('#button2'));
        });

        it('should resolve if selector appears before timeout expires', function() {
            return page.checkSelector('#button2', { timeout: 1000, interval: 50 });
        });

        it('should reject if selector appears after timeout expires', function() {
            return isRejected(page.checkSelector('#button2', { timeout: 400, interval: 50 }));
        });

        it('should reject if selector never appears', function() {
            return isRejected(page.checkSelector('#button3', { timeout: 1000, interval: 50 }));
        });
    });


    describe('getSelectorRect method', function() {
        it('should resolve with bounding client rect if selector exists', function() {
            return page.getSelectorRect('#button1')
            .then(assertRect);
        });

        it('should reject if selector does not exist and no retryOptions passed', function() {
            return isRejected(page.getSelectorRect('#button2'));
        });

        it('should resolve with rect if selector appears before timeout expires', function() {
            return page.getSelectorRect('#button2', { timeout: 1000, interval: 50 })
            .then(assertRect);
        });

        it('should reject if selector appears after timeout expires', function() {
            return isRejected(page.getSelectorRect('#button2', { timeout: 400, interval: 50 }));
        });

        it('should reject if selector never appears', function() {
            return isRejected(page.getSelectorRect('#button3', { timeout: 1000, interval: 50 }));
        });
    });


    describe('sendMouseEventToSelector method', function() {
        beforeEach(function() {
            messages = [];
        });

        it('should send click event with left mouse button and resolve if selector exists', function() {
            return page.sendMouseEventToSelector('#button1', 'click')
            .then(assertButtonClicked('button1', 'left'));
        });

        it.skip('should send click event with right mouse button and resolve if selector exists (fails in phantomjs 2.0)', function() {
            return page.sendMouseEventToSelector('#button1', 'click', 'right')
            .then(assertButtonClicked('button1', 'right'));
        });

        it('should reject if selector does not exist and no retryOptions passed', function() {
            return isRejected(page.sendMouseEventToSelector('#button2', 'click'))
            .then(assertNoMessages);
        });

        it('should send click event with left mouse button and resolve if selector appears before timeout expires', function() {
            return page.sendMouseEventToSelector('#button2', 'click', 'left', { timeout: 1000, interval: 50 })
            .then(assertButtonClicked('button2', 'left'));
        });

        it('should reject if selector appears after timeout expires', function() {
            return isRejected(page.sendMouseEventToSelector('#button2', 'click', { timeout: 400, interval: 50 }))
            .then(assertNoMessages);
        });

        it('should reject if selector never appears', function() {
            return isRejected(page.sendMouseEventToSelector('#button3', 'click', { timeout: 1000, interval: 50 }))
            .then(assertNoMessages);
        });
    });


    describe('clickSelector method', function() {
        beforeEach(function() {
            messages = [];
        });

        it('should send click event with left mouse button and resolve if selector exists', function() {
            return page.clickSelector('#button1')
            .then(assertButtonClicked('button1', 'left'));
        });

        it.skip('should send click event with right mouse button and resolve if selector exists (fails in phantomjs 2.0)', function() {
            return page.clickSelector('#button1', 'right')
            .then(assertButtonClicked('button1', 'right'));
        });

        it('should reject if selector does not exist and no retryOptions passed', function() {
            return isRejected(page.clickSelector('#button2'))
            .then(assertNoMessages);
        });

        it('should send click event with left mouse button and resolve if selector appears before timeout expires', function() {
            return page.clickSelector('#button2', 'click', { timeout: 1000, interval: 50 })
            .then(assertButtonClicked('button2', 'left'));
        });

        it('should reject if selector appears after timeout expires', function() {
            return isRejected(page.clickSelector('#button2', { timeout: 400, interval: 50 }))
            .then(assertNoMessages);
        });

        it('should reject if selector never appears', function() {
            return isRejected(page.clickSelector('#button3', { timeout: 1000, interval: 50 }))
            .then(assertNoMessages);
        });

        it('should reject if selector is covered', function() {
            var promise = page.checkSelector('#button2', { timeout: 1000, interval: 50 })
            .then(function() {
                return page.evaluate(function() {
                    var el = document.createElement('div');
                    body.appendChild(el);
                    el.setAttribute('style', 'position:absolute;top:0;left:0;min-width:100%;min-height:100%;z-index:100');
                    // covers button 1 now
                });
            })
            .then(function() {
                return page.clickSelector('#button1')
                .then(function () {
                    throw new Error('selector visible');
                });
            });

            return isRejected(promise);
        });
    });


    describe('submitForm method', function() {
        it('should submit form', function() {
            return page.submitForm('#my_form', { name: 'test', password: '123' })
            .delay(100)
            .then(function (submitted) {
                assert(submitted);
                assert.deepEqual(messages, [ { reqBody: 'name=test&password=123' }]);
            });
        });

        it('should submit form if not fields are passed', function() {
            return page.submitForm('#my_form', { name: 'test' })
            .delay(100)
            .then(function (submitted) {
                assert(submitted);
                assert.deepEqual(messages, [ { reqBody: 'name=test&password=' }]);
            });
        });

        it('should fail to submit form if element is not form', function() {
            return page.submitForm('#my_form input', { name: 'test' })
            .delay(100)
            .then(function (submitted) {
                throw new Error('promise resolved');
            })
            .catch(function (err) {
                assert(!!err);
                // console.log(err);
                assert.deepEqual(messages, []);
            });
        });

        it('should fail to submit form if some field is not in form', function() {
            return page.submitForm('#my_form', { name: 'test', extra: 'not in form' })
            .delay(100)
            .then(function (submitted) {
                throw new Error('promise resolved');
            })
            .catch(function (err) {
                assert(!!err);
                // console.log(err);
                assert.deepEqual(messages, []);
            });
        });

        it('should fail to submit form if element present but not input', function() {
            return page.submitForm('#my_form', { name: 'test', not_input: 'test' })
            .delay(100)
            .then(function (submitted) {
                throw new Error('promise resolved');
            })
            .catch(function (err) {
                assert(!!err);
                // console.log(err);
                assert.deepEqual(messages, []);
            });
        });
    });


    function isRejected(promise) {
        return promise
        .then(
            function() {
                throw new Error('promise is resolved')
            },
            function(err) {
                assert(!!err);
            });
    }


    function assertRect(rect) {
        assert.equal(typeof rect.left, 'number');
        assert.equal(typeof rect.top, 'number');
        assert.equal(typeof rect.width, 'number');
        assert.equal(typeof rect.height, 'number');
    }


    function assertButtonClicked(elId, mouseButton) {
        return function() {
            assert.deepEqual(messages, [ elId + ' ' + mouseButton + ' clicked' ]);
        }
    }


    function assertNoMessages() {
        assert.deepEqual(messages, []);
    }
});
