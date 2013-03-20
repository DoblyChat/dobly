(function(global){
	global.app = {};

	var maxReconnects = 5;

	global.app.socket = io.connect(global.location.origin, {
		'max reconnection attempts': maxReconnects,
		'sync disconnect on unload': true
	});

	$(document).ready(function() {
		app.user = JSON.parse($('#currentUser').val());
		app.inFocus = true;

		var desktopData = JSON.parse($('#desktop').val());
		var conversationData = JSON.parse($('#conversations').val());
		var groupData = JSON.parse($('#group').val());
		
		var viewModel = createViewModel(conversationData, desktopData, groupData);

		ko.applyBindings(viewModel);

		app.desktop = viewModel.desktop;

		setupDesktopUI();
		showRenderedElements();
		
		startPing();
	});

	function setupDesktopUI(){
		app.desktop.resize.stripAndConvos();
		setupStripDragAndDrop(app.desktop);
	}

	$(global).load(function() {
		app.desktop.resize.tilesAndConversationBodies();
		app.desktop.scroll.setup();
	});

	$(global).resize(function() {
		app.desktop.resize.stripAndConvos();
		app.desktop.resize.tilesAndConversationBodies();
	});

	$(global).focus(function() {
		app.inFocus = true;
	});

	$(global).blur(function() {
		app.inFocus = false;
	});

	function showRenderedElements(){
		$('#spinner').hide();
		$('.top-links').show();
		$('#content').show();
	}

	global.app.socket.on('reconnecting', function(delay, attempt) {
		if (attempt === maxReconnects) {
			timeout();
		}
	});

	function timeout(){
		global.location.href = "http://" + global.location.host + "/timeout";
	}

	function startPing(){
		setInterval(function(){
			global.app.socket.emit('ping');
		}, 2000);

		global.app.socket.on('timeout', function(){
			timeout();
		});
	}
})(window);


