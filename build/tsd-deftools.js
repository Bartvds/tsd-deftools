var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var AppAPI = (function () {
        function AppAPI(info, repos) {
            this.info = info;
            this.repos = repos;
            if(!this.info) {
                throw Error('no info');
            }
            if(!this.repos) {
                throw Error('no repos');
            }
        }
        AppAPI.prototype.compare = function (callback) {
            var comparer = new tsdimport.DefinitionComparer(this.repos);
            comparer.compare(callback);
        };
        AppAPI.prototype.createUnlisted = function (callback) {
            var comparer = new tsdimport.DefinitionComparer(this.repos);
            var importer = new tsdimport.DefinitionImporter(this.repos);
            var exporter = new tsdimport.DefinitionExporter(this.repos, this.info);
            async.waterfall([
                function (callback) {
                    comparer.compare(callback);
                }, 
                function (res, callback) {
                    console.log(res.getStats());
                    importer.parseDefinitions(res.repoUnlisted, callback);
                }, 
                function (res, callback) {
                    console.log('error: ' + res.error.length);
                    console.log('parsed: ' + res.parsed.length);
                    exporter.exportDefinitions(res.parsed, callback);
                }            ], callback);
        };
        AppAPI.prototype.listRepoDependers = function (callback) {
        };
        AppAPI.prototype.listParsed = function (callback) {
            var comparer = new tsdimport.DefinitionComparer(this.repos);
            var importer = new tsdimport.DefinitionImporter(this.repos);
            var exporter = new tsdimport.DefinitionExporter(this.repos, this.info);
            async.waterfall([
                function (callback) {
                    comparer.compare(callback);
                }, 
                function (res, callback) {
                    console.log(res.getStats());
                    importer.parseDefinitions(res.repoAll, callback);
                }            ], callback);
        };
        AppAPI.prototype.exportParsed = function (callback) {
            var comparer = new tsdimport.DefinitionComparer(this.repos);
            var importer = new tsdimport.DefinitionImporter(this.repos);
            var exporter = new tsdimport.DefinitionExporter(this.repos, this.info);
            async.waterfall([
                function (callback) {
                    comparer.compare(callback);
                }, 
                function (res, callback) {
                    console.log(res.getStats());
                    importer.parseDefinitions(res.repoAll, callback);
                }, 
                function (res, callback) {
                    exporter.exportDefinitions(res.parsed, callback);
                    callback(null, res);
                }            ], callback);
        };
        return AppAPI;
    })();
    tsdimport.AppAPI = AppAPI;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var Def = (function () {
        function Def(project, name) {
            this.project = project;
            this.name = name;
        }
        Def.prototype.combi = function () {
            return this.project + '/' + this.name;
        };
        Def.prototype.toString = function () {
            return '[Def ' + this.combi() + ']';
        };
        return Def;
    })();
    tsdimport.Def = Def;    
    function getDupes(arr) {
        var uni = _.unique(arr);
        arr = _.filter(arr, function (value) {
            var i = uni.indexOf(value);
            if(i > -1) {
                uni.splice(i, 1);
                return false;
            }
            return true;
        });
        return arr;
    }
    tsdimport.getDupes = getDupes;
    function getDefCollide(arr) {
        var map = _.reduce(arr, function (memo, def) {
            if(!memo.hasOwnProperty(def.name)) {
                memo[def.name] = [
                    def
                ];
            } else {
                memo[def.name].push(def);
            }
            return memo;
        }, {
        });
        var ret = {
        };
        _.each(map, function (value, key) {
            if(value.length > 1) {
                ret[key] = value;
            }
        });
        return ret;
    }
    tsdimport.getDefCollide = getDefCollide;
    var CompareResult = (function () {
        function CompareResult() {
            this.repoAll = [];
            this.repoUnlisted = [];
            this.tsdAll = [];
            this.tsdNotInRepo = [];
            this.repoAllDupes = {
            };
            this.repoUnlistedDupes = {
            };
        }
        CompareResult.prototype.repoAllNames = function () {
            return _.map(this.repoAll, function (value) {
                return value.name;
            });
        };
        CompareResult.prototype.repoUnlistedNames = function () {
            return _.map(this.repoUnlisted, function (value) {
                return value.name;
            });
        };
        CompareResult.prototype.getStats = function () {
            return new CompareStats(this);
        };
        return CompareResult;
    })();
    tsdimport.CompareResult = CompareResult;    
    var CompareStats = (function () {
        function CompareStats(res) {
            this.res = res;
            this.repoAll = 0;
            this.repoUnlisted = 0;
            this.tsdAll = 0;
            this.tsdNotInRepo = 0;
            this.repoAllDupes = 0;
            this.repoUnlistedDupes = 0;
            this.update();
            Object.defineProperty(this, "res", {
                enumerable: false
            });
        }
        CompareStats.prototype.update = function () {
            this.repoAll = this.res.repoAll.length;
            this.repoUnlisted = this.res.repoUnlisted.length;
            this.tsdAll = this.res.tsdAll.length;
            this.tsdNotInRepo = this.res.tsdNotInRepo.length;
            this.repoAllDupes = _(this.res.repoAllDupes).size();
            this.repoUnlistedDupes = _(this.res.repoUnlistedDupes).size();
        };
        return CompareStats;
    })();
    tsdimport.CompareStats = CompareStats;    
    var DefinitionComparer = (function () {
        function DefinitionComparer(repos) {
            this.repos = repos;
        }
        DefinitionComparer.prototype.compare = function (finish) {
            var self = this;
            async.parallel({
                defs: function (callback) {
                    tsdimport.loader.loadRepoDefList(self.repos, callback);
                },
                tsd: function (callback) {
                    tsdimport.loader.loadTsdList(self.repos, callback);
                }
            }, function (err, results) {
                var res = new CompareResult();
                res.tsdAll = results.tsd;
                res.repoAll = results.defs;
                if(_(res.repoAllDupes).keys().length > 0) {
                    console.log('name collisions in repo');
                }
                res.repoUnlisted = _(res.repoAll).filter(function (value) {
                    return !_(results.tsd).some(function (t) {
                        return value.name == t;
                    });
                });
                res.tsdNotInRepo = _(res.tsdAll).filter(function (value) {
                    return !_(res.repoAll).some(function (def) {
                        return def.name == value;
                    });
                });
                res.repoAllDupes = getDefCollide(res.repoAll);
                res.repoUnlistedDupes = getDefCollide(res.repoUnlisted);
                finish(err, res);
            });
        };
        return DefinitionComparer;
    })();
    tsdimport.DefinitionComparer = DefinitionComparer;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    (function (Config) {
        var paths;
        var info;
        function getPaths() {
            if(paths) {
                return paths;
            }
            var tmp = path.resolve('./tsd-deftools-path.json');
            try  {
                paths = JSON.parse(fs.readFileSync(tmp, 'utf-8'));
            } catch (e) {
                throw (e);
            }
            if(!fs.existsSync(paths.tmp)) {
                fs.mkdir(paths.tmp);
            }
            return paths;
        }
        Config.getPaths = getPaths;
        function getInfo() {
            if(info) {
                return info;
            }
            var pkg;
            try  {
                pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
            } catch (e) {
                throw (e);
            }
            return info = new tsdimport.ToolInfo(pkg.name, pkg.version, pkg);
        }
        Config.getInfo = getInfo;
    })(tsdimport.Config || (tsdimport.Config = {}));
    var Config = tsdimport.Config;
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var ExportResult = (function () {
        function ExportResult() {
            this.created = [];
        }
        return ExportResult;
    })();
    tsdimport.ExportResult = ExportResult;    
    var HeaderExport = (function () {
        function HeaderExport(header, path) {
            this.header = header;
            this.path = path;
        }
        return HeaderExport;
    })();
    tsdimport.HeaderExport = HeaderExport;    
    var DefinitionExporter = (function () {
        function DefinitionExporter(repos, info) {
            this.repos = repos;
            this.info = info;
        }
        DefinitionExporter.prototype.getEncoder = function () {
            return new Encode(this.repos, this.info);
        };
        DefinitionExporter.prototype.writeDef = function (data, encoder, finish) {
            var dest = this.repos.out + data.def.name + '.json';
            var exp = new HeaderExport(data, dest);
            fs.exists(dest, function (exists) {
                if(exists) {
                    return finish('file exists: ' + dest);
                }
                var obj = encoder.encode(data);
                fs.writeFile(dest, JSON.stringify(obj, null, 4), function (err) {
                    finish(err, exp);
                });
            });
        };
        DefinitionExporter.prototype.exportDefinitions = function (list, finish) {
            var self = this;
            var encoder = this.getEncoder();
            var res = new ExportResult();
            async.forEach(list, function (data, callback) {
                console.log('writeDef ' + data.name);
                self.writeDef(data, encoder, function (err, exp) {
                    if(err) {
                        return callback(err);
                    }
                    if(data) {
                        res.created.push(exp);
                    }
                    callback(null, exp);
                });
            }, function (err) {
                finish(err, res);
            });
        };
        return DefinitionExporter;
    })();
    tsdimport.DefinitionExporter = DefinitionExporter;    
    var Encode = (function () {
        function Encode(repos, info) {
            this.repos = repos;
            this.info = info;
        }
        Encode.prototype.encode = function (header) {
            var ret = {
                "name": header.def.name,
                "description": header.name + (header.submodule ? ' (' + header.submodule + ')' : '') + (header.submodule ? ' ' + header.submodule : ''),
                "generated": this.info.getNameVersion() + ' @ ' + new Date().toUTCString(),
                "versions": [
                    {
                        "version": header.version,
                        "key": tsdimport.getGUID(),
                        "dependencies": _.map(header.dependencies, function (data) {
                            return {
                                "name": data.name,
                                "version": data.version
                            };
                        }),
                        "url": header.getDefUrl(),
                        "author": header.authorName,
                        "author_url": header.authorUrl
                    }
                ]
            };
            return ret;
        };
        return Encode;
    })();
    tsdimport.Encode = Encode;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var HeaderData = (function () {
        function HeaderData(def) {
            this.def = def;
            this.name = '';
            this.version = '*';
            this.submodule = '';
            this.description = '';
            this.projectUrl = '';
            this.authorName = '';
            this.authorUrl = '';
            this.reposUrl = '';
            this.errors = [];
            this.references = [];
            this.dependencies = [];
            this.source = '';
            if(!this.def) {
            }
        }
        HeaderData.prototype.combi = function () {
            if(!this.def) {
                return '[' + this.name + ']';
            }
            return this.def.combi();
        };
        HeaderData.prototype.getDefUrl = function () {
            if(!this.reposUrl) {
                return '';
            }
            return this.reposUrl + this.def.project + '/' + this.def.name + '.d.ts';
        };
        HeaderData.prototype.isValid = function () {
            if(this.errors.length > 0) {
                return false;
            }
            if(!this.name || !this.version || !this.projectUrl) {
                return false;
            }
            if(!this.authorName || !this.authorUrl) {
                return false;
            }
            if(!this.reposUrl) {
                return false;
            }
            return true;
        };
        return HeaderData;
    })();
    tsdimport.HeaderData = HeaderData;    
    var ParseError = (function () {
        function ParseError(message, text, ref) {
            if (typeof message === "undefined") { message = ''; }
            if (typeof text === "undefined") { text = ''; }
            if (typeof ref === "undefined") { ref = null; }
            this.message = message;
            this.text = text;
            this.ref = ref;
        }
        return ParseError;
    })();
    tsdimport.ParseError = ParseError;    
    var HeaderParser = (function () {
        function HeaderParser() {
            this.nameVersion = /^[ \t]*\/\/\/?[ \t]*Type definitions[ \t]*for?:?[ \t]+([\w\._ -]+)[ \t]+(\d+\.\d+\.?\d*\.?\d*)[ \t]*[<\[\{\(]?([\w \t_-]+)*[\)\}\]>]?[ \t]*$/gm;
            this.labelUrl = /^[ \t]*\/\/\/?[ \t]*([\w _-]+):?[ \t]+[<\[\{\(]?(http[\S]*)[ \t]*$/gm;
            this.authorNameUrl = /^[ \t]*\/\/\/?[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?[ \t]*$/gm;
            this.description = /^[ \t]*\/\/\/?[ \t]*Description[ \t]*:[ \t]+([\S *]*\S)[ \t]*$/gm;
            this.referencePath = /^[ \t]*\/\/\/\/?[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
            this.endSlash = /\/?$/;
            this.cursor = 0;
        }
        HeaderParser.prototype.reset = function () {
            this.cursor = 0;
        };
        HeaderParser.prototype.moveCursor = function (index) {
            this.cursor += index;
            this.applyCursor();
        };
        HeaderParser.prototype.setCursor = function (index) {
            this.cursor = index;
            this.applyCursor();
        };
        HeaderParser.prototype.applyCursor = function () {
            this.nameVersion.lastIndex = this.cursor;
            this.labelUrl.lastIndex = this.cursor;
            this.authorNameUrl.lastIndex = this.cursor;
            this.description.lastIndex = this.cursor;
            this.referencePath.lastIndex = this.cursor;
        };
        HeaderParser.prototype.parse = function (data, str) {
            if(typeof str !== 'string') {
                str = '' + str;
            }
            var cursor = str.indexOf('//');
            var len = str.length;
            if(cursor < 0) {
                data.errors.push(new ParseError('zero comment lines'));
                return data;
            }
            this.setCursor(cursor);
            var match;
            match = this.nameVersion.exec(str);
            if(!match || match.length < 3) {
                data.errors.push(new ParseError('unparsable name/version line'));
                return data;
            } else {
                data.name = match[1];
                data.version = match[2];
                data.submodule = match.length >= 3 && match[3] ? match[3] : '';
                this.setCursor(match.index + match[0].length);
            }
            match = this.labelUrl.exec(str);
            if(!match || match.length < 2) {
                data.errors.push(new ParseError('unparsable project line'));
                return data;
            } else {
                data.projectUrl = match[2];
                this.setCursor(match.index + match[0].length);
            }
            match = this.authorNameUrl.exec(str);
            if(!match || match.length < 3) {
                data.errors.push(new ParseError('unparsable author line'));
                return data;
            } else {
                data.authorName = match[1];
                data.authorUrl = match[2];
                this.setCursor(match.index + match[0].length);
            }
            match = this.labelUrl.exec(str);
            if(!match || match.length < 3) {
                data.errors.push(new ParseError('unparsable repos line'));
                return data;
            } else {
                data.reposUrl = match[2].replace(this.endSlash, '/');
                this.setCursor(match.index + match[0].length);
            }
            this.referencePath.lastIndex = 0;
            while(match = this.referencePath.exec(str)) {
                if(match.length > 1) {
                    data.references.push(match[1]);
                }
            }
            return data;
        };
        return HeaderParser;
    })();
    tsdimport.HeaderParser = HeaderParser;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/;
    var definition = /^([\w _-]+)\.d\.ts$/;
    var ImportResult = (function () {
        function ImportResult() {
            this.all = [];
            this.error = [];
            this.parsed = [];
            this.requested = [];
            this.map = {
            };
            this.ready = {
            };
        }
        ImportResult.prototype.hasReference = function (list) {
            if (typeof list === "undefined") { list = null; }
            list = list || this.all;
            return _.filter(list, function (value) {
                return value.references.length > 0;
            });
        };
        ImportResult.prototype.hasDependency = function (list) {
            if (typeof list === "undefined") { list = null; }
            list = list || this.all;
            return _.filter(list, function (value) {
                return value.dependencies.length > 0;
            });
        };
        ImportResult.prototype.countReferences = function (list) {
            if (typeof list === "undefined") { list = null; }
            list = list || this.all;
            return _.reduce(list, function (memo, value) {
                return memo + value.references.length;
            }, 0);
        };
        ImportResult.prototype.countDependencies = function (list) {
            if (typeof list === "undefined") { list = null; }
            list = list || this.all;
            return _.reduce(list, function (memo, value) {
                return memo + value.dependencies.length;
            }, 0);
        };
        ImportResult.prototype.isDependency = function (list) {
            if (typeof list === "undefined") { list = null; }
            list = list || this.all;
            var ret = [];
            return _.reduce(list, function (ret, value) {
                _(value.dependencies).forEach(function (dep) {
                    if(ret.indexOf(dep) < 0) {
                        ret.push(dep);
                    }
                });
                return ret;
            }, ret);
        };
        ImportResult.prototype.dupeCheck = function (list) {
            if (typeof list === "undefined") { list = null; }
            list = list || this.all;
            var ret = _.reduce(list, function (memo, value) {
                var key = value.def.name;
                if(memo.hasOwnProperty(key)) {
                    memo[key].push(value);
                } else {
                    memo[key] = [
                        value
                    ];
                }
                return memo;
            }, {
            });
            return _.reduce(_.keys(ret), function (memo, key) {
                if(ret[key].length > 1) {
                    memo[key] = ret[key];
                }
                return memo;
            }, {
            });
        };
        ImportResult.prototype.hasDependencyStat = function (list) {
            if (typeof list === "undefined") { list = null; }
            var map = _.reduce(this.hasDependency(list), function (memo, value) {
                _.forEach(value.dependencies, function (dep) {
                    var key = value.combi();
                    if(memo.hasOwnProperty(key)) {
                        memo[key]++;
                    } else {
                        memo[key] = 1;
                    }
                });
                return memo;
            }, {
            });
            map._total = _.reduce(map, function (memo, num) {
                memo += num;
                return memo;
            }, 0);
            return map;
        };
        ImportResult.prototype.isDependencyStat = function (list) {
            if (typeof list === "undefined") { list = null; }
            var map = _.reduce(this.hasDependency(list), function (memo, value) {
                _.forEach(value.dependencies, function (dep) {
                    var key = dep.combi();
                    if(memo.hasOwnProperty(key)) {
                        memo[key]++;
                    } else {
                        memo[key] = 1;
                    }
                });
                return memo;
            }, {
            });
            map._total = _.reduce(map, function (memo, num) {
                memo += num;
                return memo;
            }, 0);
            return map;
        };
        ImportResult.prototype.checkDupes = function () {
            return new ImportResultDupes(this);
            ;
        };
        return ImportResult;
    })();
    tsdimport.ImportResult = ImportResult;    
    var ImportResultDupes = (function () {
        function ImportResultDupes(res) {
            this.all = res.dupeCheck(res.all);
            this.error = res.dupeCheck(res.error);
            this.parsed = res.dupeCheck(res.parsed);
            this.requested = res.dupeCheck(res.requested);
        }
        return ImportResultDupes;
    })();
    tsdimport.ImportResultDupes = ImportResultDupes;    
    var DefinitionImporter = (function () {
        function DefinitionImporter(repos) {
            this.repos = repos;
            this.parser = new tsdimport.HeaderParser();
        }
        DefinitionImporter.prototype.loadData = function (data, res, callback) {
            var src = path.resolve(this.repos.defs + data.def.project + '/' + data.def.name + '.d.ts');
            var key = data.def.combi();
            var self = this;
            if(res.ready.hasOwnProperty(key)) {
                data = res.ready[key];
                return callback(null, data);
            }
            res.map[key] = data;
            fs.readFile(src, 'utf-8', function (err, source) {
                if(err) {
                    data.errors.push(new tsdimport.ParseError('cannot load source', err));
                    return callback(null, data);
                }
                data.source = src;
                self.parser.parse(data, source);
                if(!data.isValid()) {
                    data.errors.push(new tsdimport.ParseError('invalid parse'));
                }
                if(data.references.length > 0) {
                    async.forEach(data.references, function (ref, callback) {
                        var match, dep;
                        match = ref.match(dependency);
                        if(match && match.length >= 3) {
                            dep = new tsdimport.Def(match[1], match[2]);
                        } else {
                            match = ref.match(definition);
                            if(match && match.length >= 2) {
                                dep = new tsdimport.Def(data.def.project, match[1]);
                            }
                        }
                        if(!dep) {
                            data.errors.push(new tsdimport.ParseError('bad reference', ref));
                            return callback(null, data);
                        }
                        var key = dep.combi();
                        if(res.map.hasOwnProperty(key)) {
                            data.dependencies.push(res.map[key]);
                            return callback(null, res.map[key]);
                        }
                        var sub = new tsdimport.HeaderData(dep);
                        res.map[key] = sub;
                        self.loadData(sub, res, function (err, sub) {
                            if(err) {
                                if(sub) {
                                    sub.errors.push(new tsdimport.ParseError('cannot load dependency' + sub.combi(), err));
                                } else {
                                    data.errors.push(new tsdimport.ParseError('cannot load dependency', err));
                                }
                            }
                            if(!sub) {
                                data.errors.push(new tsdimport.ParseError('cannot load dependency', err));
                            } else {
                                data.dependencies.push(sub);
                                if(res.all.indexOf(sub) < 0) {
                                    res.all.push(sub);
                                }
                                if(!sub.isValid()) {
                                    if(res.error.indexOf(sub) < 0) {
                                        res.error.push(sub);
                                    }
                                } else if(res.parsed.indexOf(sub) < 0) {
                                    res.parsed.push(sub);
                                }
                            }
                            callback(null, data);
                        });
                    }, function (err) {
                        if(err) {
                            console.log('err looping references ' + err);
                        }
                        callback(err, data);
                    });
                } else {
                    return callback(null, data);
                }
            });
        };
        DefinitionImporter.prototype.parseDefinitions = function (projects, finish) {
            var self = this;
            async.reduce(projects, new ImportResult(), function (res, def, callback) {
                var key = def.combi();
                if(res.map.hasOwnProperty(key)) {
                    return callback(null, res);
                }
                var data = new tsdimport.HeaderData(def);
                res.map[key] = data;
                self.loadData(data, res, function (err, data) {
                    if(err) {
                        console.log([
                            'err', 
                            err
                        ]);
                        return callback(null, res);
                    }
                    if(!data) {
                        console.log([
                            'null data', 
                            err
                        ]);
                        return callback(null, res);
                    }
                    res.requested.push(data);
                    if(res.all.indexOf(data) < 0) {
                        res.all.push(data);
                    }
                    if(!data.isValid()) {
                        if(res.error.indexOf(data) < 0) {
                            res.error.push(data);
                        }
                    } else {
                        if(res.parsed.indexOf(data) < 0) {
                            res.parsed.push(data);
                        }
                    }
                    return callback(null, res);
                });
            }, function (err, res) {
                finish(err, res);
            });
        };
        return DefinitionImporter;
    })();
    tsdimport.DefinitionImporter = DefinitionImporter;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var path = require('path');
    var fs = require('fs');
    var trailSlash = /(\w)(\/?)$/;
    var ToolInfo = (function () {
        function ToolInfo(name, version, pkg) {
            this.name = name;
            this.version = version;
            this.pkg = pkg;
            if(!this.name) {
                throw Error('no name');
            }
            if(!this.version) {
                throw Error('no version');
            }
            if(!this.pkg) {
                throw Error('no pkg');
            }
        }
        ToolInfo.prototype.getNameVersion = function () {
            return this.name + ' ' + this.version;
        };
        return ToolInfo;
    })();
    tsdimport.ToolInfo = ToolInfo;    
    var Repos = (function () {
        function Repos(defs, tsd, out) {
            this.defs = defs;
            this.tsd = tsd;
            this.out = out;
            if(!this.defs) {
                throw ('missing local');
            }
            if(!this.tsd) {
                throw ('missing tsd');
            }
            if(!this.out) {
                throw ('missing out');
            }
            this.defs = path.resolve(this.defs).replace(trailSlash, '$1/');
            this.tsd = path.resolve(this.tsd).replace(trailSlash, '$1/');
            this.out = path.resolve(this.out).replace(trailSlash, '$1/');
            if(!fs.existsSync(this.defs) || !fs.statSync(this.defs).isDirectory()) {
                throw new Error('path not exist or not directoy: ' + this.defs);
            }
            if(!fs.existsSync(this.tsd) || !fs.statSync(this.tsd).isDirectory()) {
                throw new Error('path not exist or not directoy: ' + this.tsd);
            }
            if(!fs.existsSync(this.out) || !fs.statSync(this.out).isDirectory()) {
                throw new Error('path not exist or not directoy: ' + this.out);
            }
        }
        return Repos;
    })();
    tsdimport.Repos = Repos;    
    function getGUID() {
        var S4 = function () {
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
    tsdimport.getGUID = getGUID;
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var stripExt = /(\.[\w_-]+)$/;
    var ignoreFile = /^[\._]/;
    var extJson = /\.json$/;
    var extDef = /\.d\.ts$/;
    (function (loader) {
        function loadRepoDefList(repos, finish) {
            fs.readdir(repos.defs, function (err, files) {
                if(err) {
                    return finish(err, []);
                }
                var ret = [];
                async.forEach(files, function (file, callback) {
                    if(ignoreFile.test(file)) {
                        return callback(false);
                    }
                    var src = path.join(repos.defs, file);
                    fs.stat(src, function (err, stats) {
                        if(err) {
                            return callback(false);
                        }
                        if(!stats.isDirectory()) {
                            return callback(false);
                        }
                        fs.readdir(src, function (err, files) {
                            if(err) {
                                return callback(false);
                            }
                            files = _(files).filter(function (name) {
                                return extDef.test(name);
                            });
                            async.forEach(files, function (name, callback) {
                                var tmp = path.join(src, name);
                                fs.stat(tmp, function (err, stats) {
                                    if(err) {
                                        return callback(false);
                                    }
                                    if(stats.isDirectory()) {
                                        return callback(false);
                                    }
                                    ret.push(new tsdimport.Def(file, name.replace(extDef, '')));
                                    callback(null);
                                });
                            }, function (err) {
                                callback(err);
                            });
                        });
                    });
                }, function (err) {
                    finish(err, ret);
                });
            });
        }
        loader.loadRepoDefList = loadRepoDefList;
        function loadTsdList(repos, finish) {
            fs.readdir(repos.tsd + 'repo_data', function (err, files) {
                if(err) {
                    return finish(err, []);
                }
                finish(null, _(files).filter(function (value) {
                    return !ignoreFile.test(value) && extJson.test(value);
                }).map(function (value) {
                    return value.replace(stripExt, '');
                }));
            });
        }
        loader.loadTsdList = loadTsdList;
    })(tsdimport.loader || (tsdimport.loader = {}));
    var loader = tsdimport.loader;
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var _ = require('underscore');
    var Expose = (function () {
        function Expose() {
            var _this = this;
            this._commands = {
            };
            this.add('help', function () {
                console.log('availible commands:');
                _(_this._commands).keys().sort().forEach(function (value) {
                    console.log('  - ' + value);
                });
            });
            this.map('h', 'help');
        }
        Expose.prototype.execute = function (id, head) {
            if (typeof head === "undefined") { head = true; }
            if(!this._commands.hasOwnProperty(id)) {
                console.log('-> unknown command ' + id);
                return;
            }
            if(head) {
                console.log('-> ' + id);
            }
            var f = this._commands[id];
            f.call(null);
        };
        Expose.prototype.add = function (id, def) {
            if(this._commands.hasOwnProperty(id)) {
                throw new Error('id collission on ' + id);
            }
            this._commands[id] = def;
        };
        Expose.prototype.has = function (id) {
            return this._commands.hasOwnProperty(id);
        };
        Expose.prototype.map = function (id, to) {
            var self = this;
            this.add(id, function () {
                self.execute(to, false);
            });
        };
        return Expose;
    })();
    tsdimport.Expose = Expose;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var info = tsdimport.Config.getInfo();
    var paths = tsdimport.Config.getPaths();
    var app = new tsdimport.AppAPI(info, new tsdimport.Repos(paths.DefinitelyTyped, paths.tsd, paths.tmp));
    var expose = new tsdimport.Expose();
    expose.add('info', function () {
        console.log(info.getNameVersion());
        _(app.repos).keys().sort().forEach(function (value) {
            console.log('   ' + value + ': ' + app.repos[value]);
        });
    });
    expose.add('compare', function () {
        app.compare(function (err, res) {
            if(err) {
                return console.log(err);
            }
            console.log(util.inspect(res, false, 8));
            console.log(res.getStats());
        });
    });
    expose.add('listParsed', function () {
        app.listParsed(function (err, res) {
            if(err) {
                return console.log(err);
            }
            console.log('isDependencyStat():\n' + util.inspect(res.isDependencyStat(), false, 8));
            console.log('hasDependencyStat():\n' + util.inspect(res.hasDependencyStat(), false, 8));
            console.log('dupeCheck():\n' + util.inspect(res.dupeCheck(), false, 8));
            console.log('all: ' + res.all.length);
            console.log('parsed: ' + res.parsed.length);
            console.log('error: ' + res.error.length);
            console.log('hasReference(): ' + res.hasReference().length);
            console.log('hasDependency(): ' + res.hasDependency().length);
            console.log('countReferences(): ' + res.countReferences());
            console.log('countDependencies(): ' + res.countDependencies());
            console.log('isDependency(): ' + res.isDependency().length);
            console.log('dupeCheck(): ' + _.size(res.dupeCheck()));
            console.log('checkDupes():\n' + util.inspect(res.checkDupes(), false, 3));
        });
    });
    expose.add('createUnlisted', function () {
        app.createUnlisted(function (err, res) {
            if(err) {
                return console.log(err);
            }
            console.log(util.inspect(res, false, 8));
        });
    });
    var argv = require('optimist').argv;
    expose.execute('info');
    if(argv._.length == 0) {
        expose.execute('help');
        expose.execute('listParsed');
    } else {
        expose.execute(argv._[0]);
        if(!expose.has(argv._[0])) {
            expose.execute('help');
        }
    }
})(tsdimport || (tsdimport = {}));
