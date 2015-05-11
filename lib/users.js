module.exports = {
    users: {},
    
    isSignedIn: function(userId) {
        for (var socketId in this.users) {
            if (this.users[socketId] === userId) {
                return true;
            }
        }
        
        return false;
    },
    
    signIn: function(socketId, userId) {
        this.users[socketId] = userId;
    },
    
    signOut: function(socketId) {
        delete this.users[socketId];
    }
};