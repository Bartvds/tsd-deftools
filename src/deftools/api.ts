///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	export class RecreateResult {
		compareResult:CompareResult;

		importSelection:Def[];
		importResult:ImportResult;

		exportSelection:deftools.DefData[];
		exportResult:ExportResult;

		constructor(public repos:Repos, public options:any) {

		}
	}

	export class API {

		paths:ConfPaths;

		constructor(public info:ToolInfo, public repos:Repos) {
			if (!this.info) throw Error('no info');
			if (!this.repos) throw Error('no repos');
		}

		/**
		 * List files in tsd as name
		 * @param callback
		 */
		loadTsdNames(callback:(err, res:string[]) => void) {
			var loader = new ListLoader(this.repos);
			loader.loadTsdNames(callback)
		}

		/**
		 * List files in repo as Def
		 * @param callback
		 */
		loadRepoDefs(callback:(err, res:Def[]) => void) {
			var loader = new ListLoader(this.repos);
			loader.loadRepoDefs(callback);
		}

		/**
		 * List and compare repo to tsd content
		 * @param callback
		 */
		compare(callback:(err?, res?:CompareResult) => void) {
			var comparer = new DefinitionComparer(this.repos);
			comparer.compare(callback);
		}

		/**
		 * Parse all repo data
		 * @param callback
		 */
		parseAll(callback:(err?, res?:ImportResult) => void) {

			var loader = new ListLoader(this.repos);
			var importer = new DefinitionImporter(this.repos);

			loader.loadRepoDefs((err?, res?:Def[]) => {
				if (err) return callback(err);
				if (!res) return callback('loader.loadRepoDefList returned no result');
				importer.parseDefinitions(res, callback);
			});
		}

		/**
		 * Parse project repo data
		 * @param callback
		 */
		parseProject(project:string, callback:(err?, res?:ImportResult) => void) {

			var loader = new ListLoader(this.repos);
			var importer = new DefinitionImporter(this.repos);

			loader.loadRepoProjectDefs(project, (err?, res?:Def[]) => {
				if (err) return callback(err);
				if (!res) return callback('loader.loadRepoProjectDefs returned no result');
				importer.parseDefinitions(res, callback);
			});
		}

		/**
		 * Recreate all tsd json files from repo data
		 * @param callback
		 */
		updateTsd(options:any, callback:(err?, res?:RecreateResult) => void) {

			options = _.defaults(options || {}, {
				parse: 'all',
				export: 'parsed'
			});

			var ret = new RecreateResult(this.repos, options);

			async.waterfall([(callback:(err) => void) => {
				//why compare? (split this into recreate new/changed/all)
				var comparer = new DefinitionComparer(this.repos);
				comparer.compare(callback);

			}, (compareResult:CompareResult, callback:(err?, res?:ImportResult) => void) => {
				if (!compareResult) return callback('DefinitionComparer.compare returned no result');

				ret.compareResult = compareResult;

				var importer = new DefinitionImporter(this.repos);
				var defs:Def[] = compareResult.repoAll;
				if (options.parse === 'new') {
					defs = compareResult.repoUnlisted;
				}
				ret.importSelection = defs;

				importer.parseDefinitions(defs, callback);

			}, (importResult:ImportResult, callback:(err?, res?:ExportResult) => void) => {
				if (!importResult) return callback('DefinitionImporter.parseDefinitions returned no result');

				ret.importResult = importResult;

				var exporter = new DefinitionExporter(this.repos, this.info);
				helper.removeFilesFromDir(exporter.repos.out, (err) => {
					if (err) return callback(err, null);

					var list:deftools.DefData[] = importResult.parsed;
					if (options.export === 'all') {
						list = importResult.all;
					}
					else if (options.export === 'error') {
						list = importResult.error;
					}
					ret.exportSelection = list;

					exporter.exportDefinitions(list, callback);

				});
			}], (err?, exportResult?:ExportResult) => {
				if (err) return callback(err);

				ret.exportResult = exportResult;

				callback(null, ret);
			});
		}
	}
}