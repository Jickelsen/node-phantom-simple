'use strict';


var util = require('util')
    , bluebirdRetry = require('bluebird-retry');


var pageExtras = module.exports = {
    checkSelector: checkSelector,
    getSelectorRect: getSelectorRect,
    getSelectorVisiblePoint: getSelectorVisiblePoint,
    sendMouseEventToSelector: sendMouseEventToSelector,
    clickSelector: clickSelector,
    submitForm: submitForm,
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


function getSelectorVisiblePoint(selector, retryOptions) {
    var self = this;
    return retry(_getSelectorVisiblePoint, retryOptions);

    function _getSelectorVisiblePoint() {
        return check(self.evaluate(_browserGetSelectorVisiblePoint, selector));
    }
}


function sendMouseEventToSelector(selector, mouseEventType, button, retryOptions) {
    if (!retryOptions && typeof button == 'object') {
        retryOptions = button;
        button = undefined;
    }

    var self = this;
    return this.getSelectorVisiblePoint(selector, retryOptions)
    .then(function (point) {
        return self.sendEvent(mouseEventType, point.x, point.y, button);
    });
}


function clickSelector(selector, button, retryOptions) {
    return this.sendMouseEventToSelector(selector, 'click', button, retryOptions);
}


function submitForm(formSelector, data, retryOptions) {
    var self = this;
    return this.checkSelector(formSelector, retryOptions)
    .then(function() {
        return check(self.evaluate(_browserSubmitForm, formSelector, data));
    });
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
        if (value && typeof value == 'string') throw new Error(value);
        if (!value) throw new Error('Selector not found');
        return value;
    });
}


function _browserCheckSelector(sel) {
    return !!document.querySelector(sel) || 'Element not found';
}


function _browserGetSelectorRect(sel) {
    var el = document.querySelector(sel);
    if (!el) return 'Element not found';
    return el.getBoundingClientRect();
}


function _browserGetSelectorVisiblePoint(sel) {
    var MARGIN = 2;
    var el = document.querySelector(sel);
    if (!el) return 'Element "' + sel + '" not found';
    var r = el.getBoundingClientRect();

    var point;
    [ (r.left + r.right) / 2, r.left + MARGIN, r.right - MARGIN ].forEach(function (x) {
        [ (r.top + r.bottom) / 2, r.top + MARGIN, r.bottom - MARGIN ].forEach(function (y) {
            if (!point && document.elementFromPoint(x, y) == el)
                point = { x: x, y: y };
        });
    });

    return point || 'Element "' + sel + '" not visible';
}


function _browserSubmitForm(formSelector, data) {
    try {
        var form = getElement(document, formSelector, 'form');
        for (var field in data) {
            var selector = '[name="' + field + '"]';
            var input = getElement(form, selector, 'input');
            input.value = data[field];
        }
        form.submit();
    } catch(e) {
        return e.message;
    }
    return true;

    function getElement(root, selector, tagName) {
        var el = root.querySelector(selector);
        if (!el) throw new Error(selector + ': not found');
        if (el.tagName.toLowerCase() != tagName)
            throw new Error(selector + ': is not ' + tagName);
        return el;
    }
}
