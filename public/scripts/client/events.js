define(['knockout', 'client/socket', 'client/builder', 'client/collaboration-object.db', 'client/notifications', 'client/unread'], 
    function(ko, socket, builder, db, notifications, unread){
    'use strict';

    function findCollaborationObject(data, callback){
        ko.utils.arrayForEach(db.getCollaborationObjects(), function(collaborationObject){
            if(data.collaborationObjectId === collaborationObject.id){
                callback(collaborationObject);
            }
        });
    }

    function findItem(data, callback){
        findCollaborationObject(data, function(collaborationObject){
            ko.utils.arrayForEach(collaborationObject.items(), function(item){
                if(item.id() === data.id){
                    callback(item, collaborationObject);
                }
            });
        });
    }

    socket.on('receive_item', function(data) {
        findCollaborationObject(data, function(collaborationObject){
            var itemObj = builder.item(collaborationObject.type, data);
            collaborationObject.addItem(itemObj);
            notifications.showDesktopNotification(collaborationObject, itemObj.getNotificationText());
            app.desktop.add(collaborationObject);
            unread.update();
        });
    });

    socket.on('task_complete_toggled', function(data){
        findItem(data, function(task){
            task.updateCompleteValues(data);
        });
    });

    socket.on('task_content_updated', function(data){
        findItem(data, function(task){
            task.setContent(data.content);
        });
    });

    socket.on('task_removed', function(data){
        findItem(data, function(task, collaborationObject){
            collaborationObject.items.remove(task);
        });
    });

    socket.on('task_assigned', function(data){
        findItem(data, function(task){
            task.setAssignedTo(data.assignedToId);
        });
    });

    function addCollaborationObject(data){
        var collaborationObject = db.addCollaborationObject(data);
        unread.subscribeToMarkAsRead(collaborationObject);
        return collaborationObject;
    }

    socket.on('my_new_collaboration_object', function(data) {
        var collaborationObject = addCollaborationObject(data);
        app.desktop.addAndActivate(collaborationObject);
        app.desktop.ui.scroll.bottomTile();
        collaborationObject.hasFocus(true);
    });

    socket.on('new_collaboration_object', function(data){
        var collaborationObject = addCollaborationObject(data);
        app.desktop.add(collaborationObject); 
    });
});