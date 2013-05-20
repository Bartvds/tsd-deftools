///<reference path="_ref.ts" />
///<reference path="../src/deftools/header.ts" />
///<reference path="../src/deftools/_ref.ts" />
///<reference path="../src/deftools/api.ts" />


describe('deftools.API', () => {
	it('should be defined', () => {
		expect(deftools.API).to.be.ok();
	});

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var Config = deftools.Config;
	var Repos = deftools.Repos;
/*
	var info = Config.getInfo();
	var repos = '';
	var app:deftools.API = new deftools.API(info, new Repos(paths.local, paths.tsd, paths.tmp));


	describe('should be a constructor', () => {
		it('should be defined', () => {
			expect(deftools.API).to.be.ok();
		});

	});*/
});