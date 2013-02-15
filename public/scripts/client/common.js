var common = {
	enterKeyPressed : function(event) {
	  var keyCode = (event.which ? event.which : event.keyCode);
	  return keyCode === 13;
	},
};