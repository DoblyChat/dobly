var Desktop = require('../models/desktop');

exports.config = function(socket){
    socket.whenUser('add_to_desktop', function(data){
        add(data);
    });

    socket.whenUser('remove_from_desktop', function(data){
        remove(data);
    });

    socket.whenUser('update_strip_order', function(data){
        updateStripOrder(data);
    });
}

function add(data){
    updateDesktop(data.id, function(desktop){
        if(desktop.conversations.indexOf(data.conversationId) < 0){
            desktop.conversations.push(data.conversationId);            
        }
    });
}

function remove(data){
    updateDesktop(data.id, function(desktop) {
        desktop.removeConversation(data.conversationId);
    });
}

function updateStripOrder(data){
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
                console.error('Desktop update error: save', err);
            });    
        }
    });
}