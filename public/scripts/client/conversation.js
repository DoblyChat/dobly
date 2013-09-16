define(['knockout', 'client/common', 'client/collaboration-object', 'client/message', 'client/conversation.search', 'client/conversation.ui'], function(ko, common, createCollaborationObject, createMessage, createConversationSearch, createConversationUi){
    'use strict';
    
    return function (data) {
        var self = createCollaborationObject(data, 'convo-template');

        self.ui = createConversationUi();
        
        self.init(function(itemData){
            return createMessage(itemData, true);
        });

        self.search = createConversationSearch(self);

        self.lastMessages = ko.computed(function () {
            if(self.items().length - 2 >= 0) {
                return self.items.slice(self.items().length - 2);  
            } else {
                return self.items();
            }
        });

        function sendMessageToServer(messageData, messageObj){
            self.newItem('');
            app.socket.emit('send_message', messageData, function(message){
                messageObj.confirmedSent(true);
                messageObj.id(message._id);
            });
        }

        function createItem(itemData){
            return createMessage(itemData, false);
        }

        self.sendMessage = self.addNewItem(createItem, sendMessageToServer);
        self.loadingMore = ko.observable(false);

        var nextPage = 1;
        var totalMessages = data.totalMessages || 0;

        self.allMessagesLoaded = function() {
            return totalMessages <= self.items().length;
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
                    self.items.unshift(createMessage(message, true));
                });
                nextPage += 1;

                hook(messages);
            });
        };

        return self;
    };
});
