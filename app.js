var express = require('express');
var engine = require('ejs-locals');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var md5 = require('MD5');
var session = require('express-session');
var sessionMiddleware = session({
	secret: 'R94E8F8ZE4FEZ891FE87RGF8ZE1F',
	resave: false,
	saveUninitialized: false
});

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var rooms = require('./lib/rooms');

app.engine('ejs', engine);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(express.static(__dirname + '/public'));
app.use(sessionMiddleware);

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

mongoose.connect('mongodb://localhost/game', function(err) {
 	if (err) { throw err; }
});

var userSchema = new mongoose.Schema({
 	nickname: String,
 	password: String,
 	wins: { type: Number, min: 0, default: 0 },
 	losses: { type: Number, min: 0, default: 0 }
});

var UserModel = mongoose.model('users', userSchema);

app.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('index.ejs', { title: 'HoneyFoo', isAuthenticated: req.session.authenticated });
});

app.post('/create-room', function(req, res) {
	var response = {};

	rooms.add(req.body.name);

	response.success = true;
	response.roomId = rooms.currentId;

	res.send(JSON.stringify(response));
});

app.get('/game', function(req, res) {
	res.render('game.ejs', { title: 'HoneyFoo' });
});

app.get('/get-rooms', function(req, res) {
	var response = {};

	response.success = true;
	response.rooms = rooms.getAll();

	res.send(JSON.stringify(response));
});

app.get('/room-:id', function(req, res) {
    res.setHeader('Content-Type', 'text/html');

    var room = rooms.get(req.params.id);

    console.log(room);
    console.log(typeof req.session.room);

    if (room && typeof req.session.room === 'undefined') { // if the room exists and the user is not in another room
    	req.session.room = room;
    	res.render('room.ejs', { title: room.name + ' - HoneyFoo', room: room });
    }
});

app.post('/signin', function(req, res) {
	var nickname = req.body.nickname;
	var password = req.body.password;

	UserModel.findOne({ nickname: nickname, password: md5(password) }, function(err, user) {
		var response = {};

		if (err) {
			response.success = false;
			response.error = 'db-issue';
		}
		else if (user) {
			response.success = true;

			req.session.authenticated = true;
			req.session.user = user;
		}
		else {
			response.success = false;
			response.error = 'incorrect-info';
		}

		res.send(JSON.stringify(response));
	});
});

app.post('/signup', function(req, res) {
	var nickname = req.body.nickname;
	var password = req.body.password;

	UserModel.findOne({ nickname: nickname, password: md5(password) }, function(err, user) {
		var response = {};

		if (err) {
			response.success = false;
			response.error = 'db-issue';

			res.send(JSON.stringify(response));
		}
		else if (user) {
			response.success = false;
			response.error = 'already-exists';

			res.send(JSON.stringify(response));
		}
		else {
			var user = new UserModel({ nickname: nickname, password: md5(password) });

			user.save(function(err) {
				if (err) {
					response.success = false;
					response.error = 'db-issue';
				}
				else {
					response.success = true;

					req.session.authenticated = true;
					req.session.user = user;
				}

				res.send(JSON.stringify(response));
			});
		}
	});
});

app.get('/statistics', function(req, res) {
	UserModel.findOne({ nickname: req.session.user.nickname }, function(err, user) {
		var response = {};

		if (err) {
			response.success = false;
		}
		else {
			response.success = true;
			response.wins = user.wins;
			response.losses = user.losses;
		}

		res.send(JSON.stringify(response));
	});
});

app.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/html');
    res.render('404.ejs', { title: 'HoneyFoo - Resource not found' });
});

io.on('connection', function(socket) {
	console.log('Client connected !');

	var session = socket.request.session;

	// If the user is authenticated and actually is in a room
	if (session.authenticated && session.room) {
		console.log('Client authenticated !');

		if (rooms.exists(session.room.id) && !rooms.isFull(session.room.id)) {
			rooms.addUser(session.room.id, session.user._id, socket);

			rooms.emit(session.room.id, 'nbr-of-players', rooms.getNumberOfPlayers(session.room.id));

			socket.on('pawn-created', function(coords) {
				rooms.emit(session.room.id, 'pawn-created', coords, session.user._id);
			});

			socket.on('game-over', function(results) {
				if (results.tie === true) {
					return;
				}

				UserModel.findOne({ nickname: session.user.nickname }, function(err, user) {
					if (err) {
						return;
					}

					if (results.victory === true) {
						++user.wins;
					}
					else if (results.defeat === true) {
						++user.losses;
					}

					user.save();
				});
			});
		}
	}

	socket.on('disconnect', function() {
		console.log('Client disconnected !');

		rooms.removeUser(session.room.id, session.user._id);

		if (rooms.isEmpty(session.room.id)) {
			rooms.remove(session.room.id);
			// socket.request.session.room = undefined; or something like that
		}
	});
});

server.listen(8080);