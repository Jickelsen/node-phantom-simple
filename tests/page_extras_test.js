'use strict';

var phantom = require('../node-phantom-async')
    , createServer = require('./utils/create_server')
    , assert = require('assert');


describe('page extras', function() {
    var server, ph, page, messages;


    before(function() {
        return createServer('<html><head></head>\
<body><h1>Hello World</h1><div id="button1" class="button1">Button 1</div></body></html>')
        .then(function(_server) {
            server = _server;
            return phantom.create({ignoreErrorPattern: /CoreText performance note/});
        })
        .then(function (_ph) {
            ph = _ph;
        });
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
    });


    function isRejected(promise) {
        return promise
        .then(function() {
            throw new Error('promise is resolved')
        })
        .catch(function(err) {
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
