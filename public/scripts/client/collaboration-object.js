define(['knockout', 'client/socket', 'client/common', 'client/collaboration-object.ui', 'client/group', 'client/data'], 
    function(ko, socket, common, createConversationObjectUi, group, clientData){
    'use strict';
    
    function CollaborationObject(template) {
        this.template = template;
        this.id = 0;
        this.topic = ko.observable();
        this.createdBy = '';
        this.unreadCounter = ko.observable(0);
        this.newItem = ko.observable('');
        this.isLeft = ko.observable(false);
        this.isRight = ko.observable(false);
        this.items = ko.observableArray([]);
        this.active = ko.observable(false);
        this.hasFocus = ko.observable(false);
        this.timestamp = '';
        this.forEntireGroup = false;
        this.ui = createConversationObjectUi();
        this.type = '';
        this.iconClass = '';

        function setProperties(self, data){
            self.id = data._id ? data._id : 0;
            self.topic(data.topic);
            self.createdBy = group.getUserFullName(data.createdById);
            self.unreadCounter(data.unread ? data.unread : 0);
            self.timestamp = common.formatTimestamp(data.timestamp);
            self.type = data.type;
            self.forEntireGroup = data.members.entireGroup;
        }

        this.init = function(data, createItem){
            setProperties(this, data);

            if(data.items) {
                var itemsLength = data.items.length;
                
                for(var i = 0; i < itemsLength; i++) {
                    this.items.push(createItem(data.items[i]));
                }
            }

            var usersArray = [];

            ko.utils.arrayForEach(data.members.users, function(userId) {
                usersArray.push(group.getUserFullName(userId));
            });

            this.users = usersArray.join(', ');
        };

        this.showUnreadCounter = ko.computed(function() {
            return this.unreadCounter() > 0;
        }, this); 

        this.hasFocus.subscribe(function(hasFocus) {
            if (hasFocus) {
                this.markAsRead();
            }
        }, this);

        function isToday(timestampString) {
            var dateStamp = new Date(timestampString).clearTime();
            return dateStamp.equals(Date.today());
        }

        this.lastActivityMessage = ko.computed(function() {
            var itemsLength = this.items().length;
            if (itemsLength > 0) {
                var lastItemTimestamp = this.items()[itemsLength - 1].timestamp();
                var p = isToday(lastItemTimestamp) ? ' at ' : ' on ';
                var t = common.formatSimpleTimestamp(lastItemTimestamp);
                return 'Last activity' + p + t + '.';
            } else {
                return 'No activity.';
            }            
        }, this);
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

    function addNewItem(createObject, sendToServer, object, event){
        this.markAsRead();
        
        if (thereIsANewItem(this) && common.enterKeyPressed(event) && !event.shiftKey) {
            var itemData = getItemData(this);
            var obj = createObject(itemData);
            this.addItem(obj);
            sendToServer(itemData, obj);
            this.newItem('');
            return false;
        } else {
            return true;
        }
    }

    proto.bindAddNewItem = function (createObject, sendToServer) {    
        return addNewItem.bind(this, createObject, sendToServer);
    };

    function emitMarkAsRead(collaborationObject){
        socket.emit('mark_as_read', collaborationObject.id);
    }

    return CollaborationObject;
});
