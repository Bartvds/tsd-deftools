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

	export class Expose {

		map:any = {};

		add(id:string, def:Function) {
			if (this.map.hasOwnProperty(id)) {
				throw new Error('id collission on ' + id);
			}
			this.map[id] = def;
		}

		execute(id:string) {
			if (!this.map.hasOwnProperty(id)) {
				console.log('nothing exposed as '+ id);
				return;
			}

			console.log('-> execute: '+ id);
			var f = this.map[id];
			f.call(null);
		}
	}
}