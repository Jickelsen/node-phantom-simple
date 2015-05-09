'use strict';


var _utils = require('./_utils')
    , callbackOrDummy = _utils.callbackOrDummy
    , promisify = require('bluebird').promisify;


module.exports = Page;


/**
 * Page class
 */
function Page(id, request_queue, poll_func) {
    this.id = id;
    this.request_queue = request_queue;
    this.poll_func = poll_func;
}


var pageMethods = {
    setFn: setFn,
    get: get,
    set: set,
    evaluate: evaluate,
    waitForSelector: waitForSelector
};

_utils.copy(pageMethods, Page.prototype, promisify);


[
    'addCookie', 'childFramesCount', 'childFramesName', 'clearCookies', 'close',
    'currentFrameName', 'deleteCookie', 'evaluateJavaScript',
    'evaluateAsync', 'getPage', 'go', 'goBack', 'goForward', 'includeJs',
    'injectJs', 'open', 'openUrl', 'release', 'reload', 'render', 'renderBase64',
    'sendEvent', 'setContent', 'stop', 'switchToFocusedFrame', 'switchToFrame',
    'switchToFrame', 'switchToChildFrame', 'switchToChildFrame', 'switchToMainFrame',
    'switchToParentFrame', 'uploadFile',
].forEach(function (method) {
    Page.prototype[method] = promisify(pageMethod);

    function pageMethod() {
        var args = Array.prototype.slice.call(arguments);
        var callback = null;
        if (args.length > 0 && typeof args[args.length - 1] === 'function')
            callback = args.pop();
        var req_params = [this.id, method].concat(args);
        this.request_queue.push([req_params, callbackOrDummy(callback, this.poll_func)]);
    }
});


function setFn(name, fn, cb) {
    this.request_queue.push([[this.id, 'setFunction', name, fn.toString()], callbackOrDummy(cb, this.poll_func)]);
}

function get(name, cb) {
    this.request_queue.push([[this.id, 'getProperty', name], callbackOrDummy(cb, this.poll_func)]);
}

function set(name, val, cb) {
    this.request_queue.push([[this.id, 'setProperty', name, val], callbackOrDummy(cb, this.poll_func)]);
}

function evaluate(fn) { // ..., args, cb
    var extra_args = [];
    var cb = arguments[arguments.length - 1]
    if (arguments.length > 2) {
        extra_args = Array.prototype.slice.call(arguments, 1, -1);
        // console.log("Extra args: " + extra_args);
    }
    this.request_queue.push([[this.id, 'evaluate', fn.toString()].concat(extra_args), callbackOrDummy(cb, this.poll_func)]);
}

function waitForSelector(selector, timeout, cb) {
    var startTime = Date.now();
    var timeoutInterval = 150;
    var self = this;

    timeout = timeout || 10000; //default timeout is 10 sec;
    setTimeout(testForSelector, timeoutInterval);

    //if evaluate succeeds, invokes callback w/ true, if timeout,
    // invokes w/ false, otherwise just exits
    function testForSelector() {
        var elapsedTime = Date.now() - startTime;

        if (elapsedTime > timeout)
            return cb('Timeout waiting for selector: ' + selector);

        self.evaluate(function (selector) {
            return document.querySelectorAll(selector).length;
        }, selector)
        .then(function (result) {
            if (result > 0) cb(); //selector found
            else setTimeout(testForSelector, timeoutInterval);
        })
        .catch(function (err) {
            setTimeout(testForSelector, timeoutInterval);    
        });
    }
}
