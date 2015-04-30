var http = require('http');
var nodeStatic = require('node-static');
var mongoose = require('mongoose');

var fileServer = new nodeStatic.Server('./public');

var server = http.createServer(function(request, response) {
    request.addListener('end', function() {
        fileServer.serve(request, response, function(e, res) {
        	if (e && (e.status === 404)) {
                fileServer.serveFile('/404.html', 404, {}, request, response);
            }
        });
    }).resume();
}).listen(80);

var io = require('socket.io').listen(server);