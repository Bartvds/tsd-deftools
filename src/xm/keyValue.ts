module xm {

	var hasOwnProp:(v:string) => void = Object.prototype.hasOwnProperty;

	export interface IKeyValueMap {
		has (key:string):bool;
		get(key:string, alt?:any):any;
		set (key:string, value:any);
		remove (key:string);
		keys ():string[];
		values ():any[];
		import (data:any, keys?:string[]):void;
		export (keys?:string[]):any;
		clear (keep?:string[]);
	}

	export class KeyValueMap {

		_prefix:string = '';
		//need proper type
		_store;

		constructor(data?:any) {
			this._store = {};
			if (data) {
				this.import(data);
			}
		}

		has(key:string):bool {
			if (typeof key === 'undefined') {
				return false;
			}
			key = this._prefix + key;
			return hasOwnProp.call(this._store, key);
		}

		get(key:string, alt?:any = undefined):any {
			if (typeof key === 'undefined') {
				return alt;
			}
			key = this._prefix + key;
			if (hasOwnProp.call(this._store, key)) {
				return this._store[key];
			}
			return alt;
		}

		set(key:string, value:any) {
			if (typeof key === 'undefined') {
				return;
			}
			key = this._prefix + key;
			this._store[key] = value;
		}

		remove(key:string) {
			if (typeof key === 'undefined') {
				return;
			}
			key = this._prefix + key;
			if (hasOwnProp.call(this._store, key)) {
				delete this._store[key];
			}
		}

		keys():string[] {
			//chop prefix
			var len = this._prefix.length;
			var ret:string[] = [];
			for (var key in this._store) {
				if (hasOwnProp.call(this._store, key)) {
					ret.push(key.substr(len));
				}
			}
			return ret;
		}

		values(allow?:string[]):any {
			var keys = this.keys();
			var ret = [];
			for (var i = 0, ii = keys.length; i < ii; i++) {
				var key = keys[i];
				if (!allow || allow.indexOf(key) > -1) {
					ret.push(this.get(key));
				}
			}
			return ret;
		}

		clear(keep?:string[]) {
			var keys = this.keys();
			for (var i = 0, ii = keys.length; i < ii; i++) {
				var key = keys[i];
				if (!keep || keep.indexOf(key) > -1) {
					this.remove(key);
				}
			}
		}

		import(data:any, allow?) {
			if (typeof data !== 'object') {
				return;
			}
			for (var key in data) {
				if (hasOwnProp.call(data, key) && (!allow || allow.indexOf(key) > -1)) {
					this.set(key, data[key]);
				}
			}
		}

		export(allow?:string[]):any {
			var ret:any = {};
			var keys = this.keys();
			for (var i = 0, ii = keys.length; i < ii; i++) {
				var key = keys[i];
				if (!allow || allow.indexOf(key) > -1) {
					ret[key] = this.get(key);
				}
			}
			return ret;
		}
	}
}