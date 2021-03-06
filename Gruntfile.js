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
                jquery: true,
                node: true,
                curly: true,
                forin: true,
                validthis: true,
                smarttabs: true
            }
        },
        plato: {
            client: {
                options: {
                    jshint: false
                },
                files: {
                    'reports/client': ['public/scripts/client/*.js']    
                }
            },
            server: {
                options: {
                    jshint: false
                },
                files: {
                    'reports/server': ['lib/*.js']
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
        jasmine_node: {
            projectRoot: './specs/server',
            requirejs: false,
            forceExit: true,
            useHelpers: true
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
                    'public/stylesheets/release/form.css': 'public/stylesheets/form.less'
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
        imagemin: {
            dist: {
                options: {
                    optimizationLevel: 0
                },
                files: {
                    'public/images/logo.png': 'public/images/src/logo.png',
                }
            }
        },
        watch: {
            client: {
                files: ['public/scripts/client/*.js', 'specs/client/**/*.js'],
                tasks: ['tests-client']
            }
        }
    });

    function isDevelopmentEnvironment() {
        return grunt.file.exists('.env') && grunt.file.read('.env').indexOf('NODE_ENV=development') !== -1;
    }

    if (isDevelopmentEnvironment()) {
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-jasmine');
        grunt.loadNpmTasks('grunt-jasmine-node');
        grunt.loadNpmTasks('grunt-contrib-connect');
        grunt.loadNpmTasks('grunt-plato');
        grunt.loadNpmTasks('grunt-contrib-imagemin');
    }     
    
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-plato');

    // To run tests through the browser:
    // 1-grunt connect:test:keepalive
    // 2-point to localhost:8000/_SpecRunner.html
    // 3-if _SpecRunner.html does not exist, run the 'tests-client'
    // task at least once
    grunt.registerTask('tests-client', ['connect:test', 'jasmine']);
    grunt.registerTask('tests', ['tests-client', 'jasmine_node']);
    grunt.registerTask('check', ['jshint', 'tests']);
    grunt.registerTask('heroku:staging', ['requirejs', 'less', 'cssmin', 'copy:css']);
    grunt.registerTask('heroku:', ['requirejs', 'less', 'cssmin', 'copy:css']);
};