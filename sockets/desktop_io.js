var Desktop = require('../models/desktop');

exports.config = function(socket){
    socket.on('add_to_desktop', function(data){
        desktopIo.add(data);
    });

    socket.on('remove_from_desktop', function(data){
        desktopIo.remove(data);
    });

    socket.on('update_strip_order', function(data){
        desktopIo.updateStripOrder(data);
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
        update(desktop);
        desktop.save();
    });
}