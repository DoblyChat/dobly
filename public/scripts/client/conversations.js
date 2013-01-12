var socket = io.connect(window.location.origin);

$(document).ready(function(){
  var desktopData = JSON.parse($('#desktop').val());
  var conversationData = JSON.parse($('#conversations').val());
  
  var viewModel = createViewModel(conversationData, desktopData);

  ko.applyBindings(viewModel);

  viewModel.desktop.scroll.setup();
  viewModel.desktop.setupSorting();
});

window.onbeforeunload = function() { 
	socket.emit('remove_active_user'); 
};