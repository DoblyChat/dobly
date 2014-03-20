define([
        'knockout',
        'client/socket',
        'client/collaboration-object', 
        'client/message', 
        'client/conversation.search', 
        'client/conversation.ui'
    ], 
        function(ko,
                socket,
                CollaborationObject, 
                Message, 
                createConversationSearch, 
                createConversationUi){

    'use strict';


    function createItem(itemData){
        return new Message(itemData, false);
    }

    function sendMessageToServer(messageData, messageObj){
        socket.emit('send_message', messageData, function(message){
            messageObj.timestamp(message.timestamp);
            messageObj.confirmedSent(true);
            messageObj.id(message._id);
        });
    }

    function Conversation(data) {
        var self = this;

        CollaborationObject.call(self, data, 'convo-template');
        self.ui = createConversationUi(self.ui);
        
        self.init(data, function(itemData){
            return new Message(itemData, true);
        });

        self.search = createConversationSearch(self);

        self.sendMessage = self.bindAddNewItem(createItem, sendMessageToServer);
        self.loadingMore = ko.observable(false);

        this.nextPage = 1;
        this.totalMessages = data.totalMessages || 0;
    }

    function Surrogate() {}
 
    function extend(base, sub) {
        Surrogate.prototype = base.prototype;
        sub.prototype = new Surrogate();
        sub.prototype.constructor = sub;
    }

    extend(CollaborationObject, Conversation);

    Conversation.prototype.lastMessages = function () {
        if(this.items().length - 2 >= 0) {
            return this.items.slice(this.items().length - 2);  
        } else {
            return this.items();
        }
    };

    Conversation.prototype.allMessagesLoaded = function() {
        return this.totalMessages <= this.items().length;
    };

    Conversation.prototype.scrolled = function(conversation, event){
        if (!this.loadingMore() && event.target.scrollTop - 40 < 0 && !this.allMessagesLoaded()) {
            var originalScrollHeight = event.target.scrollHeight;

            var self = this;

            this.page(function(messages) {
                self.ui.scroll.adjustToOffset(event.target.scrollHeight - originalScrollHeight - 80);            
                self.loadingMore(false);
                self.ui.highlightTopMessages(messages.length);
            });

            this.loadingMore(true);
        }
    };

    Conversation.prototype.page = function(hook) {
        var self = this;

        socket.emit('read_next_messages', { page: this.nextPage, collaborationObjectId: this.id }, function(messages){
            ko.utils.arrayForEach(messages, function(message){
                self.items.unshift(new Message(message, true));
            });

            self.nextPage += 1;

            hook(messages);
        });
    };

    return Conversation;
});
