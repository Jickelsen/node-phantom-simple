'use strict';

var phantom = require('../node-phantom-async');
var assert = require('assert');

describe('phantom.create', function() {
    it('should fail if bad phantom path', function() {
        return phantom.create({phantomPath: '@@@', ignoreErrorPattern: /execvp/})
        .then(function (ph) {
            assert(false);
        })
        .catch(function (err) {
            assert.notStrictEqual(err, null);
        });
    });
});
