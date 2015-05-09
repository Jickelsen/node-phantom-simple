'use strict';

var phantom = require('../node-phantom-async');

phantom.create()
.bind({})
.then(function (ph) {
    this.ph = ph;
    return ph.createPage();
})
.then(function (page) {
    this.page = page;
    return page.open('http://tilomitra.com/repository/screenscrape/ajax.html');
})
.then(function (status) {
    console.log('opened site?', status);
    var jqUrl = 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'
    return this.page.includeJs(jqUrl);
})
.delay(5000) // Wait for AJAX content to load on the page.
.then(function() {
    // jQuery Loaded.
    return this.page.evaluate(function() {
        //Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
        var h2Arr = [],
        pArr = [];
        $('h2').each(function() {
            h2Arr.push($(this).html());
        });
        $('p').each(function() {
            pArr.push($(this).html());
        });

        return {
          h2: h2Arr,
          p: pArr
        };
    });
})
.then(function (result) {
    console.log(result);
})
.finally(function() {
    return this.ph.exit()
})
.finally(function() {
    process.exit();    
});
