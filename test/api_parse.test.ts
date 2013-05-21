///<reference path="_ref.ts" />
///<reference path="../src/_ref.ts" />
///<reference path="../src/deftools/_ref.ts" />
///<reference path="../src/deftools/api.ts" />

declare var helper:helper;

declare var assert:chai.Assert;

class MyClass {
	a:number = 1;
	b:number = 2;
}

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
		assert.ok(testConfig);
	});
	it('loads Config.getInfo()', () => {
		info = Config.getInfo();
		assert.ok(testConfig);
		assert.instanceOf(info, deftools.ToolInfo);
	});

	describe('test "' + testId + '"', () => {
		var testDir;
		var conf;
		var stats;
		var paths:deftools.ConfPaths;

		before(() => {
			assert.ok(info);
			assert.property(testConfig, testId);
			conf = testConfig[testId];
			assert.ok(conf);
		});
		describe('config init', () => {
			it('should have test config', () => {
				assert.ok(conf);
			});
			it('should define path', () => {
				assert.ok(conf.path);
				assert.equal(fs.existsSync(conf.path), true);
			});
			it('should define test', () => {
				assert.ok(conf.test);
				assert.equal(fs.existsSync(conf.test), true);
			});
			it('should resolve testdir', () => {
				testDir = path.resolve(conf.test);
				assert.equal(fs.existsSync(testDir), true);
				assert.equal(fs.statSync(testDir).isDirectory(), true);
			});
			it('should load test stats', () => {
				stats = helper.readJSON(testDir, 'fixtures', 'stats.json');
				paths = Config.getPaths(conf.path);
				assert.ok(paths);
			});
			describe('Repos', () => {
				it('should be accept data', () => {
					assert.instanceOf(deftools.Repos, Function);
					var repos = new deftools.Repos(paths.typings, paths.tsd, paths.tmp);
					assert.ok(repos);
				});
			});
		});

		describe('data', () => {
			before(() => {
				assert.ok(conf);
				assert.ok(paths);
				assert.ok(stats);
				helper.dump(stats, 'using stats');
			});
			it('should use valid stats', () => {
				assert.ok(stats);
				assert.property(stats, 'tsd');
				assert.operator(stats.tsd.fileCount, '>', 0);
				assert.property(stats, 'typings');
				assert.operator(stats.typings.fileCount, '>', 0);
			});

			describe('loader loadTsdList', () => {
				var repos;
				var fileList;
				this.timeout(500);

				before(() => {
					repos = new deftools.Repos(paths.typings, paths.tsd, paths.tmp);
					fileList = helper.readJSON(testDir, 'fixtures', 'tsd.filelist.json')
					assert.lengthOf(fileList, stats.tsd.fileCount);
				});
				it('should load content', (done:() => void) => {
					assert.ok(repos);
					deftools.loader.loadTsdList(repos, (err, res:string[]) => {
						assert.ok(!err);
						assert.ok(res);
						assert.lengthOf(res, stats.tsd.fileCount);
						assert.lengthOf(res, fileList.length);
						assert.sameMembers(res, fileList);
						done();
					});
				});
			});
			it('should check deeper', (done:() => void) => {
				assert.deepEqual([[{yo:1,ab:2}]], [[{yo:1,ab:2}]]);
				var f = function Constr(){
					this.a = 1;
					this.b = 2;
				};

				assert.deepEqual({a:1, b:2}, new f());
				assert.deepEqual({a:1, b:2}, new MyClass());
				done();
			});
			describe('loader loadRepoDefList', () => {
				var repos;
				var fileList;
				this.timeout(500);

				before(() => {
					repos = new deftools.Repos(paths.typings, paths.tsd, paths.tmp);
					fileList = helper.readJSON(testDir, 'fixtures', 'typings.filelist.json')
					assert.lengthOf(fileList, stats.typings.fileCount);

				});
				it('should load content', (done:() => void) => {
					deftools.loader.loadRepoDefList(repos, (err, res:deftools.Def[]) => {
						assert.ok(!err);
						assert.ok(res);
						assert.lengthOf(res, stats.typings.fileCount);
						assert.lengthOf(res, fileList.length);

						assert.isArray(res);
						assert.isArray(fileList);

						helper.dump(res, 'res', 4, true);
						helper.dump(fileList, 'fileList', 4, true);
						assert.deepEqual(JSON.parse(JSON.stringify(res)), fileList);

						assert.deepEqual({yo:1}, {yo:1});
						assert.deepEqual(fileList, fileList);
						//assert.deepEqual(res, fileList);

						done();
					});
				});
			});

			describe('API', () => {
				var api;
				it('should be defined', () => {
					assert.ok(deftools.API);
				});
				it('should be constructor', () => {
					assert.instanceOf(deftools.API, Function);
					api = new deftools.API(info, new deftools.Repos(paths.typings, paths.tsd, paths.tmp));
					assert.ok(api);
				});
			});
		});

	});
});