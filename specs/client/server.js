var connect = require('connect');

connect.createServer(
	connect.static(__dirname)
).listen(3030);

console.log('Web server for client-side jasmine tests is running.');
console.log('To execute tests go to http://localhost:3030/SpecRunner.html');