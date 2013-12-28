define(['knockout', 'client/builder'], function(ko, builder){
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

	    	app.socket.on('receive_item', function(data) {
		        findCollaborationObject(data, function(collaborationObject){
		            var itemObj = builder.item(collaborationObject.type, data);
		            collaborationObject.addItem(itemObj);
		            viewModel.notifier.showDesktopNotification(collaborationObject, itemObj.getNotificationText());
		            app.desktop.add(collaborationObject);
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

		    app.socket.on('task_removed', function(data){
		        findItem(data, function(task, collaborationObject){
		            collaborationObject.items.remove(task);
		        });
		    });

		    app.socket.on('task_assigned', function(data){
		        findItem(data, function(task){
		            task.setAssignedTo(data.assignedToId);
		        });
		    });

		    app.socket.on('my_new_collaboration_object', function(data) {
		        var collaborationObject = builder.collaborationObject(data, viewModel.group);
		        viewModel.collaborationObjects.push(collaborationObject);
		        app.desktop.addAndActivate(collaborationObject);
		        app.desktop.ui.scroll.bottomTile();
		        collaborationObject.hasFocus(true);
		    });

		    app.socket.on('new_collaboration_object', function(data){
		        var collaborationObject = builder.collaborationObject(data, viewModel.group);
		        viewModel.collaborationObjects.push(collaborationObject);
		        app.desktop.add(collaborationObject); 
		    });
	    }
    };
});