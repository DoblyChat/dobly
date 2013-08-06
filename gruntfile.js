module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: [
                'gruntfile.js', 
                'public/scripts/client/*.js', 
                'lib/**/*.js',
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
        'jasmine-node': {
            options: { 
                captureExceptions: true,
                forceexit: true
            },
            run: {
                spec: 'specs/server'
            },
            env: { },
            executable: './node_modules/.bin/jasmine-node'
        },
        requirejs: {
            compile: {
                options: {
                    baseUrl: "public/scripts",
                    mainConfigFile: "public/scripts/client/require.config.js",
                    out: "public/scripts/release/main.js",
                    name: 'client/main',
                    preserveLicenseComments: false,
                    paths:{
                        'socket-io': 'empty:'
                    }
                }
            }
        },
        less: {
            production:{
                options: {
                    paths: [ 'public/stylesheets/client' ],
                    yuicompress: true
                },
                files: {
                    'public/stylesheets/release/index.css': 'public/stylesheets/index.less',
                    'public/stylesheets/release/style.css': 'public/stylesheets/style.less',
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'public/stylesheets/release/compiled.css': [
                        'public/stylesheets/lib/normalize.css', 
                        'public/stylesheets/lib/fonts.css',
                        'public/stylesheets/lib/nanoscroller.css',
                        'public/stylesheets/lib/chosen.css'
                    ]
                }
            }
        },
        copy: {
            css: {
                files: [
                    { expand: true, flatten:true, src: ['public/stylesheets/lib/*.png'], dest: 'public/stylesheets/release/', filter: 'isFile' },
                    { expand: true, cwd:'public/stylesheets/lib/webfonts/', src: ['**'], dest: 'public/stylesheets/release/webfonts/' }, 
                ]
            }
        },
        clean: ["public/stylesheets/release/**", "public/scripts/release/**"],
        gitcommit: {
            task: {
                options: {
                    message: 'Commit of built files'
                },
                files: [
                    { src: 'public/scripts/release/main.js' },
                    { src: 'public/stylesheets/release/**' }
                ]
            }
        },
        gitcheckout: {
            task: {
                options: {
                    branch: 'master'
                }
            }
        },
        imagemin: {
            dist: {
                options: {
                    optimizationLevel: 0
                },
                files: {
                    'public/images/logo.png': 'public/images/src/logo.png',
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-contrib-imagemin');

    // To run tests through the browser:
    // 1-grunt connect:test:keepalive
    // 2-point to localhost:8000/_SpecRunner.html
    // 3-if _SpecRunner.html does not exist, run the 'tests-client'
    // task at least once
    grunt.registerTask('tests-client', ['connect', 'jasmine']);
    grunt.registerTask('tests', ['tests-client', 'jasmine-node']);
    grunt.registerTask('check', ['jshint', 'tests']);
    grunt.registerTask('deploy', ['gitcheckout', 'clean', 'requirejs', 'less', 'cssmin', 'copy:css', 'gitcommit']);
};