'use strict';

var phantom = require('../node-phantom-simple')
    , createServer = require('./utils/create_server')
    , assert = require('assert');


describe('page callbacks', function() {
    var server;

    before(function () {
        return createServer('<html><head>\
<script>window.callPhantom({ msg: "callPhantom" }); conXsole.log("cause-an-error");</script>\
</head><body><h1>Hello World</h1></body></html>')
        .then(function(_server) {
            server = _server;
        });
    });


    after(function (done) {
        server.close(done);
    });


    it('should send notifications to the page via callbacks', function() {
        return phantom.create({ignoreErrorPattern: /CoreText performance note/})
        .bind({})
        .then(function (ph) {
            this.ph = ph;
            return ph.createPage();
        })
        .then(function (page) {
            this.page = page;
            this.events = registerCallbacks(page);
            this.url = 'http://localhost:' + server.address().port + '/';
            return page.open(this.url);
        })
        .then(function (status) {
            assert.equal(status, 'success');
            return this.page.evaluate(function(){
                console.log('POW');
                console.log('WOW');
            });
        })
        .then(function () {
            var events = this.events;
            // console.log(events);
            assert.equal(events.onLoadStarted.length, 1);
            assert.deepEqual(events.onLoadFinished, ['success']);
            assert.deepEqual(events.onUrlChanged, [this.url]);
            assert.equal(events.onResourceRequested.length, 1);
            assert.equal(events.onResourceReceived.length, 2);
            assert.equal(events.onResourceReceived[0].stage, 'start');
            assert.equal(events.onResourceReceived[1].stage, 'end');

            assert.deepEqual(events.onCallback, [{ msg: "callPhantom" }]);
            assert.deepEqual(events.onConsoleMessage, ['POW', 'WOW']);

            // console.log(events.onError);
            // assert.equal(events.onError && events.onError.length, 1);
            // var err = events.onError && events.onError[0];
            // assert.equal(err && err.length, 2);
            // assert.ok(/variable: conXsole/.test(err && err[0]));
            // assert.equal(err && err[1][0].line, 1);

            events.onConsoleMessage = [];
            return this.page.evaluate(function(a, b){
                console.log(a);
                console.log(b);
            }, 'A', 'B');
        })
        .then(function(){
            assert.deepEqual(this.events.onConsoleMessage, ['A', 'B']);
        })
        .finally(function(page){
            return this.ph.exit();
        });
    });


    function registerCallbacks(page) {
        var events = {};
        var callbacks = [
            'onLoadFinished', 'onAlert','onConfirm','onConsoleMessage','onError', 'onInitialized',/*'onLoadFinished',*/
            'onLoadStarted','onPrompt', 'onResourceRequested','onResourceReceived','onUrlChanged',
            'onCallback'
        ];
        callbacks.forEach(function(cb) {
            page[cb] = function (evt) {
                if (!events[cb]) events[cb] = [];
                events[cb].push(evt);
            }
        })
        return events;
    }
});
