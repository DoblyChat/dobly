
exports.up = function(next){
    var CollaborationObject = require('../lib/models/collaboration_object'),
  	    helper = require('./helper');

	helper.connect(function(){
        execute();
    });

    function execute() {
        CollaborationObject.update({}, { type: 'C' }, { multi: true }, function(err){
	  		helper.logError(err);
	  		helper.disconnect(next);
  		});
    }
};

exports.down = function(next){
  next();
};
