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
        'client/message',
        'client/task'], function(ko, 
                                    createGroup, 
                                    createDesktop, 
                                    createNotifier, 
                                    createNavigationModule, 
                                    createAllConversations,
                                    createConversation,
                                    createTaskList,
                                    createNewCollaborationObject,
                                    createChangeTopic,
                                    createMessage,
                                    createTask){
    'use strict';
    
    return function createViewModel(collaborationObjectsData, desktopData, groupData) {
        var self = {};

        app.topicSearch = ko.observable('');
  
        self.collaborationObjects = ko.observableArray([]);

        self.group = createGroup(groupData);

        var toSubscribe = [];

        function buildCollaborationObject(data){
            return data.type === 'C' ? createConversation(data) : createTaskList(data);
        }

        for(var i = 0; i < collaborationObjectsData.length; i++){
            self.collaborationObjects.push(buildCollaborationObject(collaborationObjectsData[i]));
            toSubscribe.push(collaborationObjectsData[i]._id);
        }

        app.socket.emit('subscribe_to_collaboration_objects', toSubscribe);

        self.desktop = createDesktop(desktopData, self.collaborationObjects());
        self.notifier = createNotifier(self.desktop);
        self.navigation = createNavigationModule(self);
        self.allConversations = createAllConversations(self.desktop, self.navigation, self.collaborationObjects);
        self.newCollaborationObject = createNewCollaborationObject(self.navigation, self.group);
        self.changeTopic = createChangeTopic(self.navigation);

        function buildItemObject(collaborationObjectType, data){
            return collaborationObjectType === 'C' ? createMessage(data, true) : createTask(data);
        }
        
        function findCollaborationObject(data, callback){
            ko.utils.arrayForEach(self.collaborationObjects(), function(collaborationObject){
                if(data.collaborationObjectId === collaborationObject.id){
                    callback(collaborationObject);
                }
            });
        }

        function findItem(data, callback){
            findCollaborationObject(data, function(collaborationObject){
                ko.utils.arrayForEach(collaborationObject.items(), function(item){
                    if(item.id() === data.id){
                        callback(item);
                    }
                });
            });
        }

        app.socket.on('receive_item', function(data) {
            findCollaborationObject(data, function(collaborationObject){
                var itemObj = buildItemObject(collaborationObject.type, data);
                collaborationObject.addItem(itemObj);
                self.notifier.showDeskopNotification(collaborationObject, itemObj.createdBy + ': ' + itemObj.content);
                self.desktop.add(collaborationObject);
            });
        });

        app.socket.on('task_complete_toggled', function(data){
            findItem(data, function(task){
                task.updateCompleteValues(data);
            });
        });

        app.socket.on('task_content_updated', function(data){
            findItem(data, function(task){
                task.setContent(data.content);
            });
        });

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

        app.socket.on('my_new_collaboration_object', function(data) {
            var collaborationObject = buildCollaborationObject(data);
            self.collaborationObjects.push(collaborationObject);
            self.desktop.addAndActivate(collaborationObject);
            self.desktop.ui.scroll.bottomTile();
            collaborationObject.hasFocus(true);
        });

        app.socket.on('new_collaboration_object', function(data){
            var collaborationObject = buildCollaborationObject(data);
            self.collaborationObjects.push(collaborationObject);
            self.desktop.add(collaborationObject); 
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

