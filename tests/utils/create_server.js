'use strict';


var promisify = require('bluebird').promisify
    , http = require('http')


module.exports = promisify(createServer);


function createServer(content, cb) {
    var server = http.createServer(function (req,res){
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    }).listen(function (err) {
        cb(err, server);
    });
}
