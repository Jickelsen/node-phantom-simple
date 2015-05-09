'use strict';

var phantom = require('../node-phantom-simple')
    , assert = require('assert');


describe('page get/set methods', function() {
    it('should get and set page properties', function() {
        return phantom.create()
        .bind({})
        .then(function (ph) {
            this.ph = ph;
            return ph.createPage();
        })
        .then(function (page) {
            this.page = page;
            return page.get('viewportSize');
        })
        .then(function (size) {
            this.oldSize = size;
            return this.page.set('viewportSize', { width: 800, height: 600 });
        })
        .then(function() {
            return this.page.get('viewportSize');
        })
        .then(function (size) {
            assert.notDeepEqual(size, this.oldSize);
            assert.deepEqual(size, { width: 800, height: 600 });

            var rnd = this.rnd = Math.floor(100000 * Math.random());
            return this.page.set('zoomFactor', rnd);
        })
        .then(function() {
            console.log('zoomFactor');
            return this.page.get('zoomFactor');
        })
        .then(function (zoomValue) {
            assert.equal(zoomValue, this.rnd);
            return this.page.get('settings');
        })
        .then(function (settings) {
            this.settings = settings;
            return this.page.set('settings', { 'userAgent': 'node-phantom tester' });
        })
        .then(function() {
            return this.page.get('settings');
        })
        .then(function (newSettings) {
            assert.notEqual(this.settings.userAgent, newSettings.userAgent);
        })
        .finally(function() {
            return this.ph.exit();            
        });
    });
});
