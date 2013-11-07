define(['knockout', 'client/common', 'client/collaboration-object.ui'], function(ko, common, createConversationObjectUi){
    'use strict';
    
    return function (data, template) {
        var self = {};

        self.template = template;
        self.id = data._id ? data._id : 0;
        self.topic = ko.observable(data.topic);
        self.createdBy = app.groupUsers[data.createdById];
        self.unreadCounter = ko.observable(data.unread ? data.unread : 0);
        self.newItem = ko.observable('');
        self.isLeft = ko.observable(false);
        self.isRight = ko.observable(false);
        self.items = ko.observableArray([]);
        self.active = ko.observable(false);
        self.hasFocus = ko.observable(false);
        self.timestamp = common.formatTimestamp(data.timestamp);
        self.forEntireGroup = data.members.entireGroup;
        self.ui = createConversationObjectUi();
        self.type = data.type;

        self.init = function(createItem){
            if(data.items) {
                var itemsLength = data.items.length;
                
                for(var i = 0; i < itemsLength; i++) {
                    self.items.push(createItem(data.items[i]));
                }
            }

            var usersArray = [];

            ko.utils.arrayForEach(data.members.users, function(userId) {
                usersArray.push(app.groupUsers[userId]);
            });

            self.users = usersArray.join(', ');
        };

        self.activateOnTheLeft = function() {
            self.isLeft(true);
            self.isRight(false);
            activate(".collaboration-object-left");
        };

        self.activateOnTheRight = function() {
            self.isRight(true);
            self.isLeft(false);
            activate(".collaboration-object-right");
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

        self.addItem = function(itemObj){
            self.items.push(itemObj);

            if (self.active()) {
                self.ui.scroll.adjust();
                emitMarkAsRead();
            } 

            if (!(app.inFocus && self.hasFocus())) {
                self.unreadCounter(self.unreadCounter() + 1);  
            }
        };

        function thereIsANewItem(){
            return self.newItem().trim() !== '';
        }

        function getItemData(){
            return { 
                content: self.newItem(), 
                collaborationObjectId: self.id, 
                createdById: app.user._id
            };
        }

        self.addNewItem = function (createObject, sendToServer) {    
            return function(object, event){
                self.markAsRead();
                
                if (thereIsANewItem() && common.enterKeyPressed(event) && !event.shiftKey) {
                    var itemData = getItemData();
                    var obj = createObject(itemData);
                    self.addItem(obj);
                    sendToServer(itemData, obj);
                    self.newItem('');
                    return false;
                } else {
                    return true;
                }
            };
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

        return self;
    };
});
