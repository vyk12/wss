var loggedIn = function() {
	App.goToPage(2);
};

$(function() {
	$('#sign-up-form').submit(function(e) {
		var nickname = $(this.nickname).val();
		var password = $(this.password).val();

		var success = true;

		if (nickname === '') {
			alert('Please enter a valid nickname.');
			success = false;
		}

		if (password.length < 6) {
			alert('Please enter a password containing at least 6 characters.');
			success = false;
		}

		if (success) {
			io.emit('signup', { nickname: nickname, password: password }, function(data) {
				if (data.success) {
					alert('Registration successful !');

					loggedIn();
				}
				else {
					switch (data.error) {
						case 'db-issue':
							alert('There has been a problem with our database. Please try again later.');
							break;

						case 'already-exists':
							alert('This nickname already exists. Please choose another one.');
							break;
					}
				}
			});
		}

		e.preventDefault();
	});

	$('#sign-in-form').submit(function(e) {
		var nickname = $(this.nickname).val();
		var password = $(this.password).val();

		io.emit('signin', { nickname: nickname, password: password }, function(data) {
			if (data.success) {
				alert('Login successful !');

				loggedIn();
			}
			else {
				switch (data.error) {
					case 'db-issue':
						alert('There has been a problem with our database. Please try again later.');
						break;

					case 'incorrect-info':
						alert('Wrong login and/or password.');
						break;
                    
                    case 'already-signed-in':
                        alert('Account already signed in.');
                        break;
				}
			}
		});

		e.preventDefault();
	});
});