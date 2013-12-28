define([
        'knockout', 
        'client/group', 
        'client/desktop', 
        'client/navigation', 
        'client/archive', 
        'client/builder', 
        'client/collaboration-object.new', 
        'client/changeTopic',
        'client/events',
        'client/notifications'], function(ko, 
                                    createGroup, 
                                    createDesktop,
                                    createNavigationModule, 
                                    createArchive,
                                    builder,
                                    createNewCollaborationObject,
                                    createChangeTopic, 
                                    events,
                                    createNotifier){
    'use strict';
    
    return function createViewModel(collaborationObjectsData, desktopData, groupData) {
        var self = {};

        app.topicSearch = ko.observable('');
  
        self.collaborationObjects = ko.observableArray([]);

        self.group = createGroup(groupData);

        var toSubscribe = [];

        for(var i = 0; i < collaborationObjectsData.length; i++){
            var obj = builder.collaborationObject(collaborationObjectsData[i], self.group);
            self.collaborationObjects.push(obj);
            toSubscribe.push(collaborationObjectsData[i]._id);
        }

        app.socket.emit('subscribe_to_collaboration_objects', toSubscribe);

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

        self.desktop = createDesktop(desktopData, self.collaborationObjects());
        self.navigation = createNavigationModule(self);
        self.archive = createArchive(self.desktop, self.navigation, self.collaborationObjects);
        self.newCollaborationObject = createNewCollaborationObject(self.navigation, self.group);
        self.changeTopic = createChangeTopic(self.navigation);
        self.notifier = createNotifier(self.desktop);        

        events.register(self);

        self.addNewConversation = function(){
            self.navigation.newCollaborationObject(); 
            self.newCollaborationObject.setup();
        };

        self.cancelNotificationsSetup = function(){
            self.navigation.desktop();
        };

        self.allowNotificationsSetup = function(){
            app.notifier.setup();
            self.navigation.desktop();
        };

        if(self.notifier.needsToAskForPermission()){
            self.navigation.notificationSetup();
        }

        return self;
    };
});

