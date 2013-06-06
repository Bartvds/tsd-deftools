///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

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

			new ListLoader(this.repos).loadTsdNames(callback)
		}
		/**
		 * List files in repo as Def
		 * @param callback
		 */
		loadRepoDefs(callback:(err, res:Def[]) => void) {

			new ListLoader(this.repos).loadRepoDefs(callback)
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

			var importer = new DefinitionImporter(this.repos);

			new ListLoader(this.repos).loadRepoDefs((err?, res?:Def[]) => {
				if (err) return callback(err);
				if (!res) return callback('loader.loadRepoDefList returned no result');
				importer.parseDefinitions(res, callback);
			});
		}

		/**
		 * Recreate all tsd json files from repo data
		 * @param callback
		 */
		recreateAll(callback:(err?, res?:ExportResult) => void) {

			var comparer = new DefinitionComparer(this.repos);
			var importer = new DefinitionImporter(this.repos);
			var exporter = new DefinitionExporter(this.repos, this.info);

			async.waterfall([(callback:(err) => void) => {
				//why compare? (split this into recreate new/changed/all)
				comparer.compare(callback);

			}, (res:CompareResult, callback:(err?, res?:ImportResult) => void) => {
				if (!res) return callback('DefinitionComparer.compare returned no result');
				console.log(res.getStats());

				importer.parseDefinitions(res.repoAll, callback);

			}, (res:ImportResult, callback:(err?, res?:ExportResult) => void) => {
				if (!res) return callback('DefinitionImporter.parseDefinitions returned no result');
				console.log('error: ' + res.error.length);
				console.log('parsed: ' + res.parsed.length);

				//TODO add more validation

				helper.removeFilesFromDir(exporter.repos.out, (err) => {
					if (err) return callback(err, null);
					exporter.exportDefinitions(res.all, callback);
				});

			}], callback);
		}

	}
}