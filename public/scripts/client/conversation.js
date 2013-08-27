define(['knockout', 'client/common', 'client/message', 'client/conversation.search', 'client/conversation.ui'], function(ko, common, createMessage, createConversationSearch, createConversationUi){
    'use strict';
    
    return function (data, group) {
        var self = {};

        self.template = 'convo-template';
        self.id = data._id ? data._id : 0;
        self.topic = ko.observable(data.topic);
        self.createdBy = ko.observable(data.createdBy);
        self.unreadCounter = ko.observable(data.unread ? data.unread : 0);
        self.newMessage = ko.observable('');
        self.isLeft = ko.observable(false);
        self.isRight = ko.observable(false);
        self.messages = ko.observableArray([]);
        self.active = ko.observable(false);
        self.hasFocus = ko.observable(false);
        self.ui = createConversationUi();
        self.timestamp = common.formatTimestamp(data.timestamp);
        self.search = createConversationSearch(self);
        self.forEntireGroup = data.members.entireGroup;

        if(data.messages) {
            var messagesLength = data.messages.length;
            
            for(var i = 0; i < messagesLength; i++) {
              self.messages.push(createMessage(data.messages[i], true));
          }
        }

        var usersArray = [];

        for(var n = 0; n < data.members.users.length; n++){
            for(var j = 0; j < group.users.length; j++){
                if(data.members.users[n] === group.users[j].id){
                    usersArray.push(group.users[j].name);
                    break;
                }
            }
        }

        self.users = usersArray.join(', ');

        self.lastMessages = ko.computed(function () {
            if(self.messages().length - 2 >= 0) {
                return self.messages.slice(self.messages().length - 2);  
            } else {
                return self.messages();
            }
        });

        self.activateOnTheLeft = function() {
            self.isLeft(true);
            self.isRight(false);
            activate(".list-left");
        };

        self.activateOnTheRight = function() {
            self.isRight(true);
            self.isLeft(false);
            activate(".list-right");
        };

        function activate(convoSelector) {
            self.active(true);

            var getSelector = function getSelector(cssSelector) {
                return convoSelector + ' > ' + cssSelector;
            };

            self.ui.init(getSelector);
        }

        self.deactivate = function() {
            if (self.active()){
                if (self.ui.scroll !== undefined) {
                    self.ui.scroll.stop();
                }

                self.active(false);
                self.isRight(false);
                self.isLeft(false);
            }
        };
      
        function thereIsANewMessage(){
            return self.newMessage().trim() !== '';
        }

        function getMessageData(){
            return { 
                content: self.newMessage(), 
                conversationId: self.id, 
                timestamp: new Date(),
                createdBy: app.user.name
            };
        }

        function sendMessageToServer(messageData, messageObj){
            self.newMessage('');
            app.socket.emit('send_message', messageData, function(message){
                messageObj.confirmedSent(true);
                messageObj.id(message._id);
            });
        }

        self.addMessage = function(messageObj){
            self.messages.push(messageObj);

            if (self.active()) {
                self.ui.scroll.adjust();
                emitMarkAsRead();
            } 

            if (!(app.inFocus && self.hasFocus())) {
                self.unreadCounter(self.unreadCounter() + 1);  
            }
        };

        self.sendMessage = function (conversation, event) {    
            self.markAsRead();
            if (thereIsANewMessage() && common.enterKeyPressed(event) && !event.shiftKey) {
                var messageData = getMessageData();
                var messageObj = createMessage(messageData, false);
                self.addMessage(messageObj);
                sendMessageToServer(messageData, messageObj);
                return false;
            } else {
                return true;
            }
        };

        self.showUnreadCounter = ko.computed(function() {
            return self.unreadCounter() > 0;
        });  

        self.hasFocus.subscribe(function(hasFocus) {
            if (hasFocus) {
                self.markAsRead();
            }
        });

        self.markAsRead = function() {
            if (self.unreadCounter() > 0) {
                self.unreadCounter(0);
                emitMarkAsRead();
            }

            return true;
        };

        function emitMarkAsRead(){
            app.socket.emit('mark_as_read', self.id);
        }

        self.loadingMore = ko.observable(false);

        var nextPage = 1;
        var totalMessages = data.totalMessages || 0;

        self.allMessagesLoaded = function() {
            return totalMessages <= self.messages().length;
        };

        self.scrolled = function(conversation, event){
            if (!self.loadingMore() && event.target.scrollTop - 40 < 0 && !self.allMessagesLoaded()) {
                var originalScrollHeight = event.target.scrollHeight;

                self.page(function(messages) {
                    self.ui.scroll.adjustToOffset(event.target.scrollHeight - originalScrollHeight - 80);            
                    self.loadingMore(false);
                    self.ui.highlightTopMessages(messages.length);
                });

                self.loadingMore(true);
            }
        };

        self.page = function(hook) {
            app.socket.emit('read_next_messages', { page: nextPage, conversationId: self.id }, function(messages){
                ko.utils.arrayForEach(messages, function(message){
                    self.messages.unshift(createMessage(message, true));
                });
                nextPage += 1;

                hook(messages);
            });
        };

        return self;
    };
});
