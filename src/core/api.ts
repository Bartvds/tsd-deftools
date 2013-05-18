///<reference path="../_ref.ts" />
///<reference path="lib.ts" />
///<reference path="exporter.ts" />
///<reference path="importer.ts" />
///<reference path="comparer.ts" />
///<reference path="parser.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	export class AppAPI {

		paths:ConfPaths;

		constructor(public info:ToolInfo, public repos:Repos) {
			if (!this.info) throw Error('no info');
			if (!this.repos) throw Error('no repos');
		}

		compare(callback:(err?, res?:CompareResult) => void) {

			var comparer = new DefinitionComparer(this.repos);
			comparer.compare((err?, res?:CompareResult) => {
				if (err) return callback(err);
				//?
				callback(null, res);
			});
		}

		createUnlisted(callback:(err?, res?:ExportResult) => void) {

			var comparer = new DefinitionComparer(this.repos);
			var importer = new DefinitionImporter(this.repos);
			var exporter = new DefinitionExporter(this.repos, this.info);

			async.waterfall([(callback:(err) => void) => {
				comparer.compare(callback);

			}, (res:CompareResult, callback:(err?, res?:ImportResult) => void) => {
				console.log(res.getStats());
				importer.parseDefinitions(res.repoUnlisted, callback);

			}, (res:ImportResult, callback:(err?) => void) => {
				console.log('error: ' + res.error.length);
				console.log('parsed: ' + res.parsed.length);

				exporter.exportDefinitions(res.parsed, callback);

			}], (err, res) => {
				callback(err, res);
			});
		}


		listRepoDependers(callback:(err?, res?:ExportResult) => void) {

		}

		listParsed(callback:(err?, res?:ImportResult) => void) {

			var comparer = new DefinitionComparer(this.repos);
			var importer = new DefinitionImporter(this.repos);
			var exporter = new DefinitionExporter(this.repos, this.info);

			async.waterfall([(callback:(err) => void) => {
				comparer.compare(callback);

			}, (res:CompareResult, callback:(err?, res?:ImportResult) => void) => {
				console.log(res.getStats());
				importer.parseDefinitions(res.repoAll, callback);

			}, (res:ImportResult, callback:(err?, res?:ImportResult) => void) => {
				//console.log(res.error);

				//exporter.exportDefinitions(res.parsed, callback);

				callback(null, res);

			}], (err, res) => {
				callback(err, res);
			});
		}

	}
}