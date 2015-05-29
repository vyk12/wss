io = io.connect();

App = {
    currentPage: 1,
    
    goToPage: function(page) {
        if (this.currentPage === 3) {
            $('#gametype').remove();
            io.emit('leave');
            
            Game.destroy();
        }
        
        $('#page-' + this.currentPage).animate({ 'margin-left': this.currentPage < page ? '-100%' : '100%', 'opacity': 0 });
        
        this.currentPage = page;
        
        if (page === 2) {
            io.emit('user-info', function(res) {
                $('#nickname-display').text(res.nickname);
                $('#wins-display').text(res.wins);
                $('#losses-display').text(res.losses);
                
                $('#page-' + App.currentPage).animate({ 'margin-left' : '0', 'opacity' : 1 });
            });
        }
        else if (page === 3) {
            $('head').append($(document.createElement('script')).attr({ id: 'gametype', src: '/js/online.js' }));
            
            $('#page-' + App.currentPage).animate({ 'margin-left' : '0', 'opacity' : 1 });
        }
    }
};

$(function() {
    $('#start-game').click(function() {
        App.goToPage(3);
    });
});