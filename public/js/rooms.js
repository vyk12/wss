function fetchRooms() {
	$.get('/get-rooms', function(res) {
		var data = JSON.parse(res);
		var container = $('#rooms-list');

		if (data.success) {
			container.html('');
			
			for (var i in data.rooms) {
				container.append('<a href="/room-' + data.rooms[i].id + '">' + data.rooms[i].name + '</a><br />');
			}
		}
		else {
			alert('An error occured');
		}
	});
}

$(function() {
	fetchRooms();
	
	$('#room-name').keyup(function(e) {
		if (e.keyCode == 13) {
			$.post('/create-room', { name: $(this).val() }, function(res) {
				var data = JSON.parse(res);

				if (data.success) {
					document.location.href = '/room-' + data.roomId;
				}
				else {
					alert('An error occured');
				}
			});
		}
	});

	$('#refresh-list').click(function() {
		fetchRooms();
	});
});