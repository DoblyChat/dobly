var Conversation = require('../models/conversation'),
    Message = require('../models/message'),
    users = require('../models/users'),
    UnreadMarker = require('../models/unread_marker'),
    active = {};

exports.config = function(socket){
    socket.on('new_active_conversation', function(data){
        addNewActiveConversations(socket, data);
    });

    socket.on('send_message', function(data) {
        sendMessage(socket, data);
    });

    socket.on('create_conversation', function(){
        createConversation(socket);
    });

    socket.on('set_topic', function(data){
        setTopic(socket, data);
    });

    socket.on('remove_active_conversations', function(){
        removeActiveUser(socket);
    });

    socket.on('mark_as_read', function(conversationId){
        markAsRead(socket, conversationId);
    });
}

function createConversation(socket) {
    Conversation.create({ topic: '', createdBy: socket.handshake.session.user.name }, 
        function(err, conversation){
            var dataToEmit = { _id: conversation.id, topic: '', createdBy: conversation.createdBy };
            socket.emit('my_new_conversation', dataToEmit);
        }
    );
}

function setTopic(socket, data){
    Conversation.findById(data.id, function(err, conversation){
        if (conversation) {
            conversation.topic = data.topic;
            conversation.save(function(err) {
                var dataToEmit = { _id: conversation.id, topic: conversation.topic, createdBy: conversation.createdBy };
                socket.broadcast.emit('your_new_conversation', dataToEmit);
            });
        }
    });
};

function emit(socket, event, dataToEmit){
    socket.emit(event, dataToEmit);
    socket.broadcast.emit(event, dataToEmit);
}

function addNewActiveConversations(socket, data){
    var userId = socket.handshake.session.user.id;
    active[userId] = data;
};

function removeActiveUser(socket){
    delete active[socket.handshake.session.user.id];
};

function sendMessage(socket, data){
	Conversation.findById(data.conversationId, function(err, conversation){
        var msg = new Message();
        msg.content = data.content;
        msg.user = socket.handshake.session.user;
        msg.timestamp = data.timestamp;
        conversation.messages.push(msg);
        conversation.save(function(err){
            var dataToEmit = {
                content: data.content, 
                user: socket.handshake.session.user, 
                conversationId: data.conversationId,
                timestamp: data.timestamp,
            };

            emit(socket, 'receive_message', dataToEmit);
            saveUnreadMarkers(data.conversationId);
        });
    });
};

function saveUnreadMarkers(conversationId){
    for(var i = 0; i < users.list.length; i++){
        if(!userIsActive(users.list[i]) || !userInConversation(users.list[i], conversationId)){
            UnreadMarker.update({ userId: users.list[i].id, conversationId: conversationId },
                                { $inc: { count: 1 } }, 
                                { upsert: true, multi: true }).exec();
        }
    }
}

function userIsActive(user){
    return active[user.id] !== undefined;
}

function userInConversation(user, conversationId){
    return active[user.id].indexOf(conversationId) > -1;
}

function markAsRead(socket, conversationId){
    UnreadMarker.remove({ conversationId: conversationId, userId: socket.handshake.session.user.id }).exec();
}