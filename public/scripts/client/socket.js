define(['socket-io'], function(io){
	var maxReconnects = 5;

	var socket = io.connect(window.location.origin, {
        'max reconnection attempts': maxReconnects,
        'sync disconnect on unload': true
	});

	socket.maxReconnects = maxReconnects;

	return socket;
});