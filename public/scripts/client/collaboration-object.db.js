define(['client/data', 'client/builder'], function(data, builder){
	var self = {};

	var collaborationObjects = [];

	for(var i = 0; i < data.collaborationObjects.length; i++){
        var obj = builder.collaborationObject(data.collaborationObjects[i]);
        collaborationObjects.push(obj);
    }

    self.getCollaborationObjects = function(){
    	return collaborationObjects;
    };

    self.addCollaborationObject = function(data){
        var obj = builder.collaborationObject(data);
    	collaborationObjects.push(obj);

        return obj;
    };

    return self;
});