///<reference path="_ref.ts" />


module helper {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');

	export function readJSON(src:string):any {
		return JSON.parse(fs.readFileSync(src, 'utf8'));
	}

	export function loadJSON(src:string, callback:(err, res:any) => void) {
		fs.readFile(path.resolve(src), 'utf8', (err, file) => {
			if (err || !file) return callback(err, null);
			try {
				return callback(null, JSON.parse(file));
			}
			catch (err) {
				return callback(err, null);
			}
			return callback(null, null);
		});
	}

	export function dump(object:any, label?:string = '', depth?:number = 6, showHidden?:bool = false):any {
		if (label) {
			console.log(label + ':');
		}
		console.log(util.inspect(object, showHidden, depth, true));
	}

	export function dumpJSON(object:any, label?:string = ''):any {
		if (console.log) {
			console.log(label + ':');
		}
		console.log(JSON.stringify(object, null, 4));
	}

	export class HeaderAssert {
		fields:any;
		header:any;
		tsd:any;
		key:string;

		constructor(public project:string, public name:string) {
			this.key = this.combi();
		}

		combi():string {
			return this.project + '/' + this.name;
		}
	}

	export function loadHeaderFixtures(src:string, finish:(err, res:HeaderAssert[]) => void) {
		src = path.resolve(src);

		if (!fs.existsSync(src)) return finish('missing path' + src, []);
		if (!fs.statSync(src).isDirectory()) return finish('not directory ' + src, []);

		//loop projects
		fs.readdir(src, (err, files:string[]) => {
			if (err || !files) return finish(err, []);

			async.reduce(files, [], (memo:helper.HeaderAssert[], project, callback:(err, res?) => void) => {
				var dir = path.join(src, project);

				fs.stat(dir, (err, stats) => {
					if (err || !stats) return callback(err);
					if (!stats.isDirectory()) return callback(null, memo);

					//loop sub modules
					fs.readdir(dir, (err, files:string[]) => {

						async.reduce(files, memo, (memo:helper.HeaderAssert[], name, callback:(err, res?) => void) => {
							var pack = path.join(dir, name);

							fs.stat(dir, (err, stats) => {
								if (err || !stats) return callback(err);
								if (!stats.isDirectory()) return callback(null, memo);

								//grab data files
								async.parallel({
									header: (callback:AsyncCallback) => {
										fs.readFile(path.join(pack, 'header.ts'), 'utf8', callback);
									},
									fields: (callback:AsyncCallback) => {
										helper.loadJSON(path.join(pack, 'fields.json'), callback);
									},
									tsd: (callback:AsyncCallback) => {
										helper.loadJSON(path.join(pack, 'tsd.json'), callback);
									}
								}, (err, res) => {
									if (err) return callback(err);

									//needed?
									if (!res.fields) return callback('missing res.fields');
									if (!res.header) return callback('missing res.header');
									if (!res.tsd) return callback('missing res.tsd');

									var data = new helper.HeaderAssert(project, name);
									data.fields = res.fields;
									data.header = res.header;
									data.tsd = res.tsd;
									memo.push(data);

									callback(null, memo);
								});
							});

						}, (err, memo) => {
							finish(err, memo || []);
						});
					});
				});

			}, (err, memo) => {
				finish(err, memo || []);
			});
		});
	}
}