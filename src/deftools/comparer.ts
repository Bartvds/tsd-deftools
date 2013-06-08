///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	//get all multi-occurrences from list
	export function getDupes(arr:string[]):string[] {
		var uni = _.unique(arr);
		arr = _.filter(arr, (value) => {
			var i = uni.indexOf(value);
			if (i > -1) {
				uni.splice(i, 1);
				return false;
			}
			return true;
		});
		return arr;
	}
	//get all Def's from list where different projects that have a colliding Def.name
	export function getDefCollide(arr:Def[]):DefMap {
		var map:Object = _.reduce(arr, (memo:Object, def:Def) => {
			if (!memo.hasOwnProperty(def.name)) {
				memo[def.name] = [def];
			}
			else {
				memo[def.name].push(def);
			}
			return memo;
		}, {});

		var ret:DefMap = {};
		_.each(map, (value:any, key) => {
			if (value.length > 1) {
				ret[key] = value;
			}
		});
		return ret;
	}

	export class CompareResult {
		repoAll:Def[] = [];
		repoUnlisted:Def[] = [];

		tsdAll:string[] = [];
		tsdNotInRepo:string[] = [];

		//beh
		repoAllDupes:DefMap = {};
		repoUnlistedDupes:DefMap = {};

		repoAllNames():any {
			return _.map(this.repoAll, (value:Def) => {
				return value.name;
			});
		}

		repoUnlistedNames():any {
			return _.map(this.repoUnlisted, (value:Def) => {
				return value.name;
			});
		}
		//for easy display
		getStats():CompareStats {
			return new CompareStats(this);
		}
	}

	//crunch result to numberic stats
	export class CompareStats {

		repoAll:number = 0;
		repoUnlisted:number = 0;
		tsdAll:number = 0;
		tsdNotInRepo:number = 0;
		repoAllDupes:number = 0;
		repoUnlistedDupes:number = 0;

		constructor(public res:CompareResult) {
			this.update();

			Object.defineProperty(this, "res", {
				enumerable: false
			});
		}

		update() {
			this.repoAll = this.res.repoAll.length;
			this.repoUnlisted = this.res.repoUnlisted.length;
			this.tsdAll = this.res.tsdAll.length;
			this.tsdNotInRepo = this.res.tsdNotInRepo.length;
			this.repoAllDupes = _(this.res.repoAllDupes).size();
			this.repoUnlistedDupes = _(this.res.repoUnlistedDupes).size();
		}
	}

	//lazy util
	interface LoopRes {
		tsd:string[];
		defs:Def[];
	}

	//compare repo and tsd content in Repos
	export class DefinitionComparer {

		constructor(public repos:Repos) {

		}

		compare(finish:(err, res:CompareResult) => void) {

			var loader = new ListLoader(this.repos);

			async.parallel({
				defs: (callback) => {
					loader.loadRepoDefs(callback);
				},
				tsd: (callback) => {
					loader.loadTsdNames(callback);
				}
			},
			(err, results:LoopRes) => {
				var res = new CompareResult();
				res.tsdAll = results.tsd;
				res.repoAll = results.defs;

				if (_(res.repoAllDupes).keys().length > 0) {
					console.log('name collisions in repo');
					/*console.log(res.repoAllDupes);
					finish('name collisions in repo', null);*/
					//return
				}

				res.repoUnlisted = _(res.repoAll).filter((value:Def) => {
					return !_(results.tsd).some((t) => {
						return value.name == t;
					});
				});
				res.tsdNotInRepo = _(res.tsdAll).filter((value:string) => {
					return !_(res.repoAll).some((def) => {
						return def.name == value;
					});
				});
				res.repoAllDupes = getDefCollide(res.repoAll);
				res.repoUnlistedDupes = getDefCollide(res.repoUnlisted);

				finish(err, res);
			});
		}
	}
}