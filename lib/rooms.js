module.exports.currentId = -1;
module.exports.rooms = [];

module.exports.add = function(name) {
	++this.currentId;

	this.rooms[this.currentId] = { id: this.currentId, name: name, users: [] };
};

module.exports.addUser = function(roomId, userId, socket) {
	this.rooms[roomId].users.push({
		id: userId,
		socket: socket
	});
};

module.exports.emit = function(roomId, label, data, src) {
	var users = this.rooms[roomId].users;

	for (var i in users) {
		if (typeof src === 'undefined' || (typeof src !== 'undefined' && users[i]._id !== src)) {
			users[i].socket.emit(label, data);
		}
	}
};

module.exports.exists = function(id) {
	return typeof this.rooms[id] != 'undefined';
};

module.exports.get = function(id) {
	return {
		id: this.rooms[id].id,
		name: this.rooms[id].name
	};
};

module.exports.getAll = function() {
	var rooms = [];

	for (var i in this.rooms) {
		if (this.exists(i)) {
			rooms.push({
				id: this.rooms[i].id,
				name: this.rooms[i].name
			});
		}
	}

	return rooms;
};

module.exports.getNumberOfPlayers = function(roomId) {
	return this.rooms[roomId].users.length;
};

module.exports.isEmpty = function(roomId) {
	return this.rooms[roomId].users.length == 0;
};

module.exports.isFull = function(roomId) {
	return this.rooms[roomId].users.length == 2;
};

module.exports.remove = function(roomId) {
	this.rooms[roomId] = undefined;
};

module.exports.removeUser = function(roomId, userId) {
	for (var i in this.rooms[roomId].users) {
		if (this.rooms[roomId].users[i].id == userId) {
			this.rooms[roomId].users.splice(i, 1);
		}
	}
};