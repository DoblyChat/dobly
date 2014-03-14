define(['knockout', 'client/socket', 'client/builder'], function(ko, socket, builder){
    'use strict';

    var self = {};

    return {
        register: function(viewModel){
            function findCollaborationObject(data, callback){
                ko.utils.arrayForEach(viewModel.collaborationObjects(), function(collaborationObject){
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
                    viewModel.notifier.showDesktopNotification(collaborationObject, itemObj.getNotificationText());
                    app.desktop.add(collaborationObject);
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

            socket.on('my_new_collaboration_object', function(data) {
                var collaborationObject = builder.collaborationObject(data);
                viewModel.collaborationObjects.push(collaborationObject);
                app.desktop.addAndActivate(collaborationObject);
                app.desktop.ui.scroll.bottomTile();
                collaborationObject.hasFocus(true);
            });

            socket.on('new_collaboration_object', function(data){
                var collaborationObject = builder.collaborationObject(data);
                viewModel.collaborationObjects.push(collaborationObject);
                app.desktop.add(collaborationObject); 
            });
        }
    };
});