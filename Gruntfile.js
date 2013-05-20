module.exports = function (grunt) {
	'use strict';

	var path = require('path');
	var util = require('util');

	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-execute');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			build : ['tmp/*.*', 'build'],
			test : ['test/_tmp.*']
		},
		execute: {
			deftools: {
				src: ['build/tsd-deftools.js']
			},
			defdev: {
				src: ['build/tsd-defdev.js']
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
			deftools: {
				src: ['src/tsd-deftools.ts'],
				dest: 'build/tsd-deftools.js'
			},
			defdev: {
				src: ['src/tsd-defdev.ts'],
				dest: 'build/tsd-defdev.js'
			}
		},
		mocha_spawm: {
			options: {
				module: 'commonjs', //or commonjs
				target: 'es5', //or es3
				base_path: 'src/',
				declaration: false,
				sourcemap: false
			},
			deftools: {
				src: ['src/tsd-deftools.ts'],
				dest: 'build/tsd-deftools.js'
			}
		}
	});

	grunt.registerTask('default', ['build']);
	grunt.registerTask('build', ['clean', 'typescript:deftools']);

	grunt.registerTask('dev', ['build', 'execute:deftools']);
	grunt.registerTask('edit_01', ['typescript:defdev', 'execute:defdev']);

};