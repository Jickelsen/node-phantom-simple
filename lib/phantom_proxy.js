'use strict';


var _utils = require('./_utils')
    , callbackOrDummy = _utils.callbackOrDummy
    , promisify = require('bluebird').promisify;


module.exports = PhantomProxy;


function PhantomProxy(phantom, request_queue, poll_func, setup_new_page) {
    this.process = phantom;
    this.request_queue = request_queue;
    this.poll_func = poll_func;
    this.setup_new_page = setup_new_page;
}


var proxyMethods = {
    createPage: createPage,
    injectJs: injectJs,
    addCookie: addCookie,
    clearCookies: clearCookies,
    deleteCookie: deleteCookie,
    set: set,
    get: get,
    exit: exit
};

_utils.copy(proxyMethods, PhantomProxy.prototype, promisify);


PhantomProxy.prototype.on = function() {
    this.process.on.apply(this.process, arguments);
}


function createPage(callback) {
    var self = this;
    this.request_queue.push([[0,'createPage'], callbackOrDummy(function (err, results) {
        if (err)
            callback(err);
        else {
            var id = results.page_id;
            var page = self.setup_new_page(id);
            callback(null, page);
        }
    }, this.poll_func)]);
}

function injectJs(filename, callback) {
    this.request_queue.push([[0,'injectJs', filename], callbackOrDummy(callback, this.poll_func)]);
}

function addCookie(cookie, callback) {
    this.request_queue.push([[0,'addCookie', cookie], callbackOrDummy(callback, this.poll_func)]);
}

function clearCookies(callback) {
    this.request_queue.push([[0, 'clearCookies'], callbackOrDummy(callback, this.poll_func)]);
}

function deleteCookie(cookie, callback) {
    this.request_queue.push([[0, 'deleteCookie', cookie], callbackOrDummy(callback, this.poll_func)]);
}

function set(property, value, callback) {
    this.request_queue.push([[0, 'setProperty', property, value], callbackOrDummy(callback, this.poll_func)]);
}

function get(property, callback) {
    this.request_queue.push([[0, 'getProperty', property], callbackOrDummy(callback, this.poll_func)]);
}

function exit(callback){
    this.process.on('exit', callbackOrDummy(callback));
    this.process.kill('SIGTERM');
}
