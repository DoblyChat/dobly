define(function(){
	'use strict';
	
	function readJson(id){
		return JSON.parse(document.getElementById(id).value);
	}

	return {
		currentUser: readJson('currentUser'),
		desktop: readJson('desktop'),
		collaborationObjects: readJson('collaborationObjects'),
		group: readJson('group')
	};
});