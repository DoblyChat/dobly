define(['knockout', 'client/desktop.ui'], function(ko, createDesktopUi){
    'use strict';
    
    return function (data, allCollaborationObjects){
        var self = {};

        self.id = data._id;

        self.collaborationObjects = ko.observableArray([]);
        self.renderedCollaborationObjects = ko.observableArray([]);
        self.leftCollaborationObject = ko.observable(null);
        self.rightCollaborationObject = ko.observable(null);
        self.loading = ko.observable(false);
        self.ui = createDesktopUi(self);

        for(var i = 0; i < data.collaborationObjects.length; i++){
            var collaborationObject = getCollaborationObject(data.collaborationObjects[i]);
            if(collaborationObject){
                self.collaborationObjects.push(collaborationObject);
            }
        }

        function getCollaborationObject(id){
            for(var c = 0; c < allCollaborationObjects.length; c++){
                if(allCollaborationObjects[c].id == id){
                    return allCollaborationObjects[c];
                }
            }
        }

        self.hasLeftCollaborationObject = ko.computed(function(){
            return self.leftCollaborationObject() !== null;
        });

        self.hasRightCollaborationObject = ko.computed(function(){
            return self.rightCollaborationObject() !== null;
        });

        function hasCollaborationObject(collaborationObject){
            return self.collaborationObjects.indexOf(collaborationObject) >= 0;
        }

        self.add = function(collaborationObject){
            if(!hasCollaborationObject(collaborationObject)){
                self.persistNewCollaborationObject(collaborationObject);
                self.collaborationObjects.push(collaborationObject);
                self.ui.scroll.tiles();
                //self.ui.resize.tiles();
                //self.ui.setupStripDragAndDrop();

                if (!self.hasLeftCollaborationObject() || !self.hasRightCollaborationObject()) {
                    activateLastCollaborationObject();
                }
            }
        };

        function activateLastCollaborationObject() {
            if (!self.hasLeftCollaborationObject()) {
                activateLeftCollaborationObjectBy(self.collaborationObjects().length - 1);
            } 
            else if (!self.hasRightCollaborationObject()) {
                activateRightCollaborationObjectBy(self.collaborationObjects().length - 1);
            }
            self.ui.updateCollaborationObjectUi();
        }
        
        self.persistNewCollaborationObject = function(collaborationObject) {
            app.socket.emit('add_to_desktop', { id: self.id, collaborationObjectId: collaborationObject.id });
        };

        self.addAndActivate = function(collaborationObject) {
            self.add(collaborationObject);
            self.activate(collaborationObject);
        };

        self.remove = function(collaborationObject) {
            app.socket.emit('remove_from_desktop', { id: self.id, collaborationObjectId: collaborationObject.id });
            var index = self.collaborationObjects.indexOf(collaborationObject);
            self.collaborationObjects.splice(index, 1);
            if(collaborationObject.active()) {
                removeActive(collaborationObject, index);
            }

            self.ui.scroll.tiles();
        };

        function removeActive(collaborationObject, index) {
            collaborationObject.deactivate();

            if (isLeft(collaborationObject)) {
                activateLeftCollaborationObjectBy(index);      
                activateRightCollaborationObjectBy(index + 1);
            }
            else if (isRight(collaborationObject)) {
                activateRightCollaborationObjectBy(index);
            }
            self.ui.updateCollaborationObjectUi();
        }

        function activateLeftCollaborationObjectBy(index) {
            self.leftCollaborationObject(getCollaborationObjectAt(index));
            if (self.hasLeftCollaborationObject()) {
                renderCollaborationObjectIfNeeded(self.leftCollaborationObject());
                self.leftCollaborationObject().activateOnTheLeft();
            }
        }

        function activateRightCollaborationObjectBy(index) {
            self.rightCollaborationObject(getCollaborationObjectAt(index));
            if (self.hasRightCollaborationObject()) {
                renderCollaborationObjectIfNeeded(self.rightCollaborationObject());
                self.rightCollaborationObject().activateOnTheRight();
            }
        }

        function renderCollaborationObjectIfNeeded(collaborationObject) {
            if (self.renderedCollaborationObjects.indexOf(collaborationObject) <= -1) {
                self.renderedCollaborationObjects.push(collaborationObject);
            }
        }

        function getCollaborationObjectAt(index){
            if (index >= self.collaborationObjects().length) {
                return null;
            } else {
                return self.collaborationObjects()[index];
            }
        }

        function isRight(collaborationObject) {
            return collaborationObject === self.rightCollaborationObject();
        }

        function isLeft(collaborationObject) {
            return collaborationObject === self.leftCollaborationObject();
        }

        self.activate = function(collaborationObject) {
            var index = self.collaborationObjects.indexOf(collaborationObject);
            var leftIndex = self.collaborationObjects.indexOf(self.leftCollaborationObject());

            if (index !== leftIndex) {
                self.loading(true);
                setTimeout(function() { self.changeActiveCollaborationObjects(index); }, 0);
            }
        };

        self.changeActiveCollaborationObjects = function(leftIndex) {
            deactivateCollaborationObjects();
            activateLeftCollaborationObjectBy(leftIndex);
            activateRightCollaborationObjectBy(leftIndex + 1);
            self.loading(false);
            self.ui.updateCollaborationObjectUi();
            setTimeout(function(){ self.leftCollaborationObject().hasFocus(true); }, 400);
        };

        function deactivateCollaborationObjects(){
            ko.utils.arrayForEach(self.collaborationObjects(), function(collaborationObject){
                collaborationObject.deactivate();
                collaborationObject.hasFocus(false);
            });
        }

        activateLeftCollaborationObjectBy(0);
        activateRightCollaborationObjectBy(1);

        return self;
    };
});

