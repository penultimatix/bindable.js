// Generated by CoffeeScript 1.6.2
(function() {
  var PropertyWatcher, options, poolParty, propertyWatcher, type,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  poolParty = require("poolparty");

  type = require("type-component");

  options = require("../utils/options");

  PropertyWatcher = (function() {
    /*
    */
    function PropertyWatcher(options) {
      this._changed = __bind(this._changed, this);      this.reset(options);
    }

    /*
    */


    PropertyWatcher.prototype.reset = function(options) {
      this.target = options.target;
      this.watch = options.watch;
      this.path = options.path;
      this.index = options.index;
      this.root = options.root || this;
      this.delay = options.delay;
      this.property = this.path[this.index];
      this.callback = options.callback;
      this._children = [];
      this._bindings = [];
      this._value = void 0;
      this._watching = false;
      this._updating = false;
      if (this._each = this.property.substr(0, 1) === "@") {
        this.property = this.property.substr(1);
      }
      return this._watch();
    };

    /*
    */


    PropertyWatcher.prototype.value = function() {
      var values;

      values = [];
      this._addValues(values);
      if (values.length > 1) {
        return values;
      } else {
        return values[0];
      }
    };

    /*
    */


    PropertyWatcher.prototype._addValues = function(values) {
      var child, _i, _len, _ref;

      if (!this._children.length) {
        values.push(this._value);
        return;
      }
      _ref = this._children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        child._addValues(values);
      }
      return void 0;
    };

    /*
    */


    PropertyWatcher.prototype._dispose = function() {
      var binding, child, _i, _j, _len, _len1, _ref, _ref1, _ref2;

      this._disposed = true;
      if ((_ref = this._listener) != null) {
        _ref.dispose();
      }
      this._listener = void 0;
      _ref1 = this._bindings;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        binding = _ref1[_i];
        binding.dispose();
      }
      _ref2 = this._children;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        child = _ref2[_j];
        child.dispose();
      }
      this._children = [];
      return this._bindings = [];
    };

    /*
    */


    PropertyWatcher.prototype.dispose = function() {
      this._dispose();
      return propertyWatcher.add(this);
    };

    /*
    */


    PropertyWatcher.prototype._update = function() {
      var _this = this;

      if (!~this.delay) {
        this._watch();
        this.callback();
        return;
      }
      if (this._updating) {
        return;
      }
      this._updating = true;
      return setTimeout((function() {
        if (_this._disposed) {
          return;
        }
        _this._watch();
        return _this.callback();
      }), this.delay);
    };

    /*
    */


    PropertyWatcher.prototype._watch = function() {
      var nt, ref, t, value, _i, _len, _ref;

      this._updating = false;
      if (this.target) {
        if (this.target.__isBindable) {
          if ((nt = this.target.get()).__isBindable) {
            this.target = nt;
          }
          this.watch = this.target;
          this.childPath = this.path.slice(this.index);
          this.childIndex = 1;
          value = this.target.get(this.property);
        } else {
          value = this.target[this.property];
          this.childPath = this.path;
          this.childIndex = this.index + 1;
        }
      } else {
        this.childPath = this.path;
        this.childIndex = this.index + 1;
      }
      if (this._listener) {
        this._dispose();
      }
      this._value = value;
      if (((t = type(value)) === "function") && value.refs) {
        _ref = value.refs;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ref = _ref[_i];
          this._watchRef(ref);
        }
      }
      this._listener = this.watch.on("change:" + (this.childPath.slice(0, this.childIndex - 1).concat(this.property).join(".")), this._changed);
      if (this._each) {
        return this._watchEachValue(value, t);
      } else {
        return this._watchValue(value);
      }
    };

    /*
    */


    PropertyWatcher.prototype._watchEachValue = function(fnOrArray, t) {
      if (!~this.root.delay) {
        this.root.delay = options.computedDelay;
      }
      switch (t) {
        case "function":
          return this._callEach(fnOrArray);
        case "array":
          return this._loopEach(fnOrArray);
        case "undefined":
          break;
        default:
          throw Error("'@" + this._property + "' is a " + t + ". '@" + this._property + "' must be either an array, or function.");
      }
    };

    /*
     asynchronous
    */


    PropertyWatcher.prototype._callEach = function(fn) {
      var _this = this;

      this._value = [];
      return fn.call(this.target, function(value) {
        _this._value.push(value);
        return _this._watchValue(value);
      });
    };

    /*
     synchronous
    */


    PropertyWatcher.prototype._loopEach = function(values) {
      var value, _i, _len, _results;

      _results = [];
      for (_i = 0, _len = values.length; _i < _len; _i++) {
        value = values[_i];
        _results.push(this._watchValue(value));
      }
      return _results;
    };

    /*
    */


    PropertyWatcher.prototype._watchValue = function(value) {
      if (this.childIndex < this.childPath.length) {
        return this._children.push(propertyWatcher.create({
          watch: this.watch,
          target: value,
          path: this.childPath,
          index: this.childIndex,
          callback: this.callback,
          root: this.root,
          delay: this.delay
        }));
      }
    };

    /*
    */


    PropertyWatcher.prototype._watchRef = function(ref) {
      return this._bindings.push(propertyWatcher.create({
        target: this.root.target,
        path: ref.split("."),
        index: 0,
        callback: this._changed,
        delay: this.delay
      }));
    };

    /*
    */


    PropertyWatcher.prototype._changed = function(_value) {
      this._value = _value;
      return this.root._update();
    };

    return PropertyWatcher;

  })();

  propertyWatcher = module.exports = poolParty({
    max: 100,
    factory: function(options) {
      return new PropertyWatcher(options);
    },
    recycle: function(watcher, options) {
      return watcher.reset(options);
    }
  });

}).call(this);