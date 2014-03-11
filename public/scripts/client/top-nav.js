define(function(){
	var elements = document.getElementsByClassName('top-links'),
		links = [], link;

	function hashChange(){
		var hash = window.location.hash;
		
		links.forEach(function(link){
			if(link.hash === hash){
				link.className = 'active';
			}else{
				link.className = '';
			}
		});
	}

	if(elements.length > 0){
		var topLinks = elements[0].childNodes;

		for(var i = 0; i < topLinks.length; i++){
			link = topLinks.item(i);

			if(link.tagName.toLowerCase() === 'a' && link.hash){
				links.push(link);
			}
		}

		window.addEventListener("hashchange", hashChange, false);

		hashChange();
	}
});