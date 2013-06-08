module xm {

	var hasOwnProp:(v:string) => void = Object.prototype.hasOwnProperty;

	export interface IKeyValueMap {
		has (id:string):bool;
		get(id:string, alt?:any):any;
		set (id:string, value:any);
		remove (id:string);
		keys ():string[];
		clear (keep?);
	}

	export class KeyValueMap {

		_prefix:string = '$_';
		//need proper type
		_store;

		constructor(store?:any) {
			this._store = store || {};
		}

		has(id:string):bool {
			if (typeof id === 'undefined') {
				return false;
			}
			id = this._prefix + id;
			return hasOwnProp.call(this._store, id);
		}

		get(id:string, alt?:any = undefined):any {
			if (typeof id === 'undefined') {
				return alt;
			}
			id = this._prefix + id;
			if (hasOwnProp.call(this._store, id)) {
				return this._store[id];
			}
			return alt;
		}

		set(id:string, value:any) {
			if (typeof id === 'undefined') {
				return;
			}
			id = this._prefix + id;
			this._store[id] = value;
		}

		remove(id:string) {
			if (typeof id === 'undefined') {
				return;
			}
			id = this._prefix + id;
			if (hasOwnProp.call(this._store, id)) {
				delete this._store[id];
			}
		}

		keys():string[] {
			//chop prefix
			var len = this._prefix.length;
			var ret:string[] = [];
			for (var id in this._store) {
				if (hasOwnProp.call(this._store, id)) {
					ret.push(id.substr(len));
				}
			}
			return ret;
		}

		clear(keep?) {
			var len = this._prefix.length;
			var keys = this.keys();
			for (var i = 0, ii = keys.length; i < ii; i++) {
				var id = keys[i].substr(len);
				if (!keep || keep.indexOf(id) > -1) {
					this.remove(id);
				}
			}
		}
	}
}