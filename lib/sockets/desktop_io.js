'use strict';

module.exports = (function (){
    var Desktop = require('../models/desktop'),
        self = {};

    self.addCollaborationObject = function(data){
        Desktop.addCollaborationObject(data.id, data.collaborationObjectId, function(err){
            if(err) {
                console.error('Desktop error adding collaboration object', err);
            }
        });
    };

    self.removeCollaborationObject = function(data){
        Desktop.removeCollaborationObject(data.id, data.collaborationObjectId, function(err){
            if(err) {
                console.error('Desktop error removing collaboration object', err);
            }
        });
    };

    self.updateStripOrder = function(data){
        Desktop.findById(data.id, function(err, desktop){
            if(err){
                console.error('Desktop update error: find', err);
            }else{
                desktop.moveCollaborationObject(data.currentSort.startIndex, data.currentSort.stopIndex, function(err){
                    if(err) {
                        console.error('Desktop error updating strip order', err);
                    }
                });
            }
        });
    };

    return self; 
})();