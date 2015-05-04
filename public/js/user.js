var loggedIn = function() {
	$('#visitor-container').css('display', 'none');
	$('#user-container').css('display', 'block');

	$.get('/statistics', function(res) {
		var data = JSON.parse(res);

		$('#statistics').html('You have ' + data.wins + ' wins against ' + data.losses + ' losses');
	});
};

$(function() {
	$('#sign-up-form').submit(function(e) {
		var nickname = $(this.nickname).val();
		var password = $(this.password).val();

		var success = true;

		if (nickname == '') {
			alert('Please enter a valid nickname.');
			success = false;
		}

		if (password.length < 6) {
			alert('Please enter a password containing at least 6 characters.');
			success = false;
		}

		if (success) {
			$.post(this.action, $(this).serialize(), function(res) {
				var data = JSON.parse(res);

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

		$.post(this.action, $(this).serialize(), function(res) {
			var data = JSON.parse(res);

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
				}
			}
		});

		e.preventDefault();
	});
});