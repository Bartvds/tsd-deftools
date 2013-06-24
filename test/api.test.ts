///<reference path="_ref.ts" />
///<reference path="../src/_ref.ts" />
///<reference path="../src/deftools/_ref.ts" />
///<reference path="../src/deftools/api.ts" />

declare var helper:helper;
declare var assert:chai.Assert;

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

	describe('api_parse', () => {

		before(() => {
			testConfig = helper.readJSON(path.join(__dirname, 'tool-config.json'));
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
			var sortDefList = function (a, b) {
				if (a.project < b.project) {
					return -1;
				} else if (a.project < b.project) {
					return 1;
				}
				if (a.name < b.name) {
					return -1;
				}
				else if (a.name > b.name) {
					return 1;
				}
				return 0;
			};
			var sortList = function (a, b) {
				if (a < b) {
					return -1;
				} else if (a < b) {
					return 1;
				}
				return 0;
			};

			before(() => {
				assert.ok(info);
				assert.property(testConfig, testId);
				conf = testConfig[testId];
				assert.ok(conf);
			});
			describe('config init', () => {
				it('has test config', () => {
					assert.ok(conf);
				});
				it('defines path', () => {
					assert.ok(conf.path);
					assert.equal(fs.existsSync(conf.path), true);
				});
				it('defines test', () => {
					assert.ok(conf.test);
					assert.equal(fs.existsSync(conf.test), true);
				});
				it('resolves testdir', () => {
					testDir = path.resolve(conf.test);
					assert.equal(fs.existsSync(testDir), true);
					assert.equal(fs.statSync(testDir).isDirectory(), true);
				});
				it('loads test stats', () => {
					stats = helper.readJSON(path.join(testDir, 'fixtures', 'stats.json'));
					paths = Config.getPaths(conf.path);
					assert.ok(paths);
				});
				describe('Repos', () => {
					it('accepts data', () => {
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
				});
				it('uses valid stats', () => {
					assert.ok(stats);
					assert.property(stats, 'tsd');
					assert.operator(stats.tsd.fileCount, '>', 0);
					assert.property(stats, 'typings');
					assert.operator(stats.typings.fileCount, '>', 0);
				});

				describe('ListLoader', () => {
					var loader;
					it('exists', () => {
						assert.ok(deftools.ListLoader);
					});
					it('is a constructor', () => {
						assert.instanceOf(deftools.ListLoader, Function);
						loader = new deftools.ListLoader(new deftools.Repos(paths.typings, paths.tsd, paths.tmp));
						assert.ok(loader);
						assert.ok(loader.repos);
					});
					describe('.loadTsdNames()', () => {
						var fileList;

						before(() => {
							loader = new deftools.ListLoader(new deftools.Repos(paths.typings, paths.tsd, paths.tmp))
							fileList = helper.readJSON(path.join(testDir, 'fixtures', 'tsd.filelist.json'));
							assert.lengthOf(fileList, stats.tsd.fileCount);
							fileList.sort(sortList);
						});
						it('loads content', (done:() => void) => {
							loader.loadTsdNames((err, res:string[]) => {
								assert.ok(!err, '' + err);
								assert.isArray(res, 'res');
								assert.lengthOf(res, stats.tsd.fileCount);
								assert.lengthOf(res, fileList.length);
								res.sort(sortList);
								assert.sameMembers(res, fileList);
								done();
							});
						});
					});
					describe('.loadRepoProjectDefs()', () => {
						var defList;
						before(() => {
							loader = new deftools.ListLoader(new deftools.Repos(paths.typings, paths.tsd, paths.tmp))
							assert.operator(0, '<', stats.typings.linq.fileCount);
							assert.operator(0, '<', stats.typings.jquery.fileCount);
						});
						it('loads content for "jquery"', (done:() => void) => {
							loader.loadRepoProjectDefs('jquery', (err, res:deftools.Def[]) => {
								assert.ok(!err, '' + err);
								assert.isArray(res, 'res');
								assert.lengthOf(res, stats.typings.jquery.fileCount, 'res v jquery');
								done();
							});
						});
						it('loads content for "linq"', (done:() => void) => {
							loader.loadRepoProjectDefs('linq', (err, res:deftools.Def[]) => {
								assert.ok(!err, '' + err);
								assert.isArray(res, 'res');
								assert.lengthOf(res, stats.typings.linq.fileCount, 'res v linq');
								done();
							});
						});
					});
					describe('.loadRepoDefs()', () => {
						var defList;
						before(() => {
							loader = new deftools.ListLoader(new deftools.Repos(paths.typings, paths.tsd, paths.tmp))
							defList = helper.readJSON(path.join(testDir, 'fixtures', 'typings.filelist.json'));
							assert.lengthOf(defList, stats.typings.fileCount);
							defList.sort(sortDefList);
						});
						it('loads content', (done:() => void) => {
							loader.loadRepoDefs((err, res:deftools.Def[]) => {
								assert.ok(!err, '' + err);
								assert.isArray(res, 'res');
								assert.isArray(defList, 'res');
								assert.lengthOf(res, stats.typings.fileCount, 'res v fileCount');
								assert.lengthOf(res, defList.length, 'res v defList');
								res.sort(sortDefList);
								assert.jsonOf(defList, res, 'fileList v res');
								done();
							});
						});
					});
				});

				//skip for now
				describe('Parser', () => {
					var data:helper.HeaderAssert[];
					var filter;// = ['async', 'expect.js'];

					before((done:(err?) => void) => {
						helper.loadHeaderFixtures(path.join(conf.test, 'headers'), (err, res:helper.HeaderAssert[]) => {
							if (err){
								return done(err);
							}
							try {
								assert.operator(res.length, '>', 0);
							}
							catch (e) {
								done(e);
							}
							data = res;

							if (filter) {
								data = _.filter(data, (value:helper.HeaderAssert) => {
									return filter.indexOf(value.name) > -1;
								});
							}

							done();
						});
					});

					describe('loop', () => {

						before(() => {

						});

						it('data ok', () => {
							assert.operator(data.length, '>', 0, 'data.length');
						});

						it('parse test data', (done:() => void) => {
							_.each(data, (def:helper.HeaderAssert) => {
								assert.ok(def, def.key + ' ok');

								var data = new deftools.DefData(def.def);
								var parser = new deftools.HeaderParser(false);
								parser.parse(data, def.header);

								_.each(def.fields.parsed, (value:any, field:string) => {
									assert.strictEqual(data[field], value, def.key + ' .' + field);
								});
							});

							done();
						});
					});

				});

				describe('API', () => {
					var api;
					it('is defined', () => {
						assert.ok(deftools.API);
					});
					it('is a constructor', () => {
						assert.instanceOf(deftools.API, Function);
						api = new deftools.API(info, new deftools.Repos(paths.typings, paths.tsd, paths.tmp));
						assert.ok(api);
					});
					describe('.loadTsdList()', () => {
						var repos;
						var fileList;
						this.timeout(500);

						before(() => {
							fileList = helper.readJSON(path.join(testDir, 'fixtures', 'tsd.filelist.json'));
							assert.lengthOf(fileList, stats.tsd.fileCount);

							fileList.sort(sortList);
						});
						it('loads content', (done:() => void) => {
							api.loadTsdNames((err, res:string[]) => {
								assert.ok(!err, '' + err);
								assert.isArray(res, 'res');
								assert.lengthOf(res, stats.tsd.fileCount, 'res v fileCount');
								assert.lengthOf(res, fileList.length, 'res v defList');
								res.sort(sortList);
								assert.sameMembers(res, fileList);
								done();
							});
						});
					});
					describe('.loadRepoDefList()', () => {
						var repos;
						var defList;
						this.timeout(500);

						before(() => {
							defList = helper.readJSON(path.join(testDir, 'fixtures', 'typings.filelist.json'));
							assert.lengthOf(defList, stats.typings.fileCount);
							defList.sort(sortDefList);
						});
						it('loads content', (done:() => void) => {
							api.loadRepoDefs((err, res:deftools.Def[]) => {
								assert.ok(!err, '' + err);
								assert.isArray(res, 'res');
								assert.isArray(defList, 'defList');
								assert.lengthOf(res, stats.typings.fileCount, 'res v fileCount');
								assert.lengthOf(res, defList.length, 'res v defList');
								res.sort(sortDefList);
								assert.jsonOf(defList, res, 'fileList v res');
								done();
							});
						});
					});
				});
			});
		});
	});
});
