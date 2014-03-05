define(['socket-io'], function(io){
	'use strict';

	var maxReconnects = 5;

	var socket = io.connect(window.location.origin, {
        'max reconnection attempts': maxReconnects,
        'sync disconnect on unload': true
	});

	function bindEvent(event){
		socket.on(event, function(){
			console.log(this.socket.sessionid, new Date(), event);
		});
	}

	bindEvent('reconnect');
	bindEvent('disconnect');
	bindEvent('connect');
	bindEvent('connecting');
	bindEvent('reconnecting');
	bindEvent('error');

	socket.maxReconnects = maxReconnects;

	return socket;
});