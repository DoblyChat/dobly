module.exports = function(grunt){
	var srcFiles = []
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
		},
		connect: {
		    test : {
		      	port : 8000
			}
		},
		jasmine: {
		    taskName: {
		      	src: [
		      		'public/scripts/client/allConversations.js',
		      		'public/scripts/client/changeTopic.js',
		      		'public/scripts/client/common.js',
		      		'public/scripts/client/conversation.js',
		      		'public/scripts/client/conversation.search.js',
		      		'public/scripts/client/conversation.ui.js',
		      		'public/scripts/client/desktop.js',
		      		'public/scripts/client/desktop.ui.js',
		      		'public/scripts/client/group.js',
		      		'public/scripts/client/message.js',
		      		'public/scripts/client/navigation.js',
		      		'public/scripts/client/newConversation.js',
		      		'public/scripts/client/notifications.js',
		      		'public/scripts/client/timeout.js',
		      		'public/scripts/client/viewModel.js',
		      	],
			    options: {
				    specs: 'specs/client/spec/*.spec.js',
				    host: 'http://127.0.0.1:8000/',
				    helpers: ['specs/client/lib/jasmine-jquery.js', 'specs/client/helpers.js'],
				    template: require('grunt-template-jasmine-requirejs'),
				    templateOptions: {
			          	requireConfigFile: 'specs/client/require.config.js'
			        },
			        keepRunner: true
		      	}
		    }
		},
		"jasmine-node": {
		    options: { 
		    	captureExceptions: true,
		    	forceexit: true
		    },
		    run: {
		      	spec: 'specs/server'
		    },
		    env: { },
		    executable: './node_modules/.bin/jasmine-node'
		}
	});


	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-jasmine-node');
	grunt.loadNpmTasks('grunt-contrib-connect');

	// To run tests through the browser:
	// 1-grunt connect:test:keepalive
	// 2-point to localhost:8000/_SpecRunner.html
	// 3-if _SpecRunner.html does not exist, run the 'tests-client'
	// task at least once
	grunt.registerTask('tests', ['connect', 'jasmine', 'jasmine-node']);
	grunt.registerTask('check', ['jshint', 'tests']);
};