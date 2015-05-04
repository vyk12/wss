Game.gameType = ONLINE;

var socket = io.connect('http://localhost:8080');

socket.on('nbr-of-players', function(data) {
	if (data == 1) {
		Game.playerColor = BLACK;
		console.log('You are the first one');
		$('#status').html('Waiting for a player...');
	}
	else {
		$('#status').remove();

		if (typeof Game.playerColor === 'undefined') {
			console.log('You are the second one');
			Game.playerColor = WHITE;
		}

		Game.init();

		Game.board.on('pawn-created', function(coords) {
			socket.emit('pawn-created', coords);
		});

		Game.board.on('end', function() {
			var scores = this.getScore();

			var playerScore = scores[Game.playerColor];
			var opponentScore = scores[Game.playerColor === BLACK ? WHITE : BLACK];

			socket.emit('game-over', { victory: playerScore > opponentScore, defeat: playerScore < opponentScore, tie: playerScore === opponentScore })
		});

		socket.on('pawn-created', function(coords) {
			Game.board.placePawn(coords[0], coords[1], true);
		});
	}
});