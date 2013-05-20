module.exports = function (grunt) {
	'use strict';

	var path = require('path');
	var util = require('util');

	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-execute');
	grunt.loadNpmTasks('grunt-mocha-spawn');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			build : ['tmp/*.*', 'build'],
			test : ['test/_tmp.*']
		},
		execute: {
			cli: {
				src: ['build/deftools-cli.js']
			},
			mod: {
				src: ['build/deftools-module.js']
			},
			defdev: {
				src: ['build/defdev.js']
			}
		},
		typescript: {
			options: {
				module: 'commonjs', //or commonjs
				target: 'es5', //or es3
				base_path: 'src/',
				declaration: false,
				sourcemap: false
			},
			cli: {
				src: ['src/deftools-cli.ts'],
				dest: 'build/deftools-cli.js'
			},
			mod: {
				src: ['src/deftools-module.ts'],
				dest: 'build/deftools-module.js'
			},
			defdev: {
				src: ['src/defdev.ts'],
				dest: 'build/defdev.js'
			},
			test: {
				options: {
					base_path: 'test/'
				},
				src: ['test/*.test.ts'],
				dest: 'test/_tmp.test.js'
			}
		},
		mocha_spawn: {
			all: {
				src:['test/*.test.js'],
				options: {
					reporter: 'mocha-unfunk-reporter'
				}
			}
		}
	});

	grunt.registerTask('default', ['build']);
	grunt.registerTask('build', ['clean:build', 'typescript:cli', 'typescript:mod']);

	grunt.registerTask('test', ['clean:test', 'typescript:test', 'mocha_spawn:all']);

	grunt.registerTask('dev', ['build', 'execute:cli', 'execute:mod']);
	grunt.registerTask('edit_01', ['typescript:defdev', 'execute:defdev']);

};