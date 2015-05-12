'use strict';


var util = require('util')
    , bluebirdRetry = require('bluebird-retry');


var pageExtras = module.exports = {
    checkSelector: checkSelector,
    getSelectorRect: getSelectorRect,
    sendMouseEventToSelector: sendMouseEventToSelector,
    clickSelector: clickSelector,
    waitForSelector: util.deprecate(waitForSelector,
        'waitForSelector is deprected, use checkSelector')
};


function checkSelector(selector, retryOptions) {
    var self = this;
    return retry(_checkSelector, retryOptions);

    function _checkSelector() {
        return check(self.evaluate(_browserCheckSelector, selector));
    }
}


function getSelectorRect(selector, retryOptions) {
    var self = this;
    return retry(_getSelectorRect, retryOptions);

    function _getSelectorRect() {
        return check(self.evaluate(_browserGetSelectorRect, selector));
    }
}


function sendMouseEventToSelector(selector, mouseEventType, button, retryOptions) {
    if (!retryOptions && typeof button == 'object') {
        retryOptions = button;
        button = undefined;
    }

    var self = this;
    return this.getSelectorRect(selector, retryOptions)
    .then(function (rect) {
        var x = rect.left + rect.width / 2
        var y = rect.top + rect.height / 2;
        return self.sendEvent(mouseEventType, x, y, button);
    });
}


function clickSelector(selector, button, retryOptions) {
    return this.sendMouseEventToSelector(selector, 'click', button, retryOptions);
}


function waitForSelector(selector, timeout) {
    var retryOptions = {
        timeout: timeout || 10000,
        interval: 150
    };
    return this.checkSelector(selector, retryOptions);
}


function retry(func, retryOptions) {
    return retryOptions
            ? bluebirdRetry(func, retryOptions)
            : func();
}


function check(promise) {
    return promise.then(function (value) {
        if (!value) throw new Error('selector not found');
        return value;
    });
}


function _browserCheckSelector(sel) {
    return !!document.querySelector(sel);
}


function _browserGetSelectorRect(sel) {
    var el = document.querySelector(sel);
    return el && el.getBoundingClientRect();
}
