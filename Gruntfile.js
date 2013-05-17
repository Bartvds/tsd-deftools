module.exports = function (grunt) {
	'use strict';

	var path = require('path');
	var util = require('util');

	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-execute');

	//grunt.loadTasks('tasks');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			build : ['tmp', 'build'],
			test : ['test/_tmp.*'],
			out : ['out/*.*']
		},
		execute: {
			importer: {
				src: ['build/tsdimport.js']
			}
		},
		typescript: {
			importer: {
				options: {
					module: 'commonjs', //or commonjs
					target: 'es5', //or es3
					base_path: 'src/',
					declaration: false,
					sourcemap: false
				},
				src: ['src/tsdimport.ts'],
				dest: 'build/tsdimport.js'
			}
		}
	});

	grunt.registerTask('default', ['build']);
	grunt.registerTask('build', ['clean', 'typescript:importer']);

	grunt.registerTask('dev', ['build', 'execute:importer']);

};