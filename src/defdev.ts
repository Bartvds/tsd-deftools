///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');
	//var mod = require('../build/deftools-module');
	var mod = require('../build/deftools-module');


	//var tools:deftools = mod.deftools;
	/*var info = deftools.Config.getInfo();
	var paths = deftools.Config.getPaths();
	var api:deftools.API = new tools.API(info, new deftools.Repos(paths.typings, paths.tsd, paths.tmp));
*/
	console.log(util.inspect(mod.xm, false, 4));
	console.log(util.inspect(mod.xm.RegExpGlue, false, 4));
	var glue = new mod.xm.RegExpGlue();
	console.log(util.inspect(glue, false, 4));
}
