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
	//var agent:SuperAgent = require('superagent');

	export module Config {

		var paths:ConfPaths;
		var info:ToolInfo;

		export function getPaths():ConfPaths {
			if (paths) return paths;
			var tmp = path.resolve('./tsd-deftools-path.json');
			try {
				paths = JSON.parse(fs.readFileSync(tmp, 'utf-8'))
			}
			catch
			(e) {
				throw(e);
			}
			if (!fs.existsSync(paths.tmp)) {
				fs.mkdir(paths.tmp);
			}
			return paths;
		}

		export function getInfo():ToolInfo {
			if (info) return info;
			var pkg;
			try {
				pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
			}
			catch (e) {
				throw(e);
			}
			return info = new ToolInfo(pkg.name, pkg.version, pkg);
		}
	}

	export class AppAPI {

		paths:ConfPaths;

		constructor(public info:ToolInfo, public repos:Repos) {
			if (!this.info) throw Error('no info');
			if (!this.repos) throw Error('no repos');

			this.init();
		}

		init() {

			var tmp = path.resolve('./tsd-deftools-path.json');
			try {
				this.paths = JSON.parse(fs.readFileSync(tmp, 'utf-8'))
			}
			catch (e) {
				throw(e);
			}
			if (!fs.existsSync(this.paths.tmp)) {
				fs.mkdir(this.paths.tmp);
			}
		}

		compare(callback:(err?, res?:CompareResult) => void) {

			var comparer = new DefinitionComparer(this.repos, this.info);
			comparer.compare((err?, res?:CompareResult) => {
				if (err) callback(err);

				callback(null, res);
			});
		}

		createUnlisted(callback:(err?, res?:ExportResult) => void) {

			var comparer = new DefinitionComparer(this.repos, this.info);
			var importer = new DefinitionImporter(this.repos, this.info);
			var exporter = new DefinitionExporter(this.repos, this.info);

			async.waterfall([(callback:(err) => void) => {
				comparer.compare(callback);

			}, (res:CompareResult, callback:(err?, res?:ImportResult) => void) => {
				importer.parseDefinitions(res.repoAll, callback);

			}, (res:ImportResult, callback:(err?) => void) => {
				console.log('error: ' + res.error.length);
				console.log('parsed: ' + res.parsed.length);

				exporter.exportDefinitions(res.parsed, callback);

			}], (err, res) => {
				callback(err, res);
			});
		}
		parseCurrent(callback:(err?) => void) {

			/*var comparer = new DefinitionComparer(this.repos, this.info);
			var importer = new DefinitionImporter(this.repos, this.info);
			var exporter = new DefinitionExporter(this.repos, this.info);

			async.waterfall([(callback:(err) => void) => {
				console.log('compare');
				comparer.compare(callback);

			}, (res:CompareResult, callback:(err?, res?:ImportResult) => void) => {
				console.log('parseDefinitions');
				importer.parseDefinitions(res.repoAll, callback);

			}], (err, data) => {
				callback(err);
			});*/
		}

	}
}