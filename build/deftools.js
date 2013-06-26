var deftools;
(function (deftools) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var RecreateResult = (function () {
        function RecreateResult(repos, options) {
            this.repos = repos;
            this.options = options;
        }
        return RecreateResult;
    })();
    deftools.RecreateResult = RecreateResult;    
    var API = (function () {
        function API(info, repos) {
            this.info = info;
            this.repos = repos;
            if(!this.info) {
                throw Error('no info');
            }
            if(!this.repos) {
                throw Error('no repos');
            }
        }
        API.prototype.loadTsdNames = function (callback) {
            var loader = new deftools.ListLoader(this.repos);
            loader.loadTsdNames(callback);
        };
        API.prototype.tsdNotHostedInRepo = function (callback) {
            var loader = new deftools.ListLoader(this.repos);
            loader.loadTsdNames(function (err, names) {
                if(err) {
                    return console.log(err);
                }
                if(!names) {
                    return console.log('loadTsdNames no res');
                }
                var importer = new deftools.TsdImporter(loader.repos);
                importer.parseRepoData(names, function (err, res) {
                    if(err) {
                        return callback(err, null);
                    }
                    if(!res) {
                        return callback('parseRepoData no res', null);
                    }
                    callback(null, res.urlMatch(/^https:\/\/github.com\/borisyankov\/DefinitelyTyped/, true));
                });
            });
        };
        API.prototype.loadRepoDefs = function (callback) {
            var loader = new deftools.ListLoader(this.repos);
            loader.loadRepoDefs(callback);
        };
        API.prototype.compare = function (callback) {
            var comparer = new deftools.DefinitionComparer(this.repos);
            comparer.compare(callback);
        };
        API.prototype.parseAll = function (callback) {
            var loader = new deftools.ListLoader(this.repos);
            var importer = new deftools.DefinitionImporter(this.repos);
            loader.loadRepoDefs(function (err, res) {
                if(err) {
                    return callback(err);
                }
                if(!res) {
                    return callback('loader.loadRepoDefList returned no result');
                }
                importer.parseDefinitions(res, callback);
            });
        };
        API.prototype.parseProject = function (project, callback) {
            var loader = new deftools.ListLoader(this.repos);
            var importer = new deftools.DefinitionImporter(this.repos);
            loader.loadRepoProjectDefs(project, function (err, res) {
                if(err) {
                    return callback(err);
                }
                if(!res) {
                    return callback('loader.loadRepoProjectDefs returned no result');
                }
                importer.parseDefinitions(res, callback);
            });
        };
        API.prototype.updateTsd = function (options, callback) {
            var _this = this;
            options = _.defaults(options || {
            }, {
                parse: 'all',
                export: 'parsed'
            });
            var ret = new RecreateResult(this.repos, options);
            async.waterfall([
                function (callback) {
                    var comparer = new deftools.DefinitionComparer(_this.repos);
                    comparer.compare(callback);
                }, 
                function (compareResult, callback) {
                    if(!compareResult) {
                        return callback('DefinitionComparer.compare returned no result');
                    }
                    ret.compareResult = compareResult;
                    var importer = new deftools.DefinitionImporter(_this.repos);
                    var defs = compareResult.repoAll;
                    if(options.parse === 'new') {
                        defs = compareResult.repoUnlisted;
                    }
                    ret.importSelection = defs;
                    importer.parseDefinitions(defs, callback);
                }, 
                function (importResult, callback) {
                    if(!importResult) {
                        return callback('DefinitionImporter.parseDefinitions returned no result');
                    }
                    ret.importResult = importResult;
                    var exporter = new deftools.DefinitionExporter(_this.repos, _this.info);
                    deftools.helper.removeFilesFromDir(exporter.repos.out, function (err) {
                        if(err) {
                            return callback(err, null);
                        }
                        var list = importResult.parsed;
                        if(options.export === 'all') {
                            list = importResult.all;
                        } else if(options.export === 'error') {
                            list = importResult.error;
                        }
                        ret.exportSelection = list;
                        exporter.exportDefinitions(list, callback);
                    });
                }            ], function (err, exportResult) {
                if(err) {
                    return callback(err);
                }
                ret.exportResult = exportResult;
                callback(null, ret);
            });
        };
        return API;
    })();
    deftools.API = API;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
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
    deftools.getDupes = getDupes;
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
    deftools.getDefCollide = getDefCollide;
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
    deftools.CompareResult = CompareResult;    
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
    deftools.CompareStats = CompareStats;    
    var DefinitionComparer = (function () {
        function DefinitionComparer(repos) {
            this.repos = repos;
        }
        DefinitionComparer.prototype.compare = function (finish) {
            var loader = new deftools.ListLoader(this.repos);
            async.parallel({
                defs: function (callback) {
                    loader.loadRepoDefs(callback);
                },
                tsd: function (callback) {
                    loader.loadTsdNames(callback);
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
    deftools.DefinitionComparer = DefinitionComparer;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var trailSlash = /(\w)(\/?)$/;
    var ConfPaths = (function () {
        function ConfPaths() { }
        return ConfPaths;
    })();
    deftools.ConfPaths = ConfPaths;    
    (function (Config) {
        function getPaths(src) {
            var paths;
            if(typeof src === 'undefined') {
                src = './tsd-deftools-path.json';
            }
            src = path.resolve(src);
            try  {
                paths = JSON.parse(fs.readFileSync(src, 'utf8'));
            } catch (e) {
                throw (e);
            }
            if(!fs.existsSync(paths.typings)) {
                throw ('typings does not exist ' + paths.typings);
            }
            if(!fs.existsSync(paths.tsd)) {
                throw ('tsd does not exist ' + paths.tsd);
            }
            if(!fs.existsSync(paths.tmp)) {
                fs.mkdir(paths.tmp);
                console.log('Config created paths.tmp ' + paths.tmp);
            } else {
            }
            if(!fs.existsSync(paths.out)) {
                fs.mkdir(paths.out);
                console.log('Config created paths.out ' + paths.out);
            } else {
            }
            return paths;
        }
        Config.getPaths = getPaths;
        function getInfo() {
            var pkg;
            try  {
                pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            } catch (e) {
                throw (e);
            }
            return new ToolInfo(pkg.name, pkg.version, pkg);
        }
        Config.getInfo = getInfo;
    })(deftools.Config || (deftools.Config = {}));
    var Config = deftools.Config;
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
    deftools.ToolInfo = ToolInfo;    
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
    deftools.Repos = Repos;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
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
    deftools.ExportResult = ExportResult;    
    var HeaderExport = (function () {
        function HeaderExport(header, path) {
            this.header = header;
            this.path = path;
        }
        return HeaderExport;
    })();
    deftools.HeaderExport = HeaderExport;    
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
    deftools.DefinitionExporter = DefinitionExporter;    
    var Encode = (function () {
        function Encode(repos, info) {
            this.repos = repos;
            this.info = info;
        }
        Encode.prototype.encode = function (header) {
            var ret = {
                "name": header.def.name,
                "description": header.name + (header.submodule ? ' (' + header.submodule + ')' : '') + (header.submodule ? ' ' + header.submodule : ''),
                "versions": [
                    {
                        "version": header.version,
                        "key": deftools.getGUID(),
                        "dependencies": _.map(header.dependencies, function (data) {
                            return {
                                "valid": data.isValid(),
                                "name": data.def.name,
                                "version": data.version
                            };
                        }),
                        "url": header.getDefUrl(),
                        "authors": _.map(header.authors, function (data) {
                            return data.toJSON();
                        })
                    }
                ],
                "generator": {
                    "name": this.info.getNameVersion(),
                    "date": new Date().toUTCString(),
                    "valid": header.isValid()
                }
            };
            return ret;
        };
        return Encode;
    })();
    deftools.Encode = Encode;    
})(deftools || (deftools = {}));
var xm;
(function (xm) {
    var expTrim = /^\/(.*)\/([a-z]+)*$/gm;
    var flagFilter = /[gim]/;
    var RegExpGlue = (function () {
        function RegExpGlue() {
            var exp = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                exp[_i] = arguments[_i + 0];
            }
            this.parts = [];
            if(exp.length > 0) {
                this.append.apply(this, exp);
            }
        }
        RegExpGlue.get = function get() {
            var exp = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                exp[_i] = arguments[_i + 0];
            }
            var e = new RegExpGlue();
            return e.append.apply(e, exp);
        };
        RegExpGlue.prototype.append = function () {
            var _this = this;
            var exp = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                exp[_i] = arguments[_i + 0];
            }
            exp.forEach(function (value) {
                _this.parts.push(value);
            }, this);
            return this;
        };
        RegExpGlue.prototype.getBody = function (exp) {
            expTrim.lastIndex = 0;
            var trim = expTrim.exec('' + exp);
            if(!trim) {
                return '';
            }
            return typeof trim[1] !== 'undefined' ? trim[1] : '';
        };
        RegExpGlue.prototype.getFlags = function (exp) {
            expTrim.lastIndex = 0;
            var trim = expTrim.exec('' + exp);
            if(!trim) {
                return '';
            }
            return typeof trim[2] !== 'undefined' ? this.getCleanFlags(trim[2]) : '';
        };
        RegExpGlue.prototype.getCleanFlags = function (flags) {
            var ret = '';
            for(var i = 0; i < flags.length; i++) {
                var char = flags.charAt(i);
                if(flagFilter.test(char) && ret.indexOf(char) < 0) {
                    ret += char;
                }
            }
            return ret;
        };
        RegExpGlue.prototype.join = function (flags, seperator) {
            var glueBody = seperator ? this.getBody(seperator) : '';
            var chunks = [];
            flags = typeof flags !== 'undefined' ? this.getCleanFlags(flags) : '';
            this.parts.forEach(function (exp, index, arr) {
                if(typeof exp === 'string') {
                    chunks.push(exp);
                    return;
                }
                expTrim.lastIndex = 0;
                var trim = expTrim.exec('' + exp);
                if(!trim) {
                    return exp;
                }
                if(trim.length < 2) {
                    console.log(trim);
                    return;
                }
                chunks.push(trim[1]);
            }, this);
            return new RegExp(chunks.join(glueBody), flags);
        };
        return RegExpGlue;
    })();
    xm.RegExpGlue = RegExpGlue;    
})(xm || (xm = {}));
var xm;
(function (xm) {
    var hasOwnProp = Object.prototype.hasOwnProperty;
    var KeyValueMap = (function () {
        function KeyValueMap(data) {
            this._prefix = '';
            this._store = {
            };
            if(data) {
                this.import(data);
            }
        }
        KeyValueMap.prototype.has = function (key) {
            if(typeof key === 'undefined') {
                return false;
            }
            key = this._prefix + key;
            return hasOwnProp.call(this._store, key);
        };
        KeyValueMap.prototype.get = function (key, alt) {
            if (typeof alt === "undefined") { alt = undefined; }
            if(typeof key === 'undefined') {
                return alt;
            }
            key = this._prefix + key;
            if(hasOwnProp.call(this._store, key)) {
                return this._store[key];
            }
            return alt;
        };
        KeyValueMap.prototype.set = function (key, value) {
            if(typeof key === 'undefined') {
                return;
            }
            key = this._prefix + key;
            this._store[key] = value;
        };
        KeyValueMap.prototype.remove = function (key) {
            if(typeof key === 'undefined') {
                return;
            }
            key = this._prefix + key;
            if(hasOwnProp.call(this._store, key)) {
                delete this._store[key];
            }
        };
        KeyValueMap.prototype.keys = function () {
            var len = this._prefix.length;
            var ret = [];
            for(var key in this._store) {
                if(hasOwnProp.call(this._store, key)) {
                    ret.push(key.substr(len));
                }
            }
            return ret;
        };
        KeyValueMap.prototype.values = function (allow) {
            var keys = this.keys();
            var ret = [];
            for(var i = 0, ii = keys.length; i < ii; i++) {
                var key = keys[i];
                if(!allow || allow.indexOf(key) > -1) {
                    ret.push(this.get(key));
                }
            }
            return ret;
        };
        KeyValueMap.prototype.clear = function (keep) {
            var keys = this.keys();
            for(var i = 0, ii = keys.length; i < ii; i++) {
                var key = keys[i];
                if(!keep || keep.indexOf(key) > -1) {
                    this.remove(key);
                }
            }
        };
        KeyValueMap.prototype.import = function (data, allow) {
            if(typeof data !== 'object') {
                return;
            }
            for(var key in data) {
                if(hasOwnProp.call(data, key) && (!allow || allow.indexOf(key) > -1)) {
                    this.set(key, data[key]);
                }
            }
        };
        KeyValueMap.prototype.export = function (allow) {
            var ret = {
            };
            var keys = this.keys();
            for(var i = 0, ii = keys.length; i < ii; i++) {
                var key = keys[i];
                if(!allow || allow.indexOf(key) > -1) {
                    ret[key] = this.get(key);
                }
            }
            return ret;
        };
        return KeyValueMap;
    })();
    xm.KeyValueMap = KeyValueMap;    
})(xm || (xm = {}));
var xm;
(function (xm) {
    var _ = require('underscore');
    var util = require('util');
    var LineParserCore = (function () {
        function LineParserCore(verbose) {
            if (typeof verbose === "undefined") { verbose = false; }
            this.verbose = verbose;
            this.parsers = new xm.KeyValueMap();
            this.trimmedLine = /([ \t]*)(.*?)([ \t]*)(\r\n|\n|\r|$)/g;
        }
        LineParserCore.prototype.addParser = function (parser) {
            this.parsers.set(parser.id, parser);
        };
        LineParserCore.prototype.getInfo = function () {
            var ret = {
            };
            ret.parsers = this.parsers.keys().sort();
            return ret;
        };
        LineParserCore.prototype.getParser = function (id) {
            return this.parsers.get(id, null);
        };
        LineParserCore.prototype.link = function () {
            var self = this;
            _.each(this.parsers.values(), function (parser) {
                _.each(parser.nextIds, function (id) {
                    var p = self.parsers.get(id);
                    if(p) {
                        parser.next.push(p);
                    } else {
                        console.log('cannot find parser: ' + id);
                    }
                });
            });
        };
        LineParserCore.prototype.get = function (ids) {
            var self = this;
            return _.reduce(ids, function (memo, id) {
                if(!self.parsers.has(id)) {
                    console.log('missing parser ' + id);
                    return memo;
                }
                memo.push(self.parsers.get(id));
                return memo;
            }, []);
        };
        LineParserCore.prototype.all = function () {
            return this.parsers.values();
        };
        LineParserCore.prototype.listIds = function (parsers) {
            return _.reduce(parsers, function (memo, parser) {
                memo.push(parser.id);
                return memo;
            }, []);
        };
        LineParserCore.prototype.parse = function (source, asType) {
            var log = this.verbose ? function () {
                var rest = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    rest[_i] = arguments[_i + 0];
                }
                console.log.apply(console, rest);
            } : function () {
                var rest = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    rest[_i] = arguments[_i + 0];
                }
            };
            log('source.length: ' + source.length);
            log('asType: ' + asType);
            this.link();
            var res = [];
            var possibles = asType ? this.get(asType) : this.all();
            var length = source.length;
            var line;
            var i, ii;
            var offset = 0;
            var cursor = 0;
            var lineCount = 0;
            var procLineCount = 0;
            var safetyBreak = 20;
            this.trimmedLine.lastIndex = 0;
            while(line = this.trimmedLine.exec(source)) {
                log('-----------------------------------------------------------------------------------------');
                if(line[0].length === 0) {
                    console.log('zero length line match?');
                    break;
                }
                if(line.index + line[0].lengt === cursor) {
                    console.log('cursor not advancing?');
                    break;
                }
                cursor = line.index + line[0].length;
                this.trimmedLine.lastIndex = cursor;
                lineCount++;
                log('line: ' + lineCount);
                if(lineCount > safetyBreak) {
                    console.log('\n\n\n\nsafetyBreak bail at ' + lineCount + '> ' + safetyBreak + '!\n\n\n\n\n');
                    throw ('parser safetyBreak bail!');
                    break;
                }
                if(line.length < 5) {
                    log('skip bad line match');
                } else if(typeof line[2] === 'undefined' || line[2] == '') {
                    log('skip empty line');
                } else {
                    procLineCount++;
                    var text = line[2];
                    log('[[' + text + ']]');
                    log('---');
                    var choice = [];
                    for(i = 0 , ii = possibles.length; i < ii; i++) {
                        var parser = possibles[i];
                        var match = parser.match(text, offset, cursor);
                        if(match) {
                            log(parser.getName() + ' -> match!');
                            log(match.match);
                            choice.push(match);
                            break;
                        } else {
                            log(parser.getName());
                        }
                    }
                    log('---');
                    log('choices ' + choice.length);
                    if(choice.length == 0) {
                        log('cannot match line');
                        break;
                    } else if(choice.length == 1) {
                        log('single match line');
                        log('using ' + choice[0].parser.id);
                        res.push(choice[0]);
                        possibles = choice[0].parser.next;
                        log('switching possibles: [' + this.listIds(possibles) + ']');
                    } else {
                        log('multi match line');
                        log('using ' + choice[0].parser.id);
                        res.push(choice[0]);
                        possibles = choice[0].parser.next;
                        log('switching possibles: [' + this.listIds(possibles) + ']');
                    }
                }
                if(possibles.length == 0) {
                    log('no more possibles, break');
                    break;
                }
                if(cursor >= length) {
                    log('done ' + cursor + ' >= ' + length + ' lineCount: ' + lineCount);
                    break;
                }
            }
            log('--------------');
            log('total lineCount: ' + lineCount);
            log('procLineCount: ' + procLineCount);
            log('res.length: ' + res.length);
            log(' ');
            if(res.length > 0) {
                _.each(res, function (match) {
                    match.extract();
                });
            }
        };
        return LineParserCore;
    })();
    xm.LineParserCore = LineParserCore;    
    var LineParser = (function () {
        function LineParser(id, exp, groupsMin, callback, nextIds) {
            if (typeof nextIds === "undefined") { nextIds = []; }
            this.id = id;
            this.exp = exp;
            this.groupsMin = groupsMin;
            this.callback = callback;
            this.nextIds = nextIds;
            this.next = [];
        }
        LineParser.prototype.match = function (str, offset, limit) {
            this.exp.lastIndex = offset;
            var match = this.exp.exec(str);
            if(!match || match.length < 1) {
                return null;
            }
            if(this.groupsMin >= 0 && match.length < this.groupsMin) {
                throw (new Error(this.getName() + 'bad match expected ' + this.groupsMin + ' groups, got ' + (this.match.length - 1)));
            }
            return new LineParserMatch(this, match);
        };
        LineParser.prototype.getName = function () {
            return this.id;
        };
        return LineParser;
    })();
    xm.LineParser = LineParser;    
    var LineParserMatch = (function () {
        function LineParserMatch(parser, match) {
            this.parser = parser;
            this.match = match;
        }
        LineParserMatch.prototype.extract = function () {
            if(this.parser.callback) {
                this.parser.callback(this);
            }
        };
        LineParserMatch.prototype.getGroup = function (num, alt) {
            if (typeof alt === "undefined") { alt = ''; }
            if(num >= this.match.length - 1) {
                throw (new Error(this.parser.getName() + ' group index ' + num + ' > ' + (this.match.length - 2)));
            }
            num += 1;
            if(num < 1 || num > this.match.length) {
                return alt;
            }
            if(typeof this.match[num] === 'undefined') {
                return alt;
            }
            return this.match[num];
        };
        LineParserMatch.prototype.getGroupFloat = function (num, alt) {
            if (typeof alt === "undefined") { alt = 0; }
            var value = parseFloat(this.getGroup(num));
            if(isNaN(value)) {
                return alt;
            }
            return value;
        };
        LineParserMatch.prototype.getName = function () {
            return this.parser.getName();
        };
        return LineParserMatch;
    })();
    xm.LineParserMatch = LineParserMatch;    
})(xm || (xm = {}));
var deftools;
(function (deftools) {
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
    deftools.ParseError = ParseError;    
    var endSlashTrim = /\/?$/;
    var glue = xm.RegExpGlue.get;
    var expStart = /^/;
    var expEnd = /$/;
    var spaceReq = /[ \t]+/;
    var spaceOpt = /[ \t]*/;
    var anyGreedy = /.*/;
    var anyLazy = /.*?/;
    var anyGreedyCap = /(.*)/;
    var anyLazyCap = /(.*?)/;
    var identifierCap = /([\w\._-]*(?:[ \t]*[\w\._-]+)*?)/;
    var versionCap = /-?v?(\d+\.\d+\.?\d*\.?\d*)?/;
    var wordsCap = /([\w \t_-]+[\w]+)/;
    var labelCap = /([\w_-]+[\w]+)/;
    var delimStart = /[<\[\{\(]/;
    var delimStartOpt = /[<\[\{\(]?/;
    var delimEnd = /[\)\}\]>]/;
    var delimEndOpt = /[\)\}\]>]?/;
    var seperatorOpt = /[,;]?/;
    var urlGroupsCap = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;
    var urlFullCap = /((?:(?:[A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)(?:(?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;
    var referenceTag = /<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>/;
    var commentStart = glue(expStart, spaceOpt, /\/\/+/, spaceOpt).join();
    var optUrl = glue('(?:', spaceOpt, delimStartOpt, urlFullCap, delimEndOpt, ')?').join();
    var commentLine = glue(commentStart).append(anyLazyCap).append(spaceOpt, expEnd).join();
    var referencePath = glue(expStart, spaceOpt, /\/\/\//, spaceOpt).append(referenceTag).append(spaceOpt, expEnd).join();
    var typeHead = glue(commentStart).append(/Type definitions?/, spaceOpt, /(?:for)?:?/, spaceOpt, identifierCap).append(/[ \t:-]+/, versionCap, spaceOpt).append(anyGreedy, expEnd).join('i');
    var projectUrl = glue(commentStart).append(/Project/, spaceOpt, /:?/, spaceOpt).append(delimStartOpt, urlFullCap, delimEndOpt).append(spaceOpt, expEnd).join('i');
    var defAuthorUrl = glue(commentStart).append(/Definitions[ \t]+by[ \t]*:?/, spaceOpt).append(wordsCap, optUrl).append(spaceOpt, seperatorOpt, spaceOpt, expEnd).join('i');
    var defAuthorUrlAlt = glue(commentStart).append(/Author[ \t]*:?/, spaceOpt).append(wordsCap, optUrl).append(spaceOpt, seperatorOpt, spaceOpt, expEnd).join('i');
    var reposUrl = glue(commentStart).append(/Definitions/, spaceOpt, /:?/, spaceOpt).append(delimStartOpt, urlFullCap, delimEndOpt).append(spaceOpt, expEnd).join('i');
    var reposUrlAlt = glue(commentStart).append(/DefinitelyTyped/, spaceOpt, /:?/, spaceOpt).append(delimStartOpt, urlFullCap, delimEndOpt).append(spaceOpt, expEnd).join('i');
    var labelUrl = glue(commentStart).append(labelCap, spaceOpt, /:?/, spaceOpt).append(delimStartOpt, urlFullCap, delimEndOpt).append(spaceOpt, expEnd).join('i');
    var labelWordsUrl = glue(commentStart).append(labelCap, spaceOpt, /:?/, spaceOpt).append(wordsCap, spaceOpt).append(delimStartOpt, urlFullCap, delimEndOpt).append(spaceOpt, expEnd);
    var wordsUrl = glue(commentStart).append(wordsCap, spaceOpt).append(delimStartOpt, urlFullCap, delimEndOpt).append(spaceOpt, expEnd).join('i');
    var mutate = function (base, add, remove) {
        var res = base ? base.slice(0) : [];
        var i, ii, index;
        if(add) {
            for(i = 0 , ii = add.length; i < ii; i++) {
                res.push(add[i]);
            }
        }
        if(remove) {
            for(i = 0 , ii = remove.length; i < ii; i++) {
                while((index = res.indexOf(remove[i])) > -1) {
                    res.splice(index, 1);
                }
            }
        }
        return res;
    };
    var HeaderParser = (function () {
        function HeaderParser(verbose) {
            if (typeof verbose === "undefined") { verbose = false; }
            this.verbose = verbose;
            this.init();
        }
        HeaderParser.prototype.init = function () {
        };
        HeaderParser.prototype.parse = function (data, source) {
            data.resetFields();
            this.parser = new xm.LineParserCore(this.verbose);
            var fields = [
                'projectUrl', 
                'defAuthorUrl', 
                'defAuthorUrlAlt', 
                'reposUrl', 
                'reposUrlAlt', 
                'referencePath'
            ];
            this.parser.addParser(new xm.LineParser('any', anyGreedyCap, 0, null, [
                'head', 
                'any'
            ]));
            this.parser.addParser(new xm.LineParser('head', typeHead, 2, function (match) {
                data.name = match.getGroup(0, data.name);
                data.version = match.getGroup(1, data.version);
            }, fields));
            fields = mutate(fields, null, [
                'projectUrl'
            ]);
            this.parser.addParser(new xm.LineParser('projectUrl', projectUrl, 1, function (match) {
                data.projectUrl = match.getGroup(0, data.projectUrl).replace(endSlashTrim, '');
            }, fields));
            fields = mutate(fields, [
                'defAuthorAppend'
            ], [
                'defAuthorUrl', 
                'defAuthorUrlAlt'
            ]);
            this.parser.addParser(new xm.LineParser('defAuthorUrl', defAuthorUrl, 2, function (match) {
                data.authors.push(new deftools.DefAuthor(match.getGroup(0), match.getGroup(1)));
            }, fields));
            this.parser.addParser(new xm.LineParser('defAuthorUrlAlt', defAuthorUrlAlt, 2, function (match) {
                data.authors.push(new deftools.DefAuthor(match.getGroup(0), match.getGroup(1)));
            }, fields));
            this.parser.addParser(new xm.LineParser('defAuthorAppend', wordsUrl, 2, function (match) {
                data.authors.push(new deftools.DefAuthor(match.getGroup(0), match.getGroup(1)));
            }, fields));
            fields = mutate(fields, null, [
                'defAuthorAppend'
            ]);
            fields = mutate(fields, null, [
                'reposUrl', 
                'reposUrlAlt'
            ]);
            this.parser.addParser(new xm.LineParser('reposUrl', reposUrl, 1, function (match) {
                data.reposUrl = match.getGroup(0, data.reposUrl).replace(endSlashTrim, '');
            }, fields));
            this.parser.addParser(new xm.LineParser('reposUrlAlt', reposUrlAlt, 1, function (match) {
                data.reposUrl = match.getGroup(0, data.reposUrl).replace(endSlashTrim, '');
            }, fields));
            this.parser.addParser(new xm.LineParser('referencePath', referencePath, 1, function (match) {
                data.references.push(match.getGroup(0));
            }, [
                'referencePath'
            ]));
            this.parser.addParser(new xm.LineParser('comment', commentLine, 0, null, [
                'comment'
            ]));
            if(this.verbose) {
                console.log(this.parser.getInfo());
            }
            this.parser.parse(source, [
                'head'
            ]);
        };
        return HeaderParser;
    })();
    deftools.HeaderParser = HeaderParser;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var endSlashTrim = /\/?$/;
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
    deftools.Def = Def;    
    var DefAuthor = (function () {
        function DefAuthor(name, url, email) {
            if (typeof name === "undefined") { name = ''; }
            if (typeof url === "undefined") { url = undefined; }
            if (typeof email === "undefined") { email = undefined; }
            this.name = name;
            this.url = url;
            this.email = email;
            if(this.url) {
                this.url = this.url.replace(endSlashTrim, '');
            }
        }
        DefAuthor.prototype.toString = function () {
            return '[' + this.name + (this.email ? ' @ ' + this.email : '') + (this.url ? ' <' + this.url + '>' : '') + ']';
        };
        DefAuthor.prototype.toJSON = function () {
            var obj = {
                name: this.name
            };
            if(this.url) {
                obj.url = this.url;
            }
            if(this.email) {
                obj.email = this.email;
            }
            return obj;
        };
        return DefAuthor;
    })();
    deftools.DefAuthor = DefAuthor;    
    var DefData = (function () {
        function DefData(def) {
            this.def = def;
            this.sourcePath = '';
            this.references = [];
            this.dependencies = [];
            if(!this.def) {
            }
            this.resetAll();
        }
        DefData.prototype.resetFields = function () {
            this.name = '';
            this.version = '*';
            this.submodule = '';
            this.description = '';
            this.projectUrl = '';
            this.authors = [];
            this.reposUrl = '';
        };
        DefData.prototype.resetAll = function () {
            this.resetFields();
            this.errors = [];
            this.references = [];
            this.dependencies = [];
            this.sourcePath = '';
        };
        DefData.prototype.combi = function () {
            if(!this.def) {
                return '[' + this.name + ']';
            }
            return this.def.combi();
        };
        DefData.prototype.getDefUrl = function () {
            if(!this.reposUrl) {
                return '';
            }
            return this.reposUrl + this.def.project + '/' + this.def.name + '.d.ts';
        };
        DefData.prototype.isValid = function () {
            if(this.errors.length > 0) {
                return false;
            }
            if(!this.name || !this.version || !this.projectUrl) {
                return false;
            }
            if(this.authors.length === 0) {
                return false;
            }
            if(!this.reposUrl) {
                return false;
            }
            return true;
        };
        return DefData;
    })();
    deftools.DefData = DefData;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
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
        };
        return ImportResult;
    })();
    deftools.ImportResult = ImportResult;    
    var ImportResultDupes = (function () {
        function ImportResultDupes(res) {
            this.all = res.dupeCheck(res.all);
            this.error = res.dupeCheck(res.error);
            this.parsed = res.dupeCheck(res.parsed);
            this.requested = res.dupeCheck(res.requested);
        }
        return ImportResultDupes;
    })();
    deftools.ImportResultDupes = ImportResultDupes;    
    var DefinitionImporter = (function () {
        function DefinitionImporter(repos) {
            this.repos = repos;
            this.parser = new deftools.HeaderParser();
        }
        DefinitionImporter.prototype.parseDefinitions = function (defs, finish) {
            var self = this;
            async.reduce(defs, new ImportResult(), function (res, def, callback) {
                var key = def.combi();
                if(res.map.hasOwnProperty(key)) {
                    return callback(null, res);
                }
                var data = new deftools.DefData(def);
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
                    console.log(data.combi());
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
        DefinitionImporter.prototype.loadData = function (data, res, callback) {
            var src = path.resolve(this.repos.defs + data.def.project + '/' + data.def.name + '.d.ts');
            var key = data.def.combi();
            var self = this;
            if(res.ready.hasOwnProperty(key)) {
                data = res.ready[key];
                return callback(null, data);
            }
            res.map[key] = data;
            fs.readFile(src, 'utf8', function (err, source) {
                if(err) {
                    data.errors.push(new deftools.ParseError('cannot load source', err));
                    return callback(null, data);
                }
                data.sourcePath = src;
                self.parser.parse(data, source);
                if(!data.isValid()) {
                    data.errors.push(new deftools.ParseError('invalid parse'));
                }
                if(data.references.length > 0) {
                    async.forEach(data.references, function (ref, callback) {
                        var match, dep;
                        match = ref.match(dependency);
                        if(match && match.length >= 3) {
                            dep = new deftools.Def(match[1], match[2]);
                        } else {
                            match = ref.match(definition);
                            if(match && match.length >= 2) {
                                dep = new deftools.Def(data.def.project, match[1]);
                            }
                        }
                        if(!dep) {
                            data.errors.push(new deftools.ParseError('bad reference', ref));
                            return callback(null, data);
                        }
                        var key = dep.combi();
                        if(res.map.hasOwnProperty(key)) {
                            data.dependencies.push(res.map[key]);
                            return callback(null, res.map[key]);
                        }
                        var sub = new deftools.DefData(dep);
                        res.map[key] = sub;
                        self.loadData(sub, res, function (err, sub) {
                            if(err) {
                                if(sub) {
                                    sub.errors.push(new deftools.ParseError('cannot load dependency' + sub.combi(), err));
                                } else {
                                    data.errors.push(new deftools.ParseError('cannot load dependency', err));
                                }
                            }
                            if(!sub) {
                                data.errors.push(new deftools.ParseError('cannot load dependency', err));
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
                        if(data.references.length !== data.dependencies.length) {
                            data.errors.push(new deftools.ParseError('references/dependencies mistcount ' + data.references.length + '/' + data.dependencies.length, err));
                        }
                        process.nextTick(function () {
                            callback(err, data);
                        });
                    });
                } else {
                    process.nextTick(function () {
                        callback(null, data);
                    });
                }
            });
        };
        return DefinitionImporter;
    })();
    deftools.DefinitionImporter = DefinitionImporter;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/;
    var definition = /^([\w _-]+)\.d\.ts$/;
    var TsdImportResult = (function () {
        function TsdImportResult() {
            this.all = [];
        }
        TsdImportResult.prototype.urlMatch = function (pattern, invert, list) {
            if (typeof invert === "undefined") { invert = false; }
            if (typeof list === "undefined") { list = null; }
            list = list || this.all;
            return _.filter(list, function (value) {
                var ret = true;
                _.each(value.versions, function (version) {
                    ret = ret && (pattern.test(version.url));
                });
                if(invert) {
                    ret = !ret;
                }
                return ret;
            });
        };
        return TsdImportResult;
    })();
    deftools.TsdImportResult = TsdImportResult;    
    var TsdImporter = (function () {
        function TsdImporter(repos) {
            this.repos = repos;
        }
        TsdImporter.prototype.parseRepoData = function (names, finish) {
            var self = this;
            async.reduce(names, new TsdImportResult(), function (res, name, callback) {
                var p = path.join(self.repos.tsd, 'repo_data', name + '.json');
                fs.readFile(p, 'utf8', function (err, content) {
                    if(err) {
                        return callback(err);
                    }
                    if(!content) {
                        return callback('no content');
                    }
                    var obj;
                    try  {
                        obj = JSON.parse(content);
                    } catch (e) {
                        return callback(e);
                    }
                    if(obj) {
                        res.all.push(obj);
                    }
                    callback(null, res);
                });
            }, function (err, res) {
                finish(err, res);
            });
        };
        return TsdImporter;
    })();
    deftools.TsdImporter = TsdImporter;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    function getGUID() {
        var S4 = function () {
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
    deftools.getGUID = getGUID;
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    (function (helper) {
        function removeFilesFromDir(dir, callback) {
            dir = path.resolve(dir);
            fs.exists(dir, function (exists) {
                if(!exists) {
                    return callback('path does not exists: ' + dir, null);
                }
                async.waterfall([
                    function (callback) {
                        return fs.stat(dir, callback);
                    }, 
                    function (stats, callback) {
                        if(!stats.isDirectory()) {
                            return callback('path is not a directory: ' + dir, null);
                        }
                        return fs.readdir(dir, callback);
                    }, 
                    function (files, callback) {
                        async.forEach(files, function (file, callback) {
                            var full = path.join(dir, file);
                            fs.stat(full, function (err, stats) {
                                if(err) {
                                    return callback(err, null);
                                }
                                if(stats.isFile()) {
                                    return fs.unlink(full, callback);
                                }
                                return callback(null, null);
                            });
                        }, callback);
                    }                ], callback);
            });
        }
        helper.removeFilesFromDir = removeFilesFromDir;
    })(deftools.helper || (deftools.helper = {}));
    var helper = deftools.helper;
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var stripExt = /(\.[\w_-]+)$/;
    var ignoreFile = /^[\._]/;
    var extJson = /\.json$/;
    var extDef = /\.d\.ts$/;
    var ListLoader = (function () {
        function ListLoader(repos) {
            this.repos = repos;
        }
        ListLoader.prototype.loadRepoProjectDefs = function (project, finish) {
            project = path.basename(project);
            var ret = [];
            var self = this;
            var src = path.join(self.repos.defs, project);
            fs.exists(src, function (exists) {
                if(!exists) {
                    return finish(new Error('loadRepoProjectDefs not exists ' + src), ret);
                }
                fs.stat(src, function (err, stats) {
                    if(err) {
                        return finish(err, ret);
                    }
                    if(!stats.isDirectory()) {
                        return finish(new Error('loadRepoProjectDefs not directory ' + src), ret);
                    }
                    fs.readdir(src, function (err, files) {
                        if(err) {
                            return finish(err, ret);
                        }
                        files = _(files).filter(function (name) {
                            return extDef.test(name);
                        });
                        if(files.length == 0) {
                            return finish(null, ret);
                        }
                        async.forEach(files, function (name, callback) {
                            var tmp = path.join(src, name);
                            fs.stat(tmp, function (err, stats) {
                                if(err) {
                                    return callback(err);
                                }
                                if(stats.isDirectory()) {
                                    return callback(null);
                                }
                                ret.push(new deftools.Def(project, name.replace(extDef, '')));
                                callback(null);
                            });
                        }, function (err) {
                            finish(err, ret);
                        });
                    });
                });
            });
        };
        ListLoader.prototype.loadRepoDefs = function (finish) {
            var self = this;
            fs.readdir(self.repos.defs, function (err, files) {
                if(err) {
                    return finish(err, []);
                }
                async.reduce(files, [], function (memo, file, callback) {
                    if(ignoreFile.test(file)) {
                        return callback(null, memo);
                    }
                    var src = path.join(self.repos.defs, file);
                    fs.stat(src, function (err, stats) {
                        if(err) {
                            return callback(err, memo);
                        }
                        if(!stats.isDirectory()) {
                            return callback(null, memo);
                        }
                        self.loadRepoProjectDefs(src, function (err, res) {
                            if(err) {
                                return callback(err);
                            }
                            if(!res) {
                                return callback(new Error('loadRepoProjectDefs returns no res for ' + src));
                            }
                            _.each(res, function (def) {
                                memo.push(def);
                            });
                            callback(null, memo);
                        });
                    });
                }, function (err, memo) {
                    finish(err, memo);
                });
            });
        };
        ListLoader.prototype.loadTsdNames = function (finish) {
            var self = this;
            fs.readdir(path.join(self.repos.tsd, 'repo_data'), function (err, files) {
                if(err) {
                    return finish(err, []);
                }
                finish(null, _(files).filter(function (value) {
                    return !ignoreFile.test(value) && extJson.test(value);
                }).map(function (value) {
                    return value.replace(stripExt, '');
                }));
            });
        };
        return ListLoader;
    })();
    deftools.ListLoader = ListLoader;    
})(deftools || (deftools = {}));
var xm;
(function (xm) {
    var _ = require('underscore');
    var Command = (function () {
        function Command(id, execute, label, hint) {
            this.id = id;
            this.execute = execute;
            this.label = label;
            this.hint = hint;
        }
        Command.prototype.getLabels = function () {
            var ret = this.id;
            if(this.label) {
                ret += ' (' + this.label + ')';
            }
            if(this.hint) {
                var arr = [];
                _.forEach(this.hint, function (label, id) {
                    arr.push('     --' + id + ' ' + label + '');
                });
                if(arr.length > 0) {
                    ret += '\n' + arr.join('\n');
                }
            }
            return ret;
        };
        return Command;
    })();    
    var Expose = (function () {
        function Expose() {
            var _this = this;
            this._commands = new xm.KeyValueMap();
            this.add('help', function () {
                console.log('available commands:');
                _.forEach(_this._commands.keys().sort(), function (id) {
                    console.log('   ' + _this._commands.get(id).getLabels());
                });
            }, 'usage help');
        }
        Expose.prototype.executeArgv = function (argv, alt) {
            if(!argv || argv._.length == 0) {
                if(alt && this._commands.has(alt)) {
                    this.execute(alt);
                }
                this.execute('help');
            } else {
                if(this.has(argv._[0])) {
                    this.execute(argv._[0], argv);
                } else {
                    console.log('command not found: ' + argv._[0]);
                    this.execute('help');
                }
            }
        };
        Expose.prototype.execute = function (id, args, head) {
            if (typeof args === "undefined") { args = null; }
            if (typeof head === "undefined") { head = true; }
            if(!this._commands.has(id)) {
                console.log('\nunknown command ' + id + '\n');
                return;
            }
            if(head) {
                console.log('\n-> ' + id + '\n');
            }
            var f = this._commands.get(id);
            f.execute.call(null, args);
        };
        Expose.prototype.add = function (id, def, label, hint) {
            if(this._commands.has(id)) {
                throw new Error('id collision on ' + id);
            }
            this._commands.set(id, new Command(id, def, label, hint));
        };
        Expose.prototype.has = function (id) {
            return this._commands.has(id);
        };
        Expose.prototype.map = function (id, to) {
            var self = this;
            this.add(id, function () {
                self.execute(to, false);
            });
        };
        return Expose;
    })();
    xm.Expose = Expose;    
})(xm || (xm = {}));
var deftools;
(function (deftools) {
    var exp = {
        deftools: deftools,
        xm: xm
    };
    exports = (module).exports = exp;
    var isMain = (module) && require.main === (module);
    if(isMain || process.env['deftools-expose']) {
        var fs = require('fs');
        var path = require('path');
        var util = require('util');
        var async = require('async');
        var _ = require('underscore');
        var info = deftools.Config.getInfo();
        var paths = deftools.Config.getPaths();
        var api = new deftools.API(info, new deftools.Repos(paths.typings, paths.tsd, paths.tmp));
        var write = function (ref, obj) {
            if(ref) {
                ref = path.resolve(process.cwd(), ref);
                fs.writeFileSync(ref, JSON.stringify(obj, null, 2));
                console.log('result written as json to: ' + ref);
            }
        };
        var params = {
            write: '<path> : write to file as json',
            dump: ': dump to console'
        };
        var expose = new xm.Expose();
        expose.add('info', function (args) {
            console.log(info.getNameVersion());
            _(api.repos).keys().sort().forEach(function (value) {
                console.log('   ' + value + ': ' + api.repos[value]);
            });
        }, 'print tool info');
        expose.add('repoList', function (args) {
            api.loadRepoDefs(function (err, res) {
                if(err) {
                    return console.log(err);
                }
                if(!res) {
                    return console.log('compare returned no result');
                }
                write(args.write, res);
                if(args.dump) {
                    console.log(util.inspect(_.map(res, function (def) {
                        return def.combi();
                    }).sort(), false, 8));
                }
                console.log('repo items: ' + res.length);
            });
        }, 'list repo content', params);
        expose.add('tsdList', function (args) {
            api.loadTsdNames(function (err, res) {
                if(err) {
                    return console.log(err);
                }
                if(!res) {
                    return console.log('compare returned no result');
                }
                write(args.write, res);
                if(args.dump) {
                    console.log(util.inspect(res.sort(), false, 10));
                }
                console.log('tsd items: ' + res.length);
            });
        }, 'list TSD content', params);
        expose.add('tsdNotHosted', function (args) {
            api.tsdNotHostedInRepo(function (err, res) {
                if(err) {
                    return console.log(err);
                }
                if(!res) {
                    return console.log('tsdNotHostedInRepo returned no result');
                }
                write(args.write, res);
                if(args.dump) {
                    console.log(util.inspect(res.sort(), false, 10));
                }
                console.log('tsd not hosted: ' + res.length);
            });
        }, 'list TSD content not hosted on DefinitelyTyped', params);
        expose.add('compare', function (args) {
            api.compare(function (err, res) {
                if(err) {
                    return console.log(err);
                }
                if(!res) {
                    return console.log('compare returned no result');
                }
                write(args.write, res);
                if(args.dump) {
                    console.log(util.inspect(res, false, 10));
                }
                console.log(res.getStats());
            });
        }, 'compare repo and TSD content, print info', params);
        expose.add('repoParse', function (args) {
            var reportParseStat = function (err, res) {
                if(err) {
                    return console.log(err);
                }
                if(!res) {
                    return console.log('parseProject returned no result');
                }
                write(args.write, res);
                if(args.dump) {
                    console.log('error:\n' + util.inspect(res.error, false, 5));
                    console.log('parsed:\n' + util.inspect(res.parsed, false, 5));
                }
                console.log('isDependencyStat():\n' + util.inspect(res.isDependencyStat(), false, 5));
                console.log('hasDependencyStat():\n' + util.inspect(res.hasDependencyStat(), false, 5));
                console.log('all: ' + res.all.length);
                console.log('parsed: ' + res.parsed.length);
                console.log('error: ' + res.error.length);
                console.log('hasReference(): ' + res.hasReference().length);
                console.log('hasDependency(): ' + res.hasDependency().length);
                console.log('countReferences(): ' + res.countReferences());
                console.log('countDependencies(): ' + res.countDependencies());
                console.log('isDependency(): ' + res.isDependency().length);
                console.log('dupeCheck(): ' + _.size(res.dupeCheck()));
                console.log('checkDupes():\n' + util.inspect(res.checkDupes(), false, 4));
            };
            if(args.project) {
                api.parseProject(args.project, reportParseStat);
            } else {
                api.parseAll(reportParseStat);
            }
        }, 'parse repo typing headers', _.defaults({
            project: '<project> : project selector'
        }, params));
        expose.add('updateTsd', function (args) {
            var options = {
                parse: args.parse,
                export: args.export
            };
            api.updateTsd(options, function (err, res) {
                if(err) {
                    return console.log(err);
                }
                if(!res) {
                    return console.log('updateTSD returned no result');
                }
                write(args.write, res);
                if(args.dump) {
                    console.log(util.inspect(res, false, 10));
                }
                console.log('parse');
                console.log('   select: ' + res.importSelection.length);
                console.log('   success: ' + res.importResult.parsed.length);
                console.log('   error: ' + res.importResult.error.length);
                console.log('export');
                console.log('   select: ' + res.exportSelection.length);
                console.log('   created: ' + res.exportResult.created.length);
            });
        }, 'recreate TDS data from parsed repo content', _.defaults({
            parse: '[all | new] : parse selector',
            export: '[parsed | all | error] : export selector'
        }, params));
        exp.expose = expose;
        if(isMain) {
            expose.execute('info');
            var argv = require('optimist').argv;
            expose.executeArgv(argv, 'info');
        }
    }
})(deftools || (deftools = {}));
