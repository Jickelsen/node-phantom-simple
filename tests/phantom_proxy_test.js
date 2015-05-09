'use strict';

var phantom = require('../node-phantom-async');

describe('phantom', function() {
    var ph;

    beforeEach(function() {
        return phantom.create()
        .then(function(_ph) { ph = _ph; });
    });

    afterEach(function() {
        return ph.exit();
    })

    it('should create page', function() {
        return ph.createPage();
    });

    it('should inject JS from file', function() {
        return ph.injectJs('tests/files/injecttest.js');
    });
});
