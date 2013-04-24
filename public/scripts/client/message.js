function createMessage(data, confirmed) {
  var self = {};

  self.content = formatContent(data.content);
  self.timestamp = common.formatTimestamp(data.timestamp);
  self.createdBy = data.createdBy;
  self.simpleTimestamp = common.formatTimestamp(data.timestamp);
  self.confirmedSent = ko.observable(confirmed);

  function formatContent(content){
    var lines = content.split('\n');
    
    for(var i = 0; i < lines.length; i++){
      lines[i] = common.htmlEncode(lines[i]);
    }

    return parseLinks(lines.join('<br />'));
  }

  function parseLinks(content){
    var exp = /(\b(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$])/ig; 
    return content.replace(exp,'<a href="$1" target="_blank">$1</a>'); 
  }

  return self;
}