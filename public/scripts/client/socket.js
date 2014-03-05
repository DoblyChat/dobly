define(['socket-io'], function(io){
	'use strict';

	var maxReconnects = 5;

	var socket = io.connect(window.location.origin, {
        'max reconnection attempts': maxReconnects,
        'sync disconnect on unload': true
	});

	socket.on('reconnect', function(){
		console.log(new Date(), 'reconnect');
	});
	
	socket.on('disconnect', function(){
		console.log(new Date(), 'disconnect');
	});

	socket.on('connect', function(){
		console.log(new Date(), 'connect');
	});

	socket.maxReconnects = maxReconnects;

	return socket;
});