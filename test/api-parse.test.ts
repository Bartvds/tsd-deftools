///<reference path="_ref.ts" />
///<reference path="../src/deftools/header.ts" />
///<reference path="../src/deftools/_ref.ts" />
///<reference path="../src/deftools/api.ts" />


describe('deftools', () => {
	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	var info;
	var testConfig;
	var testId = 'local';
	var Config = deftools.Config;

	before(() => {
		testConfig = helper.readJSON(__dirname, 'tool-config.json');
		expect(testConfig).to.be.ok();
	});
	it('loads Config.getInfo()', () => {
		info = Config.getInfo();
		expect(info).to.be.ok();
		expect(info).to.be.a(deftools.ToolInfo);
	});

	describe('test "' + testId + '"', () => {

		var testDir;
		var conf;
		var stats;
		var paths:deftools.ConfPaths;

		before(() => {
			expect(info).to.be.ok();
			expect(testConfig).to.have.property(testId);
			conf = testConfig[testId];
			expect(conf).to.be.ok();
		});

		describe('config init', () => {
			it('should have test config', () => {
				expect(conf).to.be.ok();
			});
			it('should define path', () => {
				expect(conf.path).to.be.ok();
				expect(fs.existsSync(conf.path)).to.equal(true);
			});
			it('should define test', () => {
				expect(conf.test).to.be.ok();
				expect(fs.existsSync(conf.test)).to.equal(true);
			});
			it('should resolve testdir', () => {
				testDir = path.resolve(conf.test);
				expect(fs.existsSync(testDir)).to.equal(true);
				expect(fs.statSync(testDir).isDirectory()).to.equal(true);
			});

			it('should load test stats', () => {
				stats = helper.readJSON(testDir, 'stats.json');
				paths = Config.getPaths(conf.path);
				expect(paths).to.be.ok();
			});

			it('uses valid stats', () => {
				expect(stats).to.be.ok();
				expect(stats).to.have.own.property('tsd');
				expect(stats.tsd).to.have.own.property('fileCount');
				expect(stats.tsd.fileCount).to.be.above(0);
			});

			describe('Repos', () => {
				it('should be accept data', () => {
					expect(deftools.Repos).to.be.a(Function);
					var repos = new deftools.Repos(paths.typings, paths.tsd, paths.tmp);
					expect(repos).to.be.ok();
				});
			});
		});

		describe('data', () => {
			before(() => {
				expect(conf).to.be.ok();
				expect(paths).to.be.ok();
				expect(stats).to.be.ok();
			});

			describe('loader loadTsdList', () => {
				var repos;
				var fileList;
				before(() => {
					repos = new deftools.Repos(paths.typings, paths.tsd, paths.tmp);
					fileList = helper.readJSON(testDir, 'fixtures', 'tsd.filelist.json')
					expect(fileList).to.have.length(stats.tsd.fileCount);
				});
				it('should load content', (done:() => void) => {
					expect(repos).to.be.ok();

					deftools.loader.loadTsdList(repos, (err, res:string[]) => {
						expect(err).not.to.be.ok();
						expect(res).to.be.ok();
						expect(res).to.have.length(stats.tsd.fileCount);
						expect(res).to.have.length(fileList.length);
						expect(res).to.have.equal(fileList);
						done();
					});
				});
			});

			describe('loader loadTsdList', () => {
				var repos;
				before(() => {
					repos = new deftools.Repos(paths.typings, paths.tsd, paths.tmp);
				});
				it('should load content', (done:() => void) => {
					expect(repos).to.be.ok();

					deftools.loader.loadTsdList(repos, (err, res:string[]) => {
						expect(err).not.to.be.ok();
						expect(res).to.be.ok();
						expect(res).to.have.length(stats.tsd.fileCount);
						done();
					});
				});
			});

			describe('API', () => {
				var api;
				it('should be defined', () => {
					expect(deftools.API).to.be.ok();
				});
				it('should be constructor', () => {
					expect(deftools.API).to.be.a(Function);
					api = new deftools.API(info, new deftools.Repos(paths.typings, paths.tsd, paths.tmp));
					expect(api).to.be.ok();
				});
			});
		});

	});
});