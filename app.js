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

mongoose.connect('mongodb://localhost/game', function(err) {
 	if (err) { throw err; }
});

var userSchema = new mongoose.Schema({
 	nickname: String,
 	password: String,
 	wins: { type: Number, min: 0, default: 0},
 	losses: { type: Number, min: 0, default: 0}
});

var UserModel = mongoose.model('users', userSchema);

var user = new UserModel({ nickname : 'vyk12' });
user.save(function (err) {
  	if (err) { throw err; }
 	console.log('User added !');

 	mongoose.connection.close();
});