module.exports = (function (){
    var Desktop = require('../models/desktop'),
        self = {};

    self.addConversation = function(socket, data){
        Desktop.addConversation(data.id, data.conversationId, function(err){
            if(err) {
                console.error('Desktop error adding conversation', err);
            }else{
                socket.joinConversationRoom(data.conversationId);
            }
        });
    };

    self.removeConversation = function(socket, data){
        Desktop.removeConversation(data.id, data.conversationId, function(err){
            if(err) {
                console.error('Desktop error removing conversation', err);
            }else{
                socket.leaveConversationRoom(data.conversationId);
            }
        });
    };

    self.updateStripOrder = function(data){
        Desktop.findById(data.id, function(err, desktop){
            if(err){
                console.error('Desktop update error: find', err);
            }else{
                desktop.moveConversation(data.currentSort.startIndex, data.currentSort.stopIndex, function(err){
                    if(err) console.error('Desktop error updating strip order', err);
                });
            }
        });
    };

    return self; 
})();
