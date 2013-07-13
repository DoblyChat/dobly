module.exports = function(grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
		  	files: [
		  		'gruntfile.js', 
		  		'public/scripts/client/*.js', 
		  		'models/*.js',
		  		'migrations/*.js',
		  		'routes/*.js',
		  		'security/*.js',
		  		'sockets/*.js',
		  		'specs/server/*.js',
		  		'specs/client/spec/*.js'],
		  	options: {
			    globals: {
			      	jQuery: true,
			      	node: true,
			      	curly: true,
			      	forin: true
			    }
		  	}
		}
	});
	var i = 2 == 2;
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('check', ['jshint']);
};