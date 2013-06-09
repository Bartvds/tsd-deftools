module.exports = function (grunt) {
	'use strict';

	var path = require('path');
	var util = require('util');

	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-execute');
	grunt.loadNpmTasks('grunt-mocha-test');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			build: ['tmp/*.*', 'build'],
			test: ['test/_tmp.*']
		},
		execute: {
			mod: {
				src: ['build/deftools.js']
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
			mod: {
				src: ['src/deftools.ts'],
				dest: 'build/deftools.js'
			},
			defdev: {
				src: ['src/defdev.ts'],
				dest: 'build/defdev.js'
			},
			test_all: {
				option: {base_path: 'test/'},
				src: ['test/*.test.ts'],
				dest: 'test/_tmp.all.test.js'
			},
			test_api: {
				option: {base_path: 'test/'},
				src: ['test/api*.test.ts'],
				dest: 'test/_tmp.api.test.js'
			},
			test_chai: {
				option: {base_path: 'test/'},
				src: ['test/chai*.test.ts'],
				dest: 'test/_tmp.api.test.js'
			}
		},
		mochaTest: {
			any: {
				src: ['test/*.test.js'],
				options: {
					reporter: 'mocha-unfunk-reporter'
				}
			}
		}
	});

	grunt.registerTask('default', ['build']);
	grunt.registerTask('build', ['clean', 'typescript:mod']); //, 'typescript:mod'

	grunt.registerTask('test', ['build', 'typescript:test_all', 'mochaTest:any']);

	grunt.registerTask('dev', ['typescript:defdev', 'execute:defdev']);

	grunt.registerTask('edit_01', ['clean', 'typescript:test_api', 'mochaTest:any']);
	grunt.registerTask('edit_02', ['clean:test', 'typescript:test_chai', 'mochaTest:any']);

};