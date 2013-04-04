function createMessage(data, confirmed) {
  var self = {};

  self.lines = formatContent(data.content);
  self.timestamp = common.formatTimestamp(data.timestamp);
  self.createdBy = data.createdBy;
  self.simpleTimestamp = common.formatTimestamp(data.timestamp);
  self.confirmedSent = ko.observable(confirmed);

  function formatContent(content){
    return content.split('\n');
  }

  return self;
}