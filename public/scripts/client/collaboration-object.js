define(['knockout', 'client/socket', 'client/common', 'client/collaboration-object.ui', 'client/group', 'client/data'], 
    function(ko, socket, common, createConversationObjectUi, group, clientData){
    'use strict';
    
    function CollaborationObject(data, template) {
        var self = this;

        self.template = template;
        self.id = data._id ? data._id : 0;
        self.topic = ko.observable(data.topic);
        self.createdBy = group.getUserFullName(data.createdById);
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
        self.iconClass = '';

        self.init = function(createItem){
            if(data.items) {
                var itemsLength = data.items.length;
                
                for(var i = 0; i < itemsLength; i++) {
                    self.items.push(createItem(data.items[i]));
                }
            }

            var usersArray = [];

            ko.utils.arrayForEach(data.members.users, function(userId) {
                usersArray.push(group.getUserFullName(userId));
            });

            self.users = usersArray.join(', ');
        };

        self.showUnreadCounter = ko.computed(function() {
            return self.unreadCounter() > 0;
        }); 

        self.hasFocus.subscribe(function(hasFocus) {
            if (hasFocus) {
                self.markAsRead();
            }
        });

        function isToday(timestampString) {
            var dateStamp = new Date(timestampString).clearTime();
            return dateStamp.equals(Date.today());
        }

        self.lastActivityMessage = ko.computed(function() {
            var itemsLength = self.items().length;
            if (itemsLength > 0) {
                var lastItemTimestamp = self.items()[itemsLength - 1].timestamp();
                var p = isToday(lastItemTimestamp) ? ' at ' : ' on ';
                var t = common.formatSimpleTimestamp(lastItemTimestamp);
                return 'Last activity' + p + t + '.';
            } else {
                return 'No activity.';
            }            
        });
    };

    var proto = CollaborationObject.prototype;

    proto.activateOnTheLeft = function() {
        this.isLeft(true);
        this.isRight(false);
        activate(this, ".collaboration-object-left");
    };

    proto.activateOnTheRight = function() {
        this.isRight(true);
        this.isLeft(false);
        activate(this, ".collaboration-object-right");
    };

    function activate(collaborationObject, convoSelector) {
        collaborationObject.active(true);

        var getSelector = function getSelector(cssSelector) {
            return convoSelector + ' > ' + cssSelector;
        };

        collaborationObject.ui.init(getSelector);
    }

    proto.deactivate = function() {
        if (this.active()){
            if (this.ui.scroll !== undefined) {
                this.ui.scroll.stop();
            }

            this.active(false);
            this.isRight(false);
            this.isLeft(false);
        }
    };

    proto.addItem = function(itemObj){
        this.items.push(itemObj);

        if (this.active()) {
            this.ui.scroll.adjust();
            emitMarkAsRead(this);
        } 

        if (!(app.inFocus && this.hasFocus())) {
            this.unreadCounter(this.unreadCounter() + 1);  
        }
    };

    function thereIsANewItem(collaborationObject){
        return collaborationObject.newItem().trim() !== '';
    }

    function getItemData(collaborationObject){
        return { 
            content: collaborationObject.newItem(), 
            collaborationObjectId: collaborationObject.id, 
            createdById: clientData.currentUser._id
        };
    }

    proto.markAsRead = function() {
        if (this.unreadCounter() > 0) {
            this.unreadCounter(0);
            emitMarkAsRead(this);
        }

        return true;
    };

    proto.addNewItem = function (createObject, sendToServer) {    
        var self = this;

        return function(object, event){
            self.markAsRead();
            
            if (thereIsANewItem(self) && common.enterKeyPressed(event) && !event.shiftKey) {
                var itemData = getItemData(self);
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

    function emitMarkAsRead(collaborationObject){
        socket.emit('mark_as_read', collaborationObject.id);
    }

    return CollaborationObject;
});
