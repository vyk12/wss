Game.gameType = ONLINE;

var playAgain;

var startGame = function() {
    $('#status').text('');

    Game.init();

    Game.board.on('pawn-created', function(coords) {
        io.emit('pawn-created', coords);
    });

    Game.board.on('end', function() {
        playAgain = false;
        
        var scores = this.getScore();

        var playerScore = scores[Game.playerColor];
        var opponentScore = scores[Game.playerColor === BLACK ? WHITE : BLACK];

        io.emit('game-over', { victory: playerScore > opponentScore, defeat: playerScore < opponentScore, tie: playerScore === opponentScore });

        $(document.createElement('button')).attr('type', 'button').text('Yes').click(function() {
            io.emit('play-again', true);
            
            $('#whose-turn').text('Waiting for the opponent\'s answer...');
            
            var interval = setInterval(function() {
                if (App.currentPage !== 3) {
                    clearInterval(interval);
                    return;
                }
                
                if (playAgain) {
                    startGame();
                    clearInterval(interval);
                }
            }, 1000);
        }).appendTo($('#whose-turn'));
        
        $(document.createElement('button')).attr('type', 'button').text('No').click(function() {
            App.goToPage(2);
        }).appendTo($('#whose-turn'));
    });
    
    io.on('pawn-created', function(coords) {
        Game.board.placePawn(coords[0], coords[1], true);
    });
};

io.emit('join', function(nbrOfPlayers) {
	if (nbrOfPlayers === 1) {
        console.log('You are the first one !');
		Game.playerColor = BLACK;
		$('#status').html('Waiting for a player...');
	}
    else {
        Game.playerColor = WHITE;
        startGame();
    }
});

io.on('message-received', function(data) {
    $('#chat-messages').append('<strong>' + data.name + '</strong> : ' + data.message + '<br />');
});

io.on('play-again', function(response) {
    playAgain = response;
});

io.on('start-game', startGame);

io.on('only-one-connected', function() {
    if (Game.playing) {
        $('#message').text('Your opponent disconnected.');
        Game.playing = false;

        setTimeout(function() {
            $('#message').text('');
        }, 3000);

        App.goToPage(2);
    }
});

$(function() {
    $('#chat-message').keypress(function(e) {
        console.log('Sending message');
        
        if (e.which === 13) {
            console.log('Message sent !');
            io.emit('new-message', $(this).val());
            
            $(this).val('');
        }
    });
});