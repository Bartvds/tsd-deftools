///<reference path="_ref.ts" />
///<reference path="deftool/api.ts" />
///<reference path="deftool/lib.ts" />
///<reference path="deftool/config.ts" />
///<reference path="deftool/expose.ts" />

module deftool {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var info = Config.getInfo();
	var paths = Config.getPaths();
	var app:AppAPI = new AppAPI(info, new Repos(paths.DefinitelyTyped, paths.tsd, paths.tmp));


	/*app.compare((err?, res?:CompareResult) => {
		if (err) return console.log(err);
		console.log(res);
		console.log(res.getStats());
	});*/


	helper.removeFilesFromDir(paths.tmp, (err, res:any) => {
		if (err) return console.log(err);
	});
}
