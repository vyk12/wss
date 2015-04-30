var http = require('http');
var nodeStatic = require('node-static');

var file = new nodeStatic.Server('./public');

http.createServer(function(request, response) {
    request.addListener('end', function() {
        file.serve(request, response, function(e, res) {
        	if (e && (e.status === 404)) {
                file.serveFile('/404.html', 404, {}, request, response);
            }
        });
    }).resume();
}).listen(8080);