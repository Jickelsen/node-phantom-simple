'use strict';

var phantom = require('../node-phantom-async')
    , assert = require('assert');

describe('phantom', function() {
    it('should not open page after phantom exit', function() {
        return phantom.create()
        .bind({})
        .then(function (ph) {
            this.ph = ph;
            return ph.createPage();
        })
        .then(function (page) {
            this.ph.exit()
            return page.open('http://www.google.com');
        })
        .then(function (status) {
            assert.notEqual(status, 'success');
            throw new Error('should not open page');
        })
        .catch(function (err) {
            assert(!!err);
        });
    });
});
