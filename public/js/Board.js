var BLACK = 0;
var WHITE = 1;

var Board = function() {
	this.boxes = [];
	this.callbacks = {};
	this.currentColor = BLACK;

	this.directions = [
		{ rowOp: this.equals, colOp: this.increment }, // Right direction
		{ rowOp: this.decrement, colOp: this.increment }, // Up-right direction
		{ rowOp: this.decrement, colOp: this.equals }, // Up direction
		{ rowOp: this.decrement, colOp: this.decrement }, // Up-left direction
		{ rowOp: this.equals, colOp: this.decrement }, // Left direction
		{ rowOp: this.increment, colOp: this.decrement }, // Down-left direction
		{ rowOp: this.increment, colOp: this.equals }, // Down direction
		{ rowOp: this.increment, colOp: this.increment } // Down-right direction
	];

	for (var i = 0; i < 8; ++i) {
		this.boxes[i] = [];

		for (var j = 0; j < 8; ++j) {
			this.boxes[i][j] = null;
		}
	}
};

Board.prototype.getDirection = function(i, j, color, rowOp, colOp) {
	// If there is a pawn in this box, the player can't put another one in it
	if (this.boxes[i][j] !== null) {
		return 0;
	}

	// Let's get the coordinates of the next box
	var nextI = rowOp(i);
	var nextJ = colOp(j);

	// If the next box is out of the game board or if there is no pawn or if the pawn's color is the same as the original pawn's color, the player can't put the pawn here
	if (typeof this.boxes[nextI] === 'undefined' || typeof this.boxes[nextI][nextJ] === 'undefined' || this.boxes[nextI][nextJ] === null || this.boxes[nextI][nextJ].color === color) {
		return 0;
	}

	// Let's see if a pawn here can bring points
	for (var k = 1; k < 7; ++k) {
		// Let's get the coordinates of the next box
		nextI = rowOp(nextI);
		nextJ = colOp(nextJ);

		// If the next box is out of the game board or if there is no pawn, then the move is invalid
		if (typeof this.boxes[nextI] === 'undefined' || typeof this.boxes[nextI][nextJ] === 'undefined' || this.boxes[nextI][nextJ] === null) {
			return 0;
		}

		// If the pawn's color is the same as the player's pawn's color, then it's a valid move
		if (this.boxes[nextI][nextJ].color === color) {
			return k; // Let's return the number of affected pawns
		}
	}

	return 0;
};

Board.prototype.getDirections = function(i, j, color) {
	var directions = [];

	// Let's get all the possible directions to win points
	for (var k = 0; k < this.directions.length; ++k) {
		directions.push(this.getDirection(i, j, color, this.directions[k].rowOp, this.directions[k].colOp));
	}

	return directions;
};

Board.prototype.getScore = function() {
	var scores = [0, 0];

	for (var i = 0; i < 8; ++i) {
		for (var j = 0; j < 8; ++j) {
			++scores[this.boxes[i][j].color];
		}
	}

	return scores;
};

Board.prototype.decrement = function(x) {
	return x - 1;
};

Board.prototype.equals = function(x) {
	return x;
};

Board.prototype.increment = function(x) {
	return x + 1;
};

// Check if a direction can bring points
Board.prototype.hasOneDirection = function(directions) {
	for (var i in directions) {
		if (directions[i] !== 0) {
			return true;
		}
	}

	return false;
};

Board.prototype.hasPossibleMove = function() {
	for (var i = 0; i < 8; ++i) {
		for (var j = 0; j < 8; ++j) {
			if (this.hasOneDirection(this.getDirections(i, j, this.currentColor))) {
				return true;
			}
		}
	}

	return false;
};

Board.prototype.on = function(event, func) {
    if (!this.callbacks.hasOwnProperty(event)) {
        this.callbacks[event] = [];
    }
    
    this.callbacks[event].push(func.bind(this));
};

// Place a pawn on the board game
Board.prototype.placePawn = function(i, j, check) {
	// Let's get all the possible directions
	var directions = this.getDirections(i, j, this.currentColor);

	if (!check || (check && this.hasOneDirection(directions))) {
		this.boxes[i][j] = new Pawn(this.currentColor);
		this.trigger('pawn-created', [i, j]);

		// For each direction, let's change the pawns' colors
		for (var k in directions) {
			var nextI = i;
			var nextJ = j;

			// If the direction can't bring any points, then directions[k] = 0 so there won't be any iteration
			for (var l = 0; l < directions[k]; ++l) {
				nextI = this.directions[k].rowOp(nextI);
				nextJ = this.directions[k].colOp(nextJ);

				this.boxes[nextI][nextJ].setColor(this.currentColor);
			}
		}

		if (check) {
			this.toggleCurrentColor();

			// If the current player can't play, then the game switches back to the other player
			if (!this.hasPossibleMove()) {
				this.toggleCurrentColor();

				// If the other player can't play neither, the the game is over
				if (!this.hasPossibleMove()) {
					this.trigger('end');
				}
			}
		}
	}
};

Board.prototype.toggleCurrentColor = function() {
	this.currentColor = this.currentColor == BLACK ? WHITE : BLACK;
	this.trigger('color-changed');
};

Board.prototype.trigger = function(event, data) {
    if (this.callbacks.hasOwnProperty(event)) {
        for (var i in this.callbacks[event]) {
            this.callbacks[event][i](data);
        }
    }
};

var Pawn = function(color) {
	this.color = color;
	this.callbacks = {};
}

Pawn.prototype.on = function(event, func) {
    if (!this.callbacks.hasOwnProperty(event)) {
        this.callbacks[event] = [];
    }
    
    this.callbacks[event].push(func.bind(this));
};

Pawn.prototype.setColor = function(color) {
	this.color = color;
	this.trigger('change');
};

Pawn.prototype.trigger = function(event, data) {
    if (this.callbacks.hasOwnProperty(event)) {
        for (var i in this.callbacks[event]) {
            this.callbacks[event][i](data);
        }
    }
};