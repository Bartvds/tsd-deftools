var deftools;
(function (deftools) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
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
            loader.loadRepoProjectDefs(project, null, function (err, res) {
                if(err) {
                    return callback(err);
                }
                if(!res) {
                    return callback('loader.loadRepoProjectDefs returned no result');
                }
                importer.parseDefinitions(res, callback);
            });
        };
        API.prototype.recreateAll = function (callback) {
            var comparer = new deftools.DefinitionComparer(this.repos);
            var importer = new deftools.DefinitionImporter(this.repos);
            var exporter = new deftools.DefinitionExporter(this.repos, this.info);
            async.waterfall([
                function (callback) {
                    comparer.compare(callback);
                }, 
                function (res, callback) {
                    if(!res) {
                        return callback('DefinitionComparer.compare returned no result');
                    }
                    console.log(res.getStats());
                    importer.parseDefinitions(res.repoAll, callback);
                }, 
                function (res, callback) {
                    if(!res) {
                        return callback('DefinitionImporter.parseDefinitions returned no result');
                    }
                    console.log('error: ' + res.error.length);
                    console.log('parsed: ' + res.parsed.length);
                    deftools.helper.removeFilesFromDir(exporter.repos.out, function (err) {
                        if(err) {
                            return callback(err, null);
                        }
                        exporter.exportDefinitions(res.all, callback);
                    });
                }            ], callback);
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
            return new deftools.ToolInfo(pkg.name, pkg.version, pkg);
        }
        Config.getInfo = getInfo;
    })(deftools.Config || (deftools.Config = {}));
    var Config = deftools.Config;
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
                "generated": this.info.getNameVersion() + ' @ ' + new Date().toUTCString(),
                "valid": header.isValid(),
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
                        "author": header.authorName,
                        "author_url": header.authorUrl
                    }
                ]
            };
            return ret;
        };
        return Encode;
    })();
    deftools.Encode = Encode;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var _ = require('underscore');
    var LineParserCore = (function () {
        function LineParserCore() {
            this.matchers = {
            };
            this.parsers = {
            };
            this.trimmedine = /^([\ t]*)?(\S+(?:[ \t]+\S+)*)*[ \t]*$/gm;
        }
        LineParserCore.prototype.addMatcher = function (type) {
            this.matchers[type.type] = type;
        };
        LineParserCore.prototype.addParser = function (parser) {
            this.parsers[parser.id] = parser;
        };
        LineParserCore.prototype.info = function () {
            var ret = {
            };
            ret.types = _.keys(this.matchers).sort();
            ret.parsers = _.keys(this.parsers).sort();
            return ret;
        };
        LineParserCore.prototype.getMatcher = function (type) {
            if(!this.matchers.hasOwnProperty(type)) {
                console.log('missing matcher id ' + type);
                return null;
            }
            return this.matchers[type];
        };
        LineParserCore.prototype.getParser = function (id) {
            if(!this.parsers.hasOwnProperty(id)) {
                console.log('missing parser id ' + id);
                return null;
            }
            return this.parsers[id];
        };
        LineParserCore.prototype.link = function () {
            var self = this;
            _.each(this.parsers, function (parser) {
                parser.matcher = self.getMatcher(parser.type);
                _.each(parser.nextIds, function (type) {
                    var p = self.getParser(type);
                    if(p) {
                        parser.next.push(p);
                    }
                });
            });
        };
        LineParserCore.prototype.get = function (ids) {
            var self = this;
            return _.reduce(ids, function (memo, id) {
                if(!self.parsers.hasOwnProperty(id)) {
                    console.log('missing parser ' + id);
                    return memo;
                }
                memo.push(self.parsers[id]);
                return memo;
            }, []);
        };
        LineParserCore.prototype.all = function () {
            return _.toArray(this.parsers);
        };
        LineParserCore.prototype.listIds = function (parsers) {
            return _.reduce(parsers, function (memo, parser) {
                memo.push(parser.id);
                return memo;
            }, []);
        };
        LineParserCore.prototype.parse = function (source, asType) {
            console.log('source');
            console.log(source.length);
            this.link();
            var res = [];
            var possibles = asType ? this.get(asType) : this.all();
            var line;
            var offset = 0;
            var end = 0;
            var count = 0;
            this.trimmedine.lastIndex = 0;
            while(line = this.trimmedine.exec(source)) {
                end = line.index + line.length;
                this.trimmedine.lastIndex = end;
                count++;
                if(line.length < 2) {
                    continue;
                }
                if(typeof line[2] === 'undefined') {
                    continue;
                }
                var text = line[2];
                console.log('line ' + count);
                var choice = [];
                _.reduce(possibles, function (memo, parser) {
                    var res = parser.match(text, offset, end);
                    if(res) {
                        console.log('match at line ' + count + ' ' + offset + '-' + end + ' ' + parser.getName());
                        memo.push(res);
                    }
                    return memo;
                }, choice);
                console.log('choices ' + choice.length);
                if(choice.length == 0) {
                    possibles = [];
                } else if(choice.length == 1) {
                    console.log('single match line');
                    console.log(choice[0]);
                    possibles = choice[0].parser.next;
                    console.log('switching possibles ' + this.listIds(possibles));
                } else {
                    console.log('multi match line');
                    console.log(choice);
                }
                if(possibles.length == 0) {
                    console.log('no more possibles');
                    break;
                }
            }
            console.log('lines' + count);
            return res;
        };
        return LineParserCore;
    })();
    deftools.LineParserCore = LineParserCore;    
    var LineParserMatcher = (function () {
        function LineParserMatcher(type, exp, extractor) {
            this.type = type;
            this.exp = exp;
            this.extractor = extractor;
        }
        LineParserMatcher.prototype.match = function (str, offset, limit) {
            this.exp.lastIndex = offset;
            return this.exp.exec(str);
        };
        LineParserMatcher.prototype.getName = function () {
            return this.type + ':' + this.exp;
        };
        return LineParserMatcher;
    })();
    deftools.LineParserMatcher = LineParserMatcher;    
    var LineParser = (function () {
        function LineParser(id, type, callback, nextIds) {
            if (typeof nextIds === "undefined") { nextIds = []; }
            this.id = id;
            this.type = type;
            this.callback = callback;
            this.nextIds = nextIds;
            this.next = [];
        }
        LineParser.prototype.match = function (str, offset, limit) {
            if(!this.matcher) {
                return null;
            }
            var match = this.matcher.match(str, offset, limit);
            if(!match) {
                return null;
            }
            return new LineParserMatch(this, match);
        };
        LineParser.prototype.getName = function () {
            return this.id + ':' + this.type + '/' + (this.matcher ? this.matcher.getName() : 'unlinked');
        };
        return LineParser;
    })();
    deftools.LineParser = LineParser;    
    var LineParserMatch = (function () {
        function LineParserMatch(parser, match) {
            this.parser = parser;
            this.match = match;
        }
        LineParserMatch.prototype.execute = function (parent) {
            return this.parser.callback(this.match, parent, this.parser);
        };
        LineParserMatch.prototype.getName = function () {
            return this.parser.getName();
        };
        return LineParserMatch;
    })();
    deftools.LineParserMatch = LineParserMatch;    
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
                _this.parts.push('' + value);
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
                expTrim.lastIndex = 0;
                var trim = expTrim.exec('' + exp);
                if(!trim) {
                    return;
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
var deftools;
(function (deftools) {
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
    deftools.HeaderData = HeaderData;    
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
    var typeHead = /^([ \t]*)?(\/\/\/?[ \t]*Type definitions?[ \t]*(?:for)?:?[ \t]+)([\w\._-]*(?:[ \t]*[\w\._-]+))[ \t]([\w\._-]*(?:[ \t]*[\w\._-]+))[ \t]v?[ \t]*(\d+(?:\.\d+)*)?[ \t]*[<\[\{\(]?([\w\._-]*(?:[ \t]*[\w\._-]+))*[ \t]*[\)\}\]>]?[ \t]*(\S*(?:[ \t]*\S+)*)[ \t]*$/;
    var HeaderParser = (function () {
        function HeaderParser() {
        }
        HeaderParser.prototype.parse = function (data, source) {
            console.log('parse');
            console.log(data.combi());
            var parser = new deftools.LineParserCore();
            var space = /[ \t]+/;
            var spaceOpt = /[ \t]*/;
            var commentStart = /^[ \t]*?\/\/+[ \t]*/;
            var headStart = /Type definitions?[ \t]*(?:for)?:?[ \t]*/;
            var exp;
            var glue;
            glue = xm.RegExpGlue.get();
            glue.append();
            exp = xm.RegExpGlue.get().join();
            parser.addMatcher(new deftools.LineParserMatcher('comment', /^[ \t]*(\/\/+[ \t]*(.*))[ \t]*$/, function (match) {
            }));
            parser.addMatcher(new deftools.LineParserMatcher('headNameVersion', typeHead, function (match) {
            }));
            parser.addParser(new deftools.LineParser('head', 'headNameVersion', function (match, parent, parser) {
                console.log('apply');
                console.log(parser.getName());
                console.log(match);
                console.log(parser.matcher.extractor(match));
            }, [
                'comment'
            ]));
            parser.addParser(new deftools.LineParser('comment', 'comment', function (match, parent, parser) {
                console.log('apply');
                console.log(parser.getName());
                console.log(match);
                console.log(parser.matcher.extractor(match));
            }, [
                'comment'
            ]));
            console.log(parser.info());
            parser.parse(source, [
                'head'
            ]);
            return data;
        };
        return HeaderParser;
    })();
    deftools.HeaderParser = HeaderParser;    
    var HeaderParserOri = (function () {
        function HeaderParserOri() {
            this.nameVersion = /^[ \t]*\/\/\/?[ \t]*Type definitions[ \t]*for?:?[ \t]+([\w\._ -]+)[ \t]+(\d+\.\d+\.?\d*\.?\d*)[ \t]*[<\[\{\(]?([\w \t_-]+)*[\)\}\]>]?[ \t]*$/gm;
            this.labelUrl = /^[ \t]*\/\/\/?[ \t]*([\w _-]+):?[ \t]+[<\[\{\(]?(http[\S]*)[ \t]*$/gm;
            this.authorNameUrl = /^[ \t]*\/\/\/?[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?[ \t]*$/gm;
            this.description = /^[ \t]*\/\/\/?[ \t]*Description[ \t]*:[ \t]+([\S *]*\S)[ \t]*$/gm;
            this.referencePath = /^[ \t]*\/\/\/\/?[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
            this.endSlash = /\/?$/;
            this.cursor = 0;
        }
        HeaderParserOri.prototype.reset = function () {
            this.cursor = 0;
        };
        HeaderParserOri.prototype.moveCursor = function (index) {
            this.cursor += index;
            this.applyCursor();
        };
        HeaderParserOri.prototype.setCursor = function (index) {
            this.cursor = index;
            this.applyCursor();
        };
        HeaderParserOri.prototype.applyCursor = function () {
            this.nameVersion.lastIndex = this.cursor;
            this.labelUrl.lastIndex = this.cursor;
            this.authorNameUrl.lastIndex = this.cursor;
            this.description.lastIndex = this.cursor;
            this.referencePath.lastIndex = this.cursor;
        };
        HeaderParserOri.prototype.parse = function (data, str) {
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
        return HeaderParserOri;
    })();
    deftools.HeaderParserOri = HeaderParserOri;    
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
        DefinitionImporter.prototype.parseDefinitions = function (projects, finish) {
            var self = this;
            async.reduce(projects, new ImportResult(), function (res, def, callback) {
                var key = def.combi();
                if(res.map.hasOwnProperty(key)) {
                    return callback(null, res);
                }
                var data = new deftools.HeaderData(def);
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
                data.source = src;
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
                        var sub = new deftools.HeaderData(dep);
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
                        callback(err, data);
                    });
                } else {
                    return callback(null, data);
                }
            });
        };
        return DefinitionImporter;
    })();
    deftools.DefinitionImporter = DefinitionImporter;    
})(deftools || (deftools = {}));
var deftools;
(function (deftools) {
    var path = require('path');
    var fs = require('fs');
    var trailSlash = /(\w)(\/?)$/;
    var ConfPaths = (function () {
        function ConfPaths() { }
        return ConfPaths;
    })();
    deftools.ConfPaths = ConfPaths;    
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
        ListLoader.prototype.loadRepoProjectDefs = function (project, into, finish) {
            console.log('loadRepoProjectDefs');
            console.log(project);
            into = into || [];
            project = path.basename(project);
            var self = this;
            var src = path.join(self.repos.defs, project);
            fs.exists(src, function (exists) {
                if(!exists) {
                    return finish('not exists', into);
                }
                fs.stat(src, function (err, stats) {
                    if(err) {
                        return finish(err, into);
                    }
                    if(!stats.isDirectory()) {
                        return finish('not directory', into);
                    }
                    fs.readdir(src, function (err, files) {
                        if(err) {
                            return finish(err, into);
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
                                into.push(new deftools.Def(project, name.replace(extDef, '')));
                                callback(null);
                            });
                        }, function (err) {
                            finish(err, into);
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
                var ret = [];
                async.forEach(files, function (file, callback) {
                    if(ignoreFile.test(file)) {
                        return callback(false);
                    }
                    self.loadRepoProjectDefs(file, ret, function (err, res) {
                        if(err) {
                            return callback(false);
                        }
                        if(!res) {
                            return callback(false);
                        }
                        _.each(res, function (def) {
                            ret.push(def);
                        });
                        callback(null);
                    });
                }, function (err) {
                    finish(err, ret);
                });
            });
        };
        ListLoader.prototype.loadTsdNames = function (finish) {
            var self = this;
            fs.readdir(self.repos.tsd + 'repo_data', function (err, files) {
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
exports = (module).exports = deftools;
