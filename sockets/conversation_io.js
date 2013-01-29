var Conversation = require('../models/conversation'),
    Message = require('../models/message'),
    User = require('../models/user'),
    UnreadMarker = require('../models/unread_marker'),
    active = {};

exports.config = function(socket){
    socket.on('new_active_conversation', function(data){
        addNewActiveConversations(socket, data);
    });

    socket.on('send_message', function(data) {
        sendMessage(socket, data);
    });

    socket.on('create_conversation', function(data){
        createConversation(socket, data);
    });

    socket.on('remove_active_conversations', function(){
        removeActiveUser(socket);
    });

    socket.on('mark_as_read', function(conversationId){
        markAsRead(socket, conversationId);
    });
}

function createConversation(socket, data) {
    Conversation.create(
            { 
                topic: data.topic, 
                createdBy: socket.handshake.user.username, 
                groupId: socket.handshake.user.groupId 
            }, 
            function(err, conversation){
                var dataToEmit = { 
                    _id: conversation.id, 
                    topic: conversation.topic, 
                    createdBy: conversation.createdBy 
                };

                socket.emit('my_new_conversation', dataToEmit);
                socket.broadcast.emit('new_conversation', dataToEmit);
            }
    );
}

function emit(socket, event, dataToEmit){
    socket.emit(event, dataToEmit);
    socket.broadcast.emit(event, dataToEmit);
}

function addNewActiveConversations(socket, data){
    var userId = socket.handshake.user._id;
    active[userId] = data;
};

function removeActiveUser(socket){
    delete active[socket.handshake.user._id];
};

function sendMessage(socket, data){
	Conversation.findById(data.conversationId, function(err, conversation){
        var msg = new Message();
        msg.content = data.content;
        msg.createdBy = socket.handshake.user.username;
        msg.timestamp = data.timestamp;
        conversation.messages.push(msg);
        conversation.save(function(err){
            var dataToEmit = {
                content: data.content, 
                createdBy: socket.handshake.user.username, 
                conversationId: data.conversationId,
                timestamp: data.timestamp,
            };

            emit(socket, 'receive_message', dataToEmit);
            saveUnreadMarkers(socket.handshake.user._id, socket.handshake.user.groupId, data.conversationId);
        });
    });
};

function saveUnreadMarkers(currentUserId, currentGroupId, conversationId){
    User.find({ _id: { $ne: currentUserId }, groupId: currentGroupId }, function(err, users){
        users.forEach(function(user){
            if(!userIsActive(user) || !userInConversation(user, conversationId)){
                UnreadMarker.increaseCounter(user._id, conversationId);
            }
        });
    });
}

function userIsActive(user){
    return active[user._id] !== undefined;
}

function userInConversation(user, conversationId){
    return active[user._id].indexOf(conversationId) > -1;
}

function markAsRead(socket, conversationId){
    UnreadMarker.remove({ conversationId: conversationId, userId: socket.handshake.user._id }).exec();
}