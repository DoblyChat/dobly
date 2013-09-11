define([
        'knockout', 
        'client/group', 
        'client/desktop', 
        'client/notifications', 
        'client/navigation', 
        'client/allConversations', 
        'client/conversation', 
        'client/collaborationObject.new', 
        'client/changeTopic',
        'client/message'], function(ko, 
                                    createGroup, 
                                    createDesktop, 
                                    createNotifier, 
                                    createNavigationModule, 
                                    createAllConversations,
                                    createConversation,
                                    createNewCollaborationObject,
                                    createChangeTopic,
                                    createMessage){
    'use strict';
    
    return function createViewModel(conversationsData, desktopData, groupData) {
        var self = {};

        app.topicSearch = ko.observable('');
  
        self.conversations = ko.observableArray([]);

        self.group = createGroup(groupData);

        var toSubscribe = [];

        for(var i = 0; i < conversationsData.length; i++){
            self.conversations.push(createConversation(conversationsData[i]));
            toSubscribe.push(conversationsData[i]._id);
        }

        app.socket.emit('subscribe_to_collaboration_objects', toSubscribe);

        self.desktop = createDesktop(desktopData, self.conversations());
        self.notifier = createNotifier(self.desktop);
        self.navigation = createNavigationModule(self);
        self.allConversations = createAllConversations(self.desktop, self.navigation, self.conversations);
        self.newCollaborationObject = createNewCollaborationObject(self.navigation, self.group);
        self.changeTopic = createChangeTopic(self.navigation);

        app.socket.on('receive_message', function(message) {
            ko.utils.arrayForEach(self.conversations(), function(conversation){
                if(message.conversationId === conversation.id){
                    receiveMessage(conversation, message);
                }
            });
        });

        function receiveMessage(conversation, message){
            var messageObj = createMessage(message, true);
            conversation.addMessage(messageObj);
            self.notifier.showDeskopNotification(conversation, message.createdBy + ': ' + message.content);
            self.desktop.add(conversation);
        }

        self.unreadCounter = ko.computed(function(){
            var unread = 0;
            ko.utils.arrayForEach(self.conversations(), function(conversation){
                unread += conversation.unreadCounter();
            });

            return unread;
        });

        self.unreadCounter.subscribe(function(unread){
            self.notifier.updateTitle(unread);
        });

        self.hasUnread = ko.computed(function(){
            return self.unreadCounter() > 0;
        });

        app.socket.on('my_new_collaboration_object', function(data) {
            var conversation = createConversation(data, self.group);
            self.conversations.push(conversation);
            self.desktop.addAndActivate(conversation);
            self.desktop.ui.scroll.bottomTile();
            conversation.hasFocus(true);
        });

        app.socket.on('new_collaboration_object', function(data){
            var conversation = createConversation(data, self.group);
            self.conversations.push(conversation);
            self.desktop.add(conversation); 
        });

        self.addNewConversation = function(){
            self.navigation.newCollaborationObject(); 
            self.newCollaborationObject.setup();
        };

        if(self.notifier.needsToAskForPermission()){
            self.navigation.notificationSetup();
        }

        self.cancelNotificationsSetup = function(){
            self.navigation.desktop();
        };

        self.allowNotificationsSetup = function(){
            self.notifier.setup();
            self.navigation.desktop();
        };

        return self;
    };
});

