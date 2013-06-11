///<reference path="_ref.ts" />
///<reference path="../src/_ref.ts" />
///<reference path="../src/deftools/_ref.ts" />
///<reference path="../src/xm/expose.ts" />

declare var helper:helper;
declare var assert:chai.Assert;

describe('deftools', () => {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	describe('js module', () => {
		var mod;
		before(() => {
			process.env['deftools-expose'] = true;
			mod = require('../build/deftools.js');
		});
		after(() => {
			mod = null;
		});
		it('is defined', () => {
			assert.ok(mod);
		});
		it('exports', () => {
			assert.property(mod, 'deftools');
			assert.property(mod, 'xm');
			assert.property(mod, 'expose');
		});
		describe('exposes', () => {

			var expose:xm.Expose;
			before(() => {
				expose = mod.expose;
				assert.ok(expose);
			});
			after(() => {
				expose = null;
			});

			describe('command', () => {
				var testCommand = (name:string) => {
					it(name, () => {
						assert.isTrue(expose.has(name), 'has() '+name);
					});
				};
				testCommand('help');
				//testCommand('h');
				testCommand('info');
				testCommand('repoList');
				testCommand('repoParse');
				testCommand('tsdList');
				testCommand('compare');
				testCommand('updateTsd');
			});
		});
	});
});
