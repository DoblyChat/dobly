module.exports = (function (){
    var Desktop = require('../models/desktop'),
        self = this;

    self.add = function(data){
        updateDesktop(data.id, function(desktop){
            desktop.addConversation(data.conversationId, function(err){
                if(err) console.error('Desktop error adding conversation', err);
            });
        });
    };

    self.remove = function(data){
        updateDesktop(data.id, function(desktop) {
            desktop.removeConversation(data.conversationId, function(err){
                if(err) console.error('Desktop error removing conversation', err);
            });
        });
    };

    self.updateStripOrder = function(data){
        updateDesktop(data.id, function(desktop) {
            desktop.moveConversation(data.currentSort.startIndex, data.currentSort.stopIndex, function(err){
                if(err) console.error('Desktop error updating strip order', err);
            });
        });
    };

    function updateDesktop(id, update){
        Desktop.findById(id, function(err, desktop){
            if(err){
                console.error('Desktop update error: find', err);
            }else{
                update(desktop);
            }
        });
    }

    return self; 
})();

