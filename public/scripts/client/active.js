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

		app.desktop.ui.setup();
		showRenderedElements();
		
		var timeout = createTimeout(maxReconnects, global);
		timeout.startPing();
	});

	$(global).focus(function() {
		app.inFocus = true;
	});

	$(global).blur(function() {
		app.inFocus = false;
	});

	function showRenderedElements(){
		$('#main-timer').hide();
		$('.top-links').show();
		$('#content').show();
		app.desktop.ui.highlight();
	}
})(window);


