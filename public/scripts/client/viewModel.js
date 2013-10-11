define([
        'knockout', 
        'client/group', 
        'client/desktop', 
        'client/notifications', 
        'client/navigation', 
        'client/allConversations', 
        'client/conversation', 
        'client/task-list',
        'client/collaboration-object.new', 
        'client/changeTopic',
        'client/message'], function(ko, 
                                    createGroup, 
                                    createDesktop, 
                                    createNotifier, 
                                    createNavigationModule, 
                                    createAllConversations,
                                    createConversation,
                                    createTaskList,
                                    createNewCollaborationObject,
                                    createChangeTopic,
                                    createMessage){
    'use strict';
    
    return function createViewModel(collaborationObjectsData, desktopData, groupData) {
        var self = {};

        app.topicSearch = ko.observable('');
  
        self.collaborationObjects = ko.observableArray([]);

        self.group = createGroup(groupData);

        var toSubscribe = [];

        for(var i = 0; i < collaborationObjectsData.length; i++){
            self.collaborationObjects.push(createConversation(collaborationObjectsData[i]));
            toSubscribe.push(collaborationObjectsData[i]._id);
        }

        app.socket.emit('subscribe_to_collaboration_objects', toSubscribe);

        self.desktop = createDesktop(desktopData, self.collaborationObjects());
        self.notifier = createNotifier(self.desktop);
        self.navigation = createNavigationModule(self);
        self.allConversations = createAllConversations(self.desktop, self.navigation, self.collaborationObjects);
        self.newCollaborationObject = createNewCollaborationObject(self.navigation, self.group);
        self.changeTopic = createChangeTopic(self.navigation);

        app.socket.on('receive_message', function(message) {
            ko.utils.arrayForEach(self.collaborationObjects(), function(conversation){
                if(message.collaborationObjectId === conversation.id){
                    receiveMessage(conversation, message);
                }
            });
        });

        function receiveMessage(conversation, message){
            var messageObj = createMessage(message, true);
            conversation.addItem(messageObj);
            self.notifier.showDeskopNotification(conversation, messageObj.createdBy + ': ' + messageObj.content);
            self.desktop.add(conversation);
        }

        self.unreadCounter = ko.computed(function(){
            var unread = 0;
            ko.utils.arrayForEach(self.collaborationObjects(), function(conversation){
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

        function buildCollaborationObject(data){
            return data.type === 'C' ? createConversation(data, self.group) : createTaskList(data);
        }

        app.socket.on('my_new_collaboration_object', function(data) {
            var collaborationObject = buildCollaborationObject(data);
            self.collaborationObjects.push(collaborationObject);
            self.desktop.addAndActivate(collaborationObject);
            self.desktop.ui.scroll.bottomTile();
            collaborationObject.hasFocus(true);
        });

        app.socket.on('new_collaboration_object', function(data){
            var collaborationObject = buildCollaborationObject(data);
            self.collaborationObjects.push(conversation);
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

