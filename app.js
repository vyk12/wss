var express = require('express.io');
var mongoose = require('mongoose');
var md5 = require('MD5');
var users = require('./lib/users.js');

var app = express();
app.http();
app.io();

app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser());
app.use(express.session({secret: 'ZE9F519ZES5F9Z5DF2Z9EFD1ZE98F2'}));

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

var checkOpponent = function(req, roomName) {
    var interval = setInterval(function() {
        if (req.io.manager.rooms['/' + roomName].length === 1) {
            app.io.room(roomName).broadcast('only-one-connected');

            clearInterval(interval);
        }
    }, 1000);
};

var getRoom = function(req) {
    for (var key in req.io.manager.roomClients[req.io.socket.id]) {
        if (key !== '') {
            return key.substr(1);
        }
    }
};

/*
List of rooms available in : req.io.manager.rooms
Format : { '' : [ array of rooms' ids ], '/Room name' : [ array of clients' ids ] }

List of clients available in : req.io.manager.roomClients
Format : { 'client id' : { '' : boolean (true = the client is in a room), '/Room name' : true (the client is in this room) }}
        
User id available at : req.io.socket.id
*/

app.io.sockets.on('connection', function(socket) {
    socket.on('disconnect', function() {
        users.signOut(socket.id);
    });
});

app.io.route('game-over', function(req) {
    if (!req.session.authenticated) {
        return;
    }
    
    if (req.data.tie === true) {
        return;
    }

    UserModel.findOne({ nickname: req.session.user.nickname }, function(err, user) {
        if (err) {
            return;
        }

        if (req.data.victory === true) {
            ++user.wins;
        }
        else if (req.data.defeat === true) {
            ++user.losses;
        }

        user.save();
    });
});

app.io.route('join', function(req) {
    if (!req.session.authenticated) {
        return;
    }
    
    var joined = false;
    var lastKey;
    var roomName;
    
    for (var key in req.io.manager.rooms) {
        if (key !== '') {
            if (req.io.manager.rooms[key].length === 1) {
                roomName = key.substr(1);
                
                req.io.join(roomName);
                joined = true;
                
                checkOpponent(req, roomName);
                console.log('Join room #' + roomName);
                
                req.io.room(roomName).broadcast('start-game');
                
                req.io.respond(2);
            }
        }
        
        lastKey = key;
    }
    
    roomName = lastKey === '' ? 1 : parseInt(lastKey.substr(1)) + 1;
    
    if (joined === false) {
        req.io.join(roomName);
        checkOpponent(req, roomName);
        console.log('Created room #' + roomName);
    }
    
    req.io.respond(1);
});

app.io.route('leave', function(req) {
    if (!req.session.authenticated) {
        return;
    }
    
    console.log(req.io.manager.rooms);
    req.io.leave(getRoom(req));
    console.log(req.io.manager.rooms);
});

app.io.route('pawn-created', function(req) {
    if (!req.session.authenticated) {
        return;
    }
    
    req.io.room(getRoom(req)).broadcast('pawn-created', req.data);
});

app.io.route('play-again', function(req) {
    if (!req.session.authenticated) {
        return;
    }
    
    req.io.room(getRoom(req)).broadcast('play-again', req.data);
});

app.io.route('signin', function(req) {
    var nickname = req.data.nickname;
	var password = req.data.password;

	UserModel.findOne({ nickname: nickname, password: md5(password) }, function(err, user) {
		var response = {};

		if (err) {
			response.success = false;
			response.error = 'db-issue';
            
            req.io.respond(response);
		}
		else if (user) {
            if (users.isSignedIn(user._id.toString())) {
                response.success = false;
                response.error = 'already-signed-in';
                
                req.io.respond(response);
            }
            else {
                users.signIn(req.io.socket.id, user._id.toString());
                
                response.success = true;

                req.session.authenticated = true;
                req.session.user = user;

                req.session.save(function() {
                    req.io.respond(response);
                });
            }
		}
		else {
			response.success = false;
			response.error = 'incorrect-info';
            
            req.io.respond(response);
		}
	});
});

app.io.route('signup', function(req) {
	var nickname = req.data.nickname;
	var password = req.data.password;

	UserModel.findOne({ nickname: nickname, password: md5(password) }, function(err, user) {
		var response = {};

		if (err) {
			response.success = false;
			response.error = 'db-issue';

			req.io.respond(response);
		}
		else if (user) {
			response.success = false;
			response.error = 'already-exists';

			req.io.respond(response);
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

				req.io.respond(response);
			});
		}
	});
});

app.io.route('user-info', function(req) {
	if (!req.session.authenticated) {
        return;
    }
    
    UserModel.findOne({ nickname: req.session.user.nickname }, function(err, user) {
		var response = {};

		if (err) {
			response.success = false;
		}
		else {
			response.success = true;
            
            response.nickname = user.nickname;
			response.wins = user.wins;
			response.losses = user.losses;
		}

		req.io.respond(response);
	});
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/client.html');
});

app.listen(8080);