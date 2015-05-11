var OFFLINE = 0;
var ONLINE = 1;

var Game = {
	board: null,
	playerColor: undefined,
	DOMSquares: [],
	gameType: undefined,
	callbacks: {},
    playing: false,

	init: function() {
        console.log('Game started !');
        
		this.board = new Board();
        this.playing = true;
        
		if (this.playerColor === undefined) {
			this.playerColor = BLACK;
		}

		this.board.on('pawn-created', function(coords) {
			$('#box-'+coords[0]+'-'+coords[1]).css('background-color', Game.getRVBColor(this.boxes[coords[0]][coords[1]].color));

			this.boxes[coords[0]][coords[1]].on('change', function() {
				$('#box-'+coords[0]+'-'+coords[1]).css('background-color', Game.getRVBColor(this.color));
			});
		});

		this.board.on('color-changed', function() {
			if (Game.gameType === OFFLINE) {
				Game.playerColor = this.currentColor;
			}
			else {
				$('#color').text('You play ' + (Game.playerColor === BLACK ? 'black' : 'white') + '.');
			}

			$('#whose-turn').text('Waiting for ' + (this.currentColor === BLACK ? 'black' : 'white') + '\'s move...');
		});

		this.board.on('end', function() {
            Game.playing = false;
            
			var scores = this.getScore();

			var result = '';

			if (scores[BLACK] > scores[WHITE]) {
				result = 'Black won !';
			}
			else if (scores[BLACK] < scores[WHITE]) {
				result = 'White won !';
			}
			else {
				result = 'Well, it\'s a tie !';
			}

			$('#whose-turn').text('The game has ended ! Final scores : ' + scores[BLACK] + ' for black, ' + scores[WHITE] + ' for white. ' + result + ' Do you want to play again ? ');
		});

		var table = $(document.createElement('table'));
		table.appendTo($('#game-container'));

		for (var i = 0; i < 8; ++i) {
			var row = $(document.createElement('tr'));
			table.append(row);

			for (var j = 0; j < 8; ++j) {
				var DOMSquare = $(document.createElement('td'));
				DOMSquare.attr('id', 'box-'+i+'-'+j);

				DOMSquare.click(function() {
					if (Game.playerColor !== Game.board.currentColor) {
						console.log('Not your turn');
						return;
					}

					var coords = $(this).attr('id').match(/^box-([0-9])-([0-9])$/);
					
					var x = parseInt(coords[1]);
					var y = parseInt(coords[2]);

					Game.board.placePawn(x, y, true);
				});

				row.append(DOMSquare);
			}
		}

		this.board.placePawn(3, 4, false);
		this.board.placePawn(4, 3, false);

		this.board.toggleCurrentColor();

		this.board.placePawn(3, 3, false);
		this.board.placePawn(4, 4, false);

		this.board.toggleCurrentColor();
	},
    
    destroy: function() {
        $('#game-container').text('');
        $('#status').text('');
        $('#color').text('');
        $('#whose-turn').text('');
    },

	getRVBColor: function(color) {
		return color == BLACK ? '#000' : '#fff';
	},

	togglePlayerColor: function() {
		this.playerColor = this.playerColor == BLACK ? WHITE : BLACK;
	}
};
