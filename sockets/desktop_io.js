module.exports = (function (){
    var Desktop = require('../models/desktop'),
        self = this;

    self.add = function(data){
        updateDesktop(data.id, function(desktop){
            desktop.addConversation(data.conversationId);
        });
    };

    self.remove = function(data){
        updateDesktop(data.id, function(desktop) {
            desktop.removeConversation(data.conversationId);
        });
    };

    self.updateStripOrder = function(data){
        updateDesktop(data.id, function(desktop) {
            desktop.moveConversation(data.currentSort.startIndex, data.currentSort.stopIndex);
        });
    };

    function updateDesktop(id, update){
        Desktop.findById(id, function(err, desktop){
            if(err){
                console.error('Desktop update error: find', err);
            }else{
                update(desktop);
                if(desktop.isModified()){
                    desktop.save(function(err){
                        if(err){
                            console.error('Desktop update error: save', err);
                        }
                    });   
                }
            }
        });
    }

    return self; 
})();

