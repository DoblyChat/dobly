module.exports = function DesktopIo(){
    var Desktop = require('../models/desktop'),
        self = this;

    self.add = function(data){
        updateDesktop(data.id, function(desktop){
            if(desktop.conversations.indexOf(data.conversationId) < 0){
                desktop.conversations.push(data.conversationId);            
            }
        });
    }

    self.remove = function(data){
        updateDesktop(data.id, function(desktop) {
            desktop.removeConversation(data.conversationId);
        });
    }

    self.updateStripOrder = function(data){
        updateDesktop(data.id, function(desktop) {
            var conversation = desktop.conversations[data.currentSort.startIndex];
            desktop.conversations.splice(data.currentSort.startIndex, 1);
            desktop.conversations.splice(data.currentSort.stopIndex, 0, conversation);
        });
    }

    function updateDesktop(id, update){
        Desktop.findById(id, function(err, desktop){
            if(err){
                console.error('Desktop update error: find', err);
            }else{
                update(desktop);
                desktop.save(function(err){
                    if(err){
                        console.error('Desktop update error: save', err);
                    }
                });    
            }
        });
    } 
};

