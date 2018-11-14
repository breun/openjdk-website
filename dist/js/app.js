"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//     Underscore.js 1.9.1
//     http://underscorejs.org
//     (c) 2009-2018 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function () {
  // Baseline setup
  // --------------
  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  var root = (typeof self === "undefined" ? "undefined" : _typeof(self)) == 'object' && self.self === self && self || (typeof global === "undefined" ? "undefined" : _typeof(global)) == 'object' && global.global === global && global || this || {}; // Save the previous value of the `_` variable.

  var previousUnderscore = root._; // Save bytes in the minified (but not gzipped) version:

  var ArrayProto = Array.prototype,
      ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null; // Create quick reference variables for speed access to core prototypes.

  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty; // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.

  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create; // Naked function reference for surrogate-prototype-swapping.

  var Ctor = function Ctor() {}; // Create a safe reference to the Underscore object for use below.


  var _ = function _(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  }; // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)


  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }

    exports._ = _;
  } else {
    root._ = _;
  } // Current version.


  _.VERSION = '1.9.1'; // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.

  var optimizeCb = function optimizeCb(func, context, argCount) {
    if (context === void 0) return func;

    switch (argCount == null ? 3 : argCount) {
      case 1:
        return function (value) {
          return func.call(context, value);
        };
      // The 2-argument case is omitted because we’re not using it.

      case 3:
        return function (value, index, collection) {
          return func.call(context, value, index, collection);
        };

      case 4:
        return function (accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
    }

    return function () {
      return func.apply(context, arguments);
    };
  };

  var builtinIteratee; // An internal function to generate callbacks that can be applied to each
  // element in a collection, returning the desired result — either `identity`,
  // an arbitrary callback, a property matcher, or a property accessor.

  var cb = function cb(value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  }; // External wrapper for our callback generator. Users may customize
  // `_.iteratee` if they want additional predicate/iteratee shorthand styles.
  // This abstraction hides the internal-only argCount argument.


  _.iteratee = builtinIteratee = function builtinIteratee(value, context) {
    return cb(value, context, Infinity);
  }; // Some functions take a variable number of arguments, or a few expected
  // arguments at the beginning and then a variable number of values to operate
  // on. This helper accumulates all remaining arguments past the function’s
  // argument length (or an explicit `startIndex`), into an array that becomes
  // the last argument. Similar to ES6’s "rest parameter".


  var restArguments = function restArguments(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function () {
      var length = Math.max(arguments.length - startIndex, 0),
          rest = Array(length),
          index = 0;

      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }

      switch (startIndex) {
        case 0:
          return func.call(this, rest);

        case 1:
          return func.call(this, arguments[0], rest);

        case 2:
          return func.call(this, arguments[0], arguments[1], rest);
      }

      var args = Array(startIndex + 1);

      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }

      args[startIndex] = rest;
      return func.apply(this, args);
    };
  }; // An internal function for creating a new object that inherits from another.


  var baseCreate = function baseCreate(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor();
    Ctor.prototype = null;
    return result;
  };

  var shallowProperty = function shallowProperty(key) {
    return function (obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  var has = function has(obj, path) {
    return obj != null && hasOwnProperty.call(obj, path);
  };

  var deepGet = function deepGet(obj, path) {
    var length = path.length;

    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }

    return length ? obj : void 0;
  }; // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object.
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094


  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = shallowProperty('length');

  var isArrayLike = function isArrayLike(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  }; // Collection Functions
  // --------------------
  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.


  _.each = _.forEach = function (obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;

    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);

      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }

    return obj;
  }; // Return the results of applying the iteratee to each element.


  _.map = _.collect = function (obj, iteratee, context) {
    iteratee = cb(iteratee, context);

    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);

    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }

    return results;
  }; // Create a reducing function iterating left or right.


  var createReduce = function createReduce(dir) {
    // Wrap code that reassigns argument variables in a separate function than
    // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
    var reducer = function reducer(obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;

      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }

      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }

      return memo;
    };

    return function (obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  }; // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.


  _.reduce = _.foldl = _.inject = createReduce(1); // The right-associative version of reduce, also known as `foldr`.

  _.reduceRight = _.foldr = createReduce(-1); // Return the first value which passes a truth test. Aliased as `detect`.

  _.find = _.detect = function (obj, predicate, context) {
    var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
    var key = keyFinder(obj, predicate, context);
    if (key !== void 0 && key !== -1) return obj[key];
  }; // Return all the elements that pass a truth test.
  // Aliased as `select`.


  _.filter = _.select = function (obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);

    _.each(obj, function (value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });

    return results;
  }; // Return all the elements for which a truth test fails.


  _.reject = function (obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  }; // Determine whether all of the elements match a truth test.
  // Aliased as `all`.


  _.every = _.all = function (obj, predicate, context) {
    predicate = cb(predicate, context);

    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;

    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }

    return true;
  }; // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.


  _.some = _.any = function (obj, predicate, context) {
    predicate = cb(predicate, context);

    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;

    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }

    return false;
  }; // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.


  _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  }; // Invoke a method (with arguments) on every item in a collection.


  _.invoke = restArguments(function (obj, path, args) {
    var contextPath, func;

    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }

    return _.map(obj, function (context) {
      var method = func;

      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }

        if (context == null) return void 0;
        method = context[path];
      }

      return method == null ? method : method.apply(context, args);
    });
  }); // Convenience version of a common use case of `map`: fetching a property.

  _.pluck = function (obj, key) {
    return _.map(obj, _.property(key));
  }; // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.


  _.where = function (obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  }; // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.


  _.findWhere = function (obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  }; // Return the maximum element (or element-based computation).


  _.max = function (obj, iteratee, context) {
    var result = -Infinity,
        lastComputed = -Infinity,
        value,
        computed;

    if (iteratee == null || typeof iteratee == 'number' && _typeof(obj[0]) != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);

      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];

        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);

      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);

        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }

    return result;
  }; // Return the minimum element (or element-based computation).


  _.min = function (obj, iteratee, context) {
    var result = Infinity,
        lastComputed = Infinity,
        value,
        computed;

    if (iteratee == null || typeof iteratee == 'number' && _typeof(obj[0]) != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);

      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];

        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);

      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);

        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }

    return result;
  }; // Shuffle a collection.


  _.shuffle = function (obj) {
    return _.sample(obj, Infinity);
  }; // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.


  _.sample = function (obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }

    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;

    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);

      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }

    return sample.slice(0, n);
  }; // Sort the object's values by a criterion produced by an iteratee.


  _.sortBy = function (obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function (value, key, list) {
      return {
        value: value,
        index: index++,
        criteria: iteratee(value, key, list)
      };
    }).sort(function (left, right) {
      var a = left.criteria;
      var b = right.criteria;

      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }

      return left.index - right.index;
    }), 'value');
  }; // An internal function used for aggregate "group by" operations.


  var group = function group(behavior, partition) {
    return function (obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);

      _.each(obj, function (value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });

      return result;
    };
  }; // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.


  _.groupBy = group(function (result, value, key) {
    if (has(result, key)) result[key].push(value);else result[key] = [value];
  }); // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.

  _.indexBy = group(function (result, value, key) {
    result[key] = value;
  }); // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.

  _.countBy = group(function (result, value, key) {
    if (has(result, key)) result[key]++;else result[key] = 1;
  });
  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g; // Safely create a real, live array from anything iterable.

  _.toArray = function (obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);

    if (_.isString(obj)) {
      // Keep surrogate pair characters together
      return obj.match(reStrSymbol);
    }

    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  }; // Return the number of elements in an object.


  _.size = function (obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  }; // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.


  _.partition = group(function (result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true); // Array Functions
  // ---------------
  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.

  _.first = _.head = _.take = function (array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  }; // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.


  _.initial = function (array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  }; // Get the last element of an array. Passing **n** will return the last N
  // values in the array.


  _.last = function (array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  }; // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.


  _.rest = _.tail = _.drop = function (array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  }; // Trim out all falsy values from an array.


  _.compact = function (array) {
    return _.filter(array, Boolean);
  }; // Internal implementation of a recursive `flatten` function.


  var flatten = function flatten(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;

    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];

      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        // Flatten current level of array or arguments object.
        if (shallow) {
          var j = 0,
              len = value.length;

          while (j < len) {
            output[idx++] = value[j++];
          }
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }

    return output;
  }; // Flatten out an array, either recursively (by default), or just one level.


  _.flatten = function (array, shallow) {
    return flatten(array, shallow, false);
  }; // Return a version of the array that does not contain the specified value(s).


  _.without = restArguments(function (array, otherArrays) {
    return _.difference(array, otherArrays);
  }); // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // The faster algorithm will not work with an iteratee if the iteratee
  // is not a one-to-one function, so providing an iteratee will disable
  // the faster algorithm.
  // Aliased as `unique`.

  _.uniq = _.unique = function (array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }

    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];

    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;

      if (isSorted && !iteratee) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }

    return result;
  }; // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.


  _.union = restArguments(function (arrays) {
    return _.uniq(flatten(arrays, true, true));
  }); // Produce an array that contains every item shared between all the
  // passed-in arrays.

  _.intersection = function (array) {
    var result = [];
    var argsLength = arguments.length;

    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      var j;

      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }

      if (j === argsLength) result.push(item);
    }

    return result;
  }; // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.


  _.difference = restArguments(function (array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function (value) {
      return !_.contains(rest, value);
    });
  }); // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices.

  _.unzip = function (array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }

    return result;
  }; // Zip together multiple lists into a single array -- elements that share
  // an index go together.


  _.zip = restArguments(_.unzip); // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values. Passing by pairs is the reverse of _.pairs.

  _.object = function (list, values) {
    var result = {};

    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }

    return result;
  }; // Generator function to create the findIndex and findLastIndex functions.


  var createPredicateIndexFinder = function createPredicateIndexFinder(dir) {
    return function (array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;

      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }

      return -1;
    };
  }; // Returns the first index on an array-like that passes a predicate test.


  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1); // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.

  _.sortedIndex = function (array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0,
        high = getLength(array);

    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1;else high = mid;
    }

    return low;
  }; // Generator function to create the indexOf and lastIndexOf functions.


  var createIndexFinder = function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function (array, item, idx) {
      var i = 0,
          length = getLength(array);

      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }

      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }

      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }

      return -1;
    };
  }; // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.


  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex); // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).

  _.range = function (start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }

    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  }; // Chunk a single array into multiple arrays, each containing `count` or fewer
  // items.


  _.chunk = function (array, count) {
    if (count == null || count < 1) return [];
    var result = [];
    var i = 0,
        length = array.length;

    while (i < length) {
      result.push(slice.call(array, i, i += count));
    }

    return result;
  }; // Function (ahem) Functions
  // ------------------
  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments.


  var executeBound = function executeBound(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  }; // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.


  _.bind = restArguments(function (func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArguments(function (callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  }); // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder by default, allowing any combination of arguments to be
  // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.

  _.partial = restArguments(function (func, boundArgs) {
    var placeholder = _.partial.placeholder;

    var bound = function bound() {
      var position = 0,
          length = boundArgs.length;
      var args = Array(length);

      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }

      while (position < arguments.length) {
        args.push(arguments[position++]);
      }

      return executeBound(func, bound, this, this, args);
    };

    return bound;
  });
  _.partial.placeholder = _; // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.

  _.bindAll = restArguments(function (obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');

    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  }); // Memoize an expensive function by storing its results.

  _.memoize = function (func, hasher) {
    var memoize = function memoize(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };

    memoize.cache = {};
    return memoize;
  }; // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.


  _.delay = restArguments(function (func, wait, args) {
    return setTimeout(function () {
      return func.apply(null, args);
    }, wait);
  }); // Defers a function, scheduling it to run after the current call stack has
  // cleared.

  _.defer = _.partial(_.delay, _, 1); // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.

  _.throttle = function (func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function later() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function throttled() {
      var now = _.now();

      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;

      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }

      return result;
    };

    throttled.cancel = function () {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  }; // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.


  _.debounce = function (func, wait, immediate) {
    var timeout, result;

    var later = function later(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArguments(function (args) {
      if (timeout) clearTimeout(timeout);

      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function () {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  }; // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.


  _.wrap = function (func, wrapper) {
    return _.partial(wrapper, func);
  }; // Returns a negated version of the passed-in predicate.


  _.negate = function (predicate) {
    return function () {
      return !predicate.apply(this, arguments);
    };
  }; // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.


  _.compose = function () {
    var args = arguments;
    var start = args.length - 1;
    return function () {
      var i = start;
      var result = args[start].apply(this, arguments);

      while (i--) {
        result = args[i].call(this, result);
      }

      return result;
    };
  }; // Returns a function that will only be executed on and after the Nth call.


  _.after = function (times, func) {
    return function () {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  }; // Returns a function that will only be executed up to (but not including) the Nth call.


  _.before = function (times, func) {
    var memo;
    return function () {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }

      if (times <= 1) func = null;
      return memo;
    };
  }; // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.


  _.once = _.partial(_.before, 2);
  _.restArguments = restArguments; // Object Functions
  // ----------------
  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.

  var hasEnumBug = !{
    toString: null
  }.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto; // Constructor is a special case.

    var prop = 'constructor';
    if (has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];

      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }; // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`.


  _.keys = function (obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];

    for (var key in obj) {
      if (has(obj, key)) keys.push(key);
    } // Ahem, IE < 9.


    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  }; // Retrieve all the property names of an object.


  _.allKeys = function (obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];

    for (var key in obj) {
      keys.push(key);
    } // Ahem, IE < 9.


    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  }; // Retrieve the values of an object's properties.


  _.values = function (obj) {
    var keys = _.keys(obj);

    var length = keys.length;
    var values = Array(length);

    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }

    return values;
  }; // Returns the results of applying the iteratee to each element of the object.
  // In contrast to _.map it returns an object.


  _.mapObject = function (obj, iteratee, context) {
    iteratee = cb(iteratee, context);

    var keys = _.keys(obj),
        length = keys.length,
        results = {};

    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }

    return results;
  }; // Convert an object into a list of `[key, value]` pairs.
  // The opposite of _.object.


  _.pairs = function (obj) {
    var keys = _.keys(obj);

    var length = keys.length;
    var pairs = Array(length);

    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }

    return pairs;
  }; // Invert the keys and values of an object. The values must be serializable.


  _.invert = function (obj) {
    var result = {};

    var keys = _.keys(obj);

    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }

    return result;
  }; // Return a sorted list of the function names available on the object.
  // Aliased as `methods`.


  _.functions = _.methods = function (obj) {
    var names = [];

    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }

    return names.sort();
  }; // An internal function for creating assigner functions.


  var createAssigner = function createAssigner(keysFunc, defaults) {
    return function (obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;

      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;

        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }

      return obj;
    };
  }; // Extend a given object with all the properties in passed-in object(s).


  _.extend = createAssigner(_.allKeys); // Assigns a given object with all the own properties in the passed-in object(s).
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)

  _.extendOwn = _.assign = createAssigner(_.keys); // Returns the first key on an object that passes a predicate test.

  _.findKey = function (obj, predicate, context) {
    predicate = cb(predicate, context);

    var keys = _.keys(obj),
        key;

    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  }; // Internal pick helper function to determine if `obj` has key `key`.


  var keyInObj = function keyInObj(value, key, obj) {
    return key in obj;
  }; // Return a copy of the object only containing the whitelisted properties.


  _.pick = restArguments(function (obj, keys) {
    var result = {},
        iteratee = keys[0];
    if (obj == null) return result;

    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }

    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }

    return result;
  }); // Return a copy of the object without the blacklisted properties.

  _.omit = restArguments(function (obj, keys) {
    var iteratee = keys[0],
        context;

    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);

      iteratee = function iteratee(value, key) {
        return !_.contains(keys, key);
      };
    }

    return _.pick(obj, iteratee, context);
  }); // Fill in a given object with default properties.

  _.defaults = createAssigner(_.allKeys, true); // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.

  _.create = function (prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  }; // Create a (shallow-cloned) duplicate of an object.


  _.clone = function (obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  }; // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.


  _.tap = function (obj, interceptor) {
    interceptor(obj);
    return obj;
  }; // Returns whether an object has a given set of `key:value` pairs.


  _.isMatch = function (object, attrs) {
    var keys = _.keys(attrs),
        length = keys.length;

    if (object == null) return !length;
    var obj = Object(object);

    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }

    return true;
  }; // Internal recursive comparison function for `isEqual`.


  var eq, deepEq;

  eq = function eq(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b; // `null` or `undefined` only equal to itself (strict comparison).

    if (a == null || b == null) return false; // `NaN`s are equivalent, but non-reflexive.

    if (a !== a) return b !== b; // Exhaust primitive checks

    var type = _typeof(a);

    if (type !== 'function' && type !== 'object' && _typeof(b) != 'object') return false;
    return deepEq(a, b, aStack, bStack);
  }; // Internal recursive comparison function for `isEqual`.


  deepEq = function deepEq(a, b, aStack, bStack) {
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped; // Compare `[[Class]]` names.

    var className = toString.call(a);
    if (className !== toString.call(b)) return false;

    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]': // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')

      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;

      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN.
        if (+a !== +a) return +b !== +b; // An `egal` comparison is performed for other numeric values.

        return +a === 0 ? 1 / +a === 1 / b : +a === +b;

      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;

      case '[object Symbol]':
        return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
    }

    var areArrays = className === '[object Array]';

    if (!areArrays) {
      if (_typeof(a) != 'object' || _typeof(b) != 'object') return false; // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.

      var aCtor = a.constructor,
          bCtor = b.constructor;

      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && 'constructor' in a && 'constructor' in b) {
        return false;
      }
    } // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.


    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;

    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    } // Add the first object to the stack of traversed objects.


    aStack.push(a);
    bStack.push(b); // Recursively compare objects and arrays.

    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false; // Deep compare the contents, ignoring non-numeric properties.

      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a),
          key;

      length = keys.length; // Ensure that both objects contain the same number of properties before comparing deep equality.

      if (_.keys(b).length !== length) return false;

      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    } // Remove the first object from the stack of traversed objects.


    aStack.pop();
    bStack.pop();
    return true;
  }; // Perform a deep comparison to check if two objects are equal.


  _.isEqual = function (a, b) {
    return eq(a, b);
  }; // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.


  _.isEmpty = function (obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  }; // Is a given value a DOM element?


  _.isElement = function (obj) {
    return !!(obj && obj.nodeType === 1);
  }; // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray


  _.isArray = nativeIsArray || function (obj) {
    return toString.call(obj) === '[object Array]';
  }; // Is a given variable an object?


  _.isObject = function (obj) {
    var type = _typeof(obj);

    return type === 'function' || type === 'object' && !!obj;
  }; // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.


  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function (name) {
    _['is' + name] = function (obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  }); // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.


  if (!_.isArguments(arguments)) {
    _.isArguments = function (obj) {
      return has(obj, 'callee');
    };
  } // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).


  var nodelist = root.document && root.document.childNodes;

  if (typeof /./ != 'function' && (typeof Int8Array === "undefined" ? "undefined" : _typeof(Int8Array)) != 'object' && typeof nodelist != 'function') {
    _.isFunction = function (obj) {
      return typeof obj == 'function' || false;
    };
  } // Is a given object a finite number?


  _.isFinite = function (obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  }; // Is the given value `NaN`?


  _.isNaN = function (obj) {
    return _.isNumber(obj) && isNaN(obj);
  }; // Is a given value a boolean?


  _.isBoolean = function (obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  }; // Is a given value equal to null?


  _.isNull = function (obj) {
    return obj === null;
  }; // Is a given variable undefined?


  _.isUndefined = function (obj) {
    return obj === void 0;
  }; // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).


  _.has = function (obj, path) {
    if (!_.isArray(path)) {
      return has(obj, path);
    }

    var length = path.length;

    for (var i = 0; i < length; i++) {
      var key = path[i];

      if (obj == null || !hasOwnProperty.call(obj, key)) {
        return false;
      }

      obj = obj[key];
    }

    return !!length;
  }; // Utility Functions
  // -----------------
  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.


  _.noConflict = function () {
    root._ = previousUnderscore;
    return this;
  }; // Keep the identity function around for default iteratees.


  _.identity = function (value) {
    return value;
  }; // Predicate-generating functions. Often useful outside of Underscore.


  _.constant = function (value) {
    return function () {
      return value;
    };
  };

  _.noop = function () {}; // Creates a function that, when passed an object, will traverse that object’s
  // properties down the given `path`, specified as an array of keys or indexes.


  _.property = function (path) {
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }

    return function (obj) {
      return deepGet(obj, path);
    };
  }; // Generates a function for a given object that returns a given property.


  _.propertyOf = function (obj) {
    if (obj == null) {
      return function () {};
    }

    return function (path) {
      return !_.isArray(path) ? obj[path] : deepGet(obj, path);
    };
  }; // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.


  _.matcher = _.matches = function (attrs) {
    attrs = _.extendOwn({}, attrs);
    return function (obj) {
      return _.isMatch(obj, attrs);
    };
  }; // Run a function **n** times.


  _.times = function (n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);

    for (var i = 0; i < n; i++) {
      accum[i] = iteratee(i);
    }

    return accum;
  }; // Return a random integer between min and max (inclusive).


  _.random = function (min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }

    return min + Math.floor(Math.random() * (max - min + 1));
  }; // A (possibly faster) way to get the current timestamp as an integer.


  _.now = Date.now || function () {
    return new Date().getTime();
  }; // List of HTML entities for escaping.


  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };

  var unescapeMap = _.invert(escapeMap); // Functions for escaping and unescaping strings to/from HTML interpolation.


  var createEscaper = function createEscaper(map) {
    var escaper = function escaper(match) {
      return map[match];
    }; // Regexes for identifying a key that needs to be escaped.


    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function (string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };

  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap); // Traverses the children of `obj` along `path`. If a child is a function, it
  // is invoked with its parent as context. Returns the value of the final
  // child, or `fallback` if any child is undefined.

  _.result = function (obj, path, fallback) {
    if (!_.isArray(path)) path = [path];
    var length = path.length;

    if (!length) {
      return _.isFunction(fallback) ? fallback.call(obj) : fallback;
    }

    for (var i = 0; i < length; i++) {
      var prop = obj == null ? void 0 : obj[path[i]];

      if (prop === void 0) {
        prop = fallback;
        i = length; // Ensure we don't continue iterating.
      }

      obj = _.isFunction(prop) ? prop.call(obj) : prop;
    }

    return obj;
  }; // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.


  var idCounter = 0;

  _.uniqueId = function (prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  }; // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.


  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  }; // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.

  var noMatch = /(.)^/; // Certain characters need to be escaped so that they can be put into a
  // string literal.

  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    "\u2028": 'u2028',
    "\u2029": 'u2029'
  };
  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function escapeChar(match) {
    return '\\' + escapes[match];
  }; // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.


  _.template = function (text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings); // Combine delimiters into one regular expression via alternation.

    var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g'); // Compile the template source, escaping string literals appropriately.

    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      } // Adobe VMs need the match returned to produce the correct offset.


      return match;
    });
    source += "';\n"; // If a variable is not specified, place data values in local scope.

    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
    source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + 'return __p;\n';
    var render;

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function template(data) {
      return render.call(this, data, _);
    }; // Provide the compiled source as a convenience for precompilation.


    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';
    return template;
  }; // Add a "chain" function. Start chaining a wrapped Underscore object.


  _.chain = function (obj) {
    var instance = _(obj);

    instance._chain = true;
    return instance;
  }; // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  // Helper function to continue chaining intermediate results.


  var chainResult = function chainResult(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  }; // Add your own custom functions to the Underscore object.


  _.mixin = function (obj) {
    _.each(_.functions(obj), function (name) {
      var func = _[name] = obj[name];

      _.prototype[name] = function () {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      };
    });

    return _;
  }; // Add all of the Underscore functions to the wrapper object.


  _.mixin(_); // Add all mutator Array functions to the wrapper.


  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
    var method = ArrayProto[name];

    _.prototype[name] = function () {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    };
  }); // Add all accessor Array functions to the wrapper.


  _.each(['concat', 'join', 'slice'], function (name) {
    var method = ArrayProto[name];

    _.prototype[name] = function () {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  }); // Extracts the result from a wrapped and chained object.


  _.prototype.value = function () {
    return this._wrapped;
  }; // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.


  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function () {
    return String(this._wrapped);
  }; // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.


  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function () {
      return _;
    });
  }
})();
"use strict";

/* eslint-disable no-unused-vars */

/* global _ */
var platforms = [];
var variants = [];
var lookup = {};
var i = 0;
var variant = getQueryByName('variant');
var jvmVariant = getQueryByName('jvmVariant');
var jdkSelector = document.getElementById('jdk-selector');
var jvmSelector = document.getElementById('jvm-selector');
var platformSelector = document.getElementById('platform-selector');

if (jvmVariant === undefined || jvmVariant === null) {
  jvmVariant = 'hotspot';
}

if (variant === undefined || variant === null) {
  variant = 'openjdk8';
}

function setLookup() {
  // FUNCTIONS FOR GETTING PLATFORM DATA
  // allows us to use, for example, 'lookup["MAC"];'
  for (i = 0; i < platforms.length; i++) {
    lookup[platforms[i].searchableName] = platforms[i];
  }
}

function getVariantObject(variant) {
  var variantObject = '';
  variants.forEach(function (eachVariant) {
    if (eachVariant.searchableName === variant) {
      variantObject = eachVariant;
    }
  });
  return variantObject;
}

function findPlatform(binaryData) {
  var matchedPlatform = _.chain(platforms).filter(function (platform) {
    return platform.hasOwnProperty('attributes');
  }).filter(function (platform) {
    var matches = _.chain(platform.attributes).mapObject(function (attributeValue, attributeKey) {
      return binaryData[attributeKey] === attributeValue;
    }).reduce(function (memo, attributeMatches) {
      return memo && attributeMatches;
    }, true).value();

    return matches;
  }).first().value();

  return matchedPlatform === undefined ? null : matchedPlatform.searchableName;
} // set path to logos


var logoPath = './dist/assets/'; // gets the OFFICIAL NAME when you pass in 'searchableName'

function getOfficialName(searchableName) {
  return lookup[searchableName].officialName;
}

function getPlatformOrder(searchableName) {
  var index = platforms.findIndex(function (platform) {
    return platform.searchableName == searchableName;
  });
  return index;
}

function orderPlatforms(inputArray) {
  var attr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'thisPlatformOrder';

  function compareOrder(thisAsset, nextAsset) {
    if (thisAsset[attr] < nextAsset[attr]) return -1;
    if (thisAsset[attr] > nextAsset[attr]) return 1;
    return 0;
  }

  var orderedArray = inputArray.sort(compareOrder);
  return orderedArray;
} // gets the BINARY EXTENSION when you pass in 'searchableName'


function getBinaryExt(searchableName) {
  return lookup[searchableName].binaryExtension;
} // gets the INSTALLER EXTENSION when you pass in 'searchableName'


function getInstallerExt(searchableName) {
  return lookup[searchableName].installerExtension;
} // gets the LOGO WITH PATH when you pass in 'searchableName'


function getLogo(searchableName) {
  return logoPath + lookup[searchableName].logo;
} // gets the INSTALLATION COMMAND when you pass in 'searchableName'


function getInstallCommand(searchableName) {
  return lookup[searchableName].installCommand;
} // gets the CHECKSUM COMMAND when you pass in 'searchableName'


function getChecksumCommand(searchableName) {
  return lookup[searchableName].checksumCommand;
} // gets the PATH COMMAND when you pass in 'searchableName'


function getPathCommand(searchableName) {
  return lookup[searchableName].pathCommand;
} // set value for loading dots on every page


var loading = document.getElementById('loading'); // set value for error container on every page

var errorContainer = document.getElementById('error-container'); // set variable names for menu elements

var menuOpen = document.getElementById('menu-button');
var menuClose = document.getElementById('menu-close');
var menu = document.getElementById('menu-container');

menuOpen.onclick = function () {
  menu.className = menu.className.replace(/(?:^|\s)slideOutLeft(?!\S)/g, ' slideInLeft'); // slide in animation

  menu.className = menu.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated'); // removes initial hidden property, activates animations
};

menuClose.onclick = function () {
  menu.className = menu.className.replace(/(?:^|\s)slideInLeft(?!\S)/g, ' slideOutLeft'); // slide out animation
}; // this function returns an object containing all information about the user's OS (from the 'platforms' array)


function detectOS() {
  // if the platform detection library's output matches the 'osDetectionString' of any platform object in the 'platforms' array...
  // ...set the variable 'matchedOS' as the whole object. Else, 'matchedOS' will be null.
  var matchedOS = null;
  platforms.forEach(function (eachPlatform) {
    var thisPlatformMatchingString = eachPlatform.osDetectionString.toUpperCase();
    /* eslint-disable */

    var platformFamily = platform.os.family.toUpperCase(); // platform.os.family is dependent on 'platform.js', loaded by index.html (injected in index.handlebars)

    /* eslint-enable */

    if (thisPlatformMatchingString.indexOf(platformFamily) >= 0) {
      // if the detected 'platform family' string appears in the osDetectionString value of a platform...
      matchedOS = eachPlatform;
    }
  });

  if (matchedOS) {
    return matchedOS;
  } else {
    return null;
  }
}

function toJson(response) {
  while (typeof response === 'string') {
    try {
      response = JSON.parse(response);
    } catch (e) {
      return null;
    }
  }

  return response;
} // load latest_nightly.json/nightly.json/releases.json/latest_release.json files
// This will first try to load from openjdk<X>-binaries repos and if that fails
// try openjdk<X>-release, i.e will try the following:
// https://github.com/AdoptOpenJDK/openjdk10-binaries/blob/master/latest_release.json
// https://github.com/AdoptOpenJDK/openjdk10-releases/blob/master/latest_release.json


function queryAPI(release, url, openjdkImp, type, errorHandler, handleResponse) {
  if (release !== undefined) {
    url += 'release=' + release + '&';
  }

  if (openjdkImp !== undefined) {
    url += 'openjdk_impl=' + openjdkImp + '&';
  }

  if (type !== undefined) {
    url += 'type=' + type + '&';
  }

  loadUrl(url, function (response) {
    if (response === null) {
      errorHandler();
    } else {
      response = toJson(response);
      handleResponse(response, false);
    }
  });
}
/* eslint-disable no-unused-vars */


function loadAssetInfo(variant, openjdkImp, releaseType, release, type, handleResponse, errorHandler) {
  if (variant === 'amber') {
    variant = 'openjdk-amber';
  }

  var url = 'https://api.adoptopenjdk.net/v2/info/' + releaseType + '/' + variant + '?';
  queryAPI(release, url, openjdkImp, type, errorHandler, handleResponse);
}

function loadLatestAssets(variant, openjdkImp, releaseType, release, type, handleResponse, errorHandler) {
  if (variant === 'amber') {
    variant = 'openjdk-amber';
  }

  var url = 'https://api.adoptopenjdk.net/v2/latestAssets/' + releaseType + '/' + variant + '?';
  queryAPI(release, url, openjdkImp, type, errorHandler, handleResponse);
} // when using this function, pass in the name of the repo (options: releases, nightly)


function loadJSON(repo, filename, callback) {
  var url = 'https://raw.githubusercontent.com/AdoptOpenJDK/' + repo + '/master/' + filename + '.json'; // the URL of the JSON built in the website back-end

  if (repo === 'adoptopenjdk.net') {
    url = filename;
  }

  loadUrl(url, callback);
}

function loadUrl(url, callback) {
  var xobj = new XMLHttpRequest();
  xobj.open('GET', url, true);

  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == '200') {
      // if the status is 'ok', run the callback function that has been passed in.
      callback(xobj.responseText);
    } else if (xobj.status != '200' && // if the status is NOT 'ok', remove the loading dots, and display an error:
    xobj.status != '0') {
      // for IE a cross domain request has status 0, we're going to execute this block fist, than the above as well.
      callback(null);
    }
  };

  xobj.send(null);
}
/* eslint-disable no-unused-vars */


function loadPlatformsThenData(callback) {
  loadJSON('adoptopenjdk.net', './dist/json/config.json', function (response) {
    var configJson = JSON.parse(response);

    if (typeof configJson !== 'undefined') {
      // if there are releases...
      platforms = configJson.platforms;
      variants = configJson.variants;
      setRadioSelectors();
      setLookup();
      callback();
    } else {
      // report an error
      errorContainer.innerHTML = '<p>Error... there\'s a problem fetching the releases. Please see the <a href=\'https://github.com/AdoptOpenJDK/openjdk-releases/releases\' target=\'blank\'>releases list on GitHub</a>.</p>';
      loading.innerHTML = ''; // remove the loading dots
    }
  });
} // build the menu twisties


var submenus = document.getElementById('menu-content').getElementsByClassName('submenu');

for (i = 0; i < submenus.length; i++) {
  var twisty = document.createElement('span');
  var twistyContent = document.createTextNode('>');
  twisty.appendChild(twistyContent);
  twisty.className = 'twisty';
  var thisLine = submenus[i].getElementsByTagName('a')[0];
  thisLine.appendChild(twisty);

  thisLine.onclick = function () {
    this.parentNode.classList.toggle('open');
  };
}
/* eslint-disable no-unused-vars */


function setTickLink() {
  var ticks = document.getElementsByClassName('tick');

  for (i = 0; i < ticks.length; i++) {
    ticks[i].addEventListener('click', function (event) {
      var win = window.open('https://en.wikipedia.org/wiki/Technology_Compatibility_Kit', '_blank');

      if (win) {
        win.focus();
      } else {
        alert('New tab blocked - please allow popups.');
      }

      event.preventDefault();
    });
  }
} // builds up a query, i.e "...nightly.html?variant=openjdk8&jvmVariant=hotspot"


function formUrlQueryArgs(args) {
  var first = true;
  var search = '';

  for (var i = 0; i < args.length; i = i + 2) {
    var name = args[i];
    var newValue = args[i + 1];

    if (!first) {
      search += '&' + name + '=' + newValue;
    } else {
      search += name + '=' + newValue;
      first = false;
    }
  }

  return search;
}
/* eslint-disable no-unused-vars */


function getRepoName(oldRepo, releaseType) {
  var jvmVariantTag = '';

  if (oldRepo) {
    if (jvmVariant !== 'hotspot') {
      jvmVariantTag = '-' + jvmVariant;
    }

    return variant + jvmVariantTag + '-' + releaseType;
  } else {
    return variant + '-' + jvmVariant;
  }
}
/* eslint-disable no-unused-vars */


function formSearchArgs() {
  return formUrlQueryArgs(arguments);
}

function setUrlQuery() {
  window.location.search = formUrlQueryArgs(arguments);
}

function getQueryByName(name) {
  var url = window.location.href;
  name = name.replace(/[[]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  var results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
/* eslint-disable no-unused-vars */


function persistUrlQuery() {
  var anchor = '';
  var links = Array.apply(null, document.getElementsByTagName('a'));
  var link = window.location.hostname;

  if (link != 'localhost') {
    link = 'https://' + link;
  }

  links.forEach(function (eachLink) {
    if (eachLink.href.indexOf(link) >= 0) {
      if (eachLink.href.indexOf('#') > -1) {
        anchor = '#' + eachLink.href.split('#').pop();
        eachLink.href = eachLink.href.substr(0, eachLink.href.indexOf('#'));

        if (eachLink.href.indexOf('?') > -1) {
          eachLink.href = eachLink.href.substr(0, eachLink.href.indexOf('?'));
        }

        eachLink.href = eachLink.href + window.location.search + anchor;
      } else {
        eachLink.href = eachLink.href + window.location.search;
      }
    }
  });
}

var jdkMatcher = /(openjdk\d+|amber)/;
var jvmMatcher = /([a-zA-Z0-9]+)/;

function setRadioSelectors() {
  var listedVariants = [];

  function createRadioButtons(name, group, variant, element) {
    var generateButtons = true;

    if (listedVariants.length == 0) {
      generateButtons = true;
    } else {
      for (var i = 0; i < listedVariants.length; i++) {
        if (listedVariants[i] == name) {
          generateButtons = false;
        }
      }
    }

    if (generateButtons == true) {
      var btnLabel = document.createElement('label');
      btnLabel.setAttribute('class', 'btn-label');
      var input = document.createElement('input');
      input.setAttribute('type', 'radio');
      input.setAttribute('name', group);
      input.setAttribute('value', name);
      input.setAttribute('class', 'radio-button');
      input.setAttribute('lts', variant.lts);
      btnLabel.appendChild(input);

      if (group === 'jdk') {
        if (variant.lts) {
          btnLabel.innerHTML += '<span>' + variant.label + ' (LTS)</span>';
        } else {
          btnLabel.innerHTML += '<span>' + variant.label + '</span>';
        }
      } else {
        btnLabel.innerHTML += '<span>' + variant.jvm + '</span>';
      }

      element.appendChild(btnLabel);
      listedVariants.push(name);
    }
  }

  for (var x = 0; x < variants.length; x++) {
    var splitVariant = variants[x].searchableName.split('-');
    var jdkName = splitVariant[0];
    var jvmName = splitVariant[1];
    createRadioButtons(jdkName, 'jdk', variants[x], jdkSelector);
    createRadioButtons(jvmName, 'jvm', variants[x], jvmSelector);
  }

  var jdkButtons = document.getElementsByName('jdk');
  var jvmButtons = document.getElementsByName('jvm');
  var versionNumber;

  jdkSelector.onchange = function () {
    for (var i = 0; i < jdkButtons.length; i++) {
      if (jdkButtons[i].checked) {
        var matches = jdkButtons[i].value.match(jdkMatcher);
        versionNumber = matches[1];
      }
    }

    setUrlQuery('variant', versionNumber, 'jvmVariant', jvmVariant);
  };

  jvmSelector.onchange = function () {
    for (var i = 0; i < jvmButtons.length; i++) {
      if (jvmButtons[i].checked) {
        var matches = jvmButtons[i].value.match(jvmMatcher);
        jvmVariant = matches[1];
      }
    }

    setUrlQuery('variant', variant, 'jvmVariant', jvmVariant);
  };

  for (var i = 0; i < jdkButtons.length; i++) {
    if (jdkButtons[i].value == variant) {
      jdkButtons[i].setAttribute('checked', 'checked');
    }
  }

  for (var j = 0; j < jvmButtons.length; j++) {
    if (jvmButtons[j].value == jvmVariant) {
      jvmButtons[j].setAttribute('checked', 'checked');
    }
  }
}
/* eslint-disable no-unused-vars */


function copyClipboard(element) {
  var $temp = $('<input>');
  $('body').append($temp);
  $temp.val($(element).text()).select();
  document.execCommand('copy');
  $temp.remove();
  alert('Copied to clipboard');
}
/* eslint-disable no-unused-vars */


function highlightCode() {
  hljs.initHighlightingOnLoad();
}
"use strict";

var ARCHIVEDATA; // When archive page loads, run:

/* eslint-disable no-unused-vars */

function onArchiveLoad() {
  /* eslint-enable no-unused-vars */
  ARCHIVEDATA = new Object();
  populateArchive(); // populate the Archive page
} // ARCHIVE PAGE FUNCTIONS

/* eslint-disable no-undef */


function populateArchive() {
  loadPlatformsThenData(function () {
    var handleResponse = function handleResponse(response) {
      // TODO: enable this request when 'jck.json' exists.  For now the 404 just slows things down.

      /*loadJSON(getRepoName(true, 'releases'), 'jck', function (response_jck) {
        var jckJSON = {}
        if (response_jck !== null) {
          jckJSON = JSON.parse(response_jck)
        }
        buildArchiveHTML(response, jckJSON);
      });*/
      buildArchiveHTML(response, {});
    };

    loadAssetInfo(variant, jvmVariant, 'releases', undefined, undefined, handleResponse, function () {
      // if there are no releases (beyond the latest one)...
      // report an error, remove the loading dots
      loading.innerHTML = '';
      errorContainer.innerHTML = '<p>There are no archived releases yet for ' + variant + ' on the ' + jvmVariant + ' jvm. See the <a href=\'./releases.html?variant=' + variant + '&jvmVariant=' + jvmVariant + '\'>Latest release</a> page.</p>';
    });
  });
}

function buildArchiveHTML(releases, jckJSON) {
  var RELEASEARRAY = [];

  for (i = 0; i < releases.length; i++) {
    var ASSETARRAY = [];
    var RELEASEOBJECT = new Object();
    var eachRelease = releases[i]; // set values for this release, ready to inject into HTML

    var publishedAt = moment(eachRelease.timestamp);
    RELEASEOBJECT.thisReleaseName = eachRelease.release_name;
    RELEASEOBJECT.thisReleaseDate = publishedAt.toDate();
    RELEASEOBJECT.thisReleaseDay = publishedAt.format('D');
    RELEASEOBJECT.thisReleaseMonth = publishedAt.format('MMMM');
    RELEASEOBJECT.thisReleaseYear = publishedAt.format('YYYY');
    RELEASEOBJECT.thisGitLink = eachRelease.release_link;
    RELEASEOBJECT.thisDashLink = 'https://dash.adoptopenjdk.net/version.html?version=' + variant.replace('open', '') + '&tag=' + encodeURIComponent(eachRelease.release_name); // create an array of the details for each asset that is attached to this release

    var assetArray = eachRelease.binaries; // populate 'platformTableRows' with one row per binary for this release...

    assetArray.forEach(function (eachAsset) {
      var ASSETOBJECT = new Object();
      var nameOfFile = eachAsset.binary_name;
      var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase

      ASSETOBJECT.thisPlatform = findPlatform(eachAsset); // firstly, check if the platform name is recognised...

      if (ASSETOBJECT.thisPlatform) {
        // if the filename contains both the platform name and the matching INSTALLER extension, add the relevant info to the asset object
        ASSETOBJECT.thisInstallerExtension = getInstallerExt(ASSETOBJECT.thisPlatform);
        ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform); // get the file extension associated with this platform

        if (uppercaseFilename.indexOf(ASSETOBJECT.thisInstallerExtension.toUpperCase()) >= 0) {
          if (ASSETARRAY.length > 0) {
            ASSETARRAY.forEach(function (asset) {
              if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
                ASSETARRAY.pop();
              }
            });
          }

          ASSETOBJECT.thisPlatformExists = true;
          ASSETOBJECT.thisInstallerExists = true;
          RELEASEOBJECT.installersExist = true;
          ASSETOBJECT.thisInstallerLink = eachAsset.binary_link;
          ASSETOBJECT.thisInstallerSize = Math.floor(eachAsset.binary_size / 1024 / 1024);
          ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);
          ASSETOBJECT.thisBinaryExists = true;
          RELEASEOBJECT.binariesExist = true;
          ASSETOBJECT.thisBinaryLink = eachAsset.binary_link.replace(ASSETOBJECT.thisInstallerExtension, ASSETOBJECT.thisBinaryExtension);
          ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
          ASSETOBJECT.thisChecksumLink = eachAsset.checksum_link;
          ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);

          if (Object.keys(jckJSON).length == 0) {
            ASSETOBJECT.thisVerified = false;
          } else {
            if (jckJSON[eachRelease.release_name] && jckJSON[eachRelease.release_name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
              ASSETOBJECT.thisVerified = true;
            } else {
              ASSETOBJECT.thisVerified = false;
            }

            ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
          }
        } // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)


        if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
          var installerExist = false;

          if (ASSETARRAY.length > 0) {
            ASSETARRAY.forEach(function (asset) {
              if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
                installerExist = true;
              }
            });
          }

          if (!installerExist) {
            // set values ready to be injected into the HTML
            ASSETOBJECT.thisPlatformExists = true;
            ASSETOBJECT.thisBinaryExists = true;
            RELEASEOBJECT.binariesExist = true;
            ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);
            ASSETOBJECT.thisBinaryLink = eachAsset.binary_link;
            ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
            ASSETOBJECT.thisChecksumLink = eachAsset.checksum_link;
            ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);

            if (Object.keys(jckJSON).length == 0) {
              ASSETOBJECT.thisVerified = false;
            } else {
              if (jckJSON[eachRelease.release_name] && jckJSON[eachRelease.release_name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
                ASSETOBJECT.thisVerified = true;
              } else {
                ASSETOBJECT.thisVerified = false;
              }
            }
          }
        }

        if (ASSETOBJECT.thisPlatformExists === true) {
          ASSETARRAY.push(ASSETOBJECT);
        }
      }
    });
    ASSETARRAY = orderPlatforms(ASSETARRAY);
    RELEASEOBJECT.thisPlatformAssets = ASSETARRAY;
    RELEASEARRAY.push(RELEASEOBJECT);
  } // Sort releases by date/timestamp in descending order


  RELEASEARRAY.sort(function (a, b) {
    return b.thisReleaseDate - a.thisReleaseDate;
  });
  ARCHIVEDATA.htmlTemplate = RELEASEARRAY;
  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  document.getElementById('archive-table-body').innerHTML = template(ARCHIVEDATA);
  setPagination();
  setTickLink();
  loading.innerHTML = ''; // remove the loading dots
  // show the archive list and filter box, with fade-in animation

  var archiveList = document.getElementById('archive-list');
  archiveList.className = archiveList.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
}

function setPagination() {
  var container = $('#pagination-container');
  var archiveRows = document.getElementById('archive-table-body').getElementsByClassName('release-row');
  var paginationArrayHTML = [];

  for (i = 0; i < archiveRows.length; i++) {
    paginationArrayHTML.push(archiveRows[i].outerHTML);
  }

  var options = {
    dataSource: paginationArrayHTML,
    pageSize: 5,
    callback: function callback(response) {
      var dataHtml = '';
      $.each(response, function (index, item) {
        dataHtml += item;
      });
      $('#archive-table-body').html(dataHtml);
    }
  };
  container.pagination(options);

  if (document.getElementById('pagination-container').getElementsByTagName('li').length <= 3) {
    document.getElementById('pagination-container').classList.add('hide');
  }

  return container;
}
"use strict";

// set variables for all index page HTML elements that will be used by the JS
var dlText = document.getElementById('dl-text');
var dlLatest = document.getElementById('dl-latest');
var dlArchive = document.getElementById('dl-archive');
var dlOther = document.getElementById('dl-other');
var dlIcon = document.getElementById('dl-icon');
var dlIcon2 = document.getElementById('dl-icon-2');
var dlVersionText = document.getElementById('dl-version-text'); // When index page loads, run:

/* eslint-disable no-unused-vars */

function onIndexLoad() {
  setDownloadSection(); // on page load, populate the central download section.
}
/* eslint-enable no-unused-vars */
// INDEX PAGE FUNCTIONS


function removeRadioButtons() {
  var buttons = document.getElementsByClassName('btn-label');

  for (var a = 0; a < buttons.length; a++) {
    console.log(buttons[a].firstChild.getAttribute('lts'));

    if (buttons[a].firstChild.getAttribute('lts') == 'false') {
      buttons[a].style.display = 'none';
    }
  }
}
/* eslint-disable no-unused-vars */


function setDownloadSection() {
  loadPlatformsThenData(function () {
    removeRadioButtons(); // Try to match up the detected OS with a platform from 'config.json'

    var OS = detectOS();

    if (OS) {
      dlText.innerHTML = 'Download for <var platform-name>' + OS.officialName + '</var>';
    }

    dlText.classList.remove('invisible');

    var handleResponse = function handleResponse(releasesJson) {
      if (!releasesJson || !releasesJson.release_name) {
        return;
      } // TODO: enable this request when 'jck.json' exists.  For now the 404 just slows things down.

      /* eslint-disable no-undef */

      /*loadJSON(getRepoName(true, 'releases'), 'jck', function(response_jck) {
        var jckJSON = {}
        if (response_jck !== null) {
          jckJSON = JSON.parse(response_jck)
        }
        buildHomepageHTML(releasesJson, jckJSON, OS);
      });*/


      buildHomepageHTML(releasesJson, {}, OS);
    };
    /* eslint-disable no-undef */


    loadAssetInfo(variant, jvmVariant, 'releases', 'latest', undefined, handleResponse, function () {
      errorContainer.innerHTML = '<p>There are no releases available for ' + variant + ' on the ' + jvmVariant + ' jvm. Please check our <a href=nightly.html?variant=' + variant + '&jvmVariant=' + jvmVariant + ' target=\'blank\'>Nightly Builds</a>.</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}
/* eslint-disable no-unused-vars */


function buildHomepageHTML(releasesJson, jckJSON, OS) {
  // set the download button's version number to the latest release
  dlVersionText.innerHTML = releasesJson.release_name;
  var assetArray = releasesJson.binaries;
  var matchingFile = null; // if the OS has been detected...

  if (OS) {
    assetArray.forEach(function (eachAsset) {
      // iterate through the assets attached to this release
      var nameOfFile = eachAsset.binary_name;
      var uppercaseFilename = nameOfFile.toUpperCase();
      var thisPlatform = findPlatform(eachAsset);
      var uppercaseOSname = null; // firstly, check if a valid searchableName has been returned (i.e. the platform is recognised)...

      if (thisPlatform) {
        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
        var thisBinaryExtension = getBinaryExt(thisPlatform); // get the binary extension associated with this platform

        var thisInstallerExtension = getInstallerExt(thisPlatform); // get the installer extension associated with this platform

        if (matchingFile == null) {
          if (uppercaseFilename.indexOf(thisInstallerExtension.toUpperCase()) >= 0) {
            uppercaseOSname = OS.searchableName.toUpperCase();

            if (Object.keys(jckJSON).length != 0) {
              if (jckJSON[releasesJson.tag_name] && jckJSON[releasesJson.tag_name].hasOwnProperty(uppercaseOSname)) {
                document.getElementById('jck-approved-tick').classList.remove('hide');
                setTickLink();
              }
            } // thirdly, check if the user's OS searchableName string matches part of this binary's name (e.g. ...X64_LINUX...)


            if (uppercaseFilename.indexOf(uppercaseOSname) >= 0) {
              matchingFile = eachAsset; // set the matchingFile variable to the object containing this binary
            }
          } else if (uppercaseFilename.indexOf(thisBinaryExtension.toUpperCase()) >= 0) {
            uppercaseOSname = OS.searchableName.toUpperCase();

            if (Object.keys(jckJSON).length != 0) {
              if (jckJSON[releasesJson.tag_name] && jckJSON[releasesJson.tag_name].hasOwnProperty(uppercaseOSname)) {
                document.getElementById('jck-approved-tick').classList.remove('hide');
                setTickLink();
              }
            } // thirdly, check if the user's OS searchableName string matches part of this binary's name (e.g. ...X64_LINUX...)


            if (uppercaseFilename.indexOf(uppercaseOSname) >= 0) {
              matchingFile = eachAsset; // set the matchingFile variable to the object containing this binary
            }
          }
        }
      }
    });
  } // if there IS a matching binary for the user's OS...


  if (matchingFile) {
    dlLatest.href = matchingFile.binary_link; // set the main download button's link to be the binary's download url

    var thisBinarySize = Math.floor(matchingFile.binary_size / 1024 / 1024);
    dlVersionText.innerHTML += ' - ' + thisBinarySize + ' MB';
  } // if there is NOT a matching binary for the user's OS...
  else {
      dlIcon.classList.add('hide'); // hide the download icon on the main button, to make it look less like you're going to get a download immediately

      dlIcon2.classList.remove('hide'); // un-hide an arrow-right icon to show instead

      /* eslint-disable no-undef */

      dlLatest.href = './releases.html?' + formSearchArgs('variant', variant, 'jvmVariant', jvmVariant); // set the main download button's link to the latest releases page for all platforms.
    } // remove the loading dots, and make all buttons visible, with animated fade-in


  loading.classList.add('hide');
  dlLatest.className = dlLatest.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlOther.className = dlOther.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlArchive.className = dlArchive.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');

  dlLatest.onclick = function () {
    document.getElementById('installation-link').className += ' animated pulse infinite transition-bright';
  }; // animate the main download button shortly after the initial animation has finished.


  setTimeout(function () {
    dlLatest.className = 'dl-button a-button animated pulse';
  }, 1000);
}
"use strict";

var INSTALLDATA;
/* eslint-disable no-unused-vars */

function onInstallationLoad() {
  /* eslint-enable no-unused-vars */
  INSTALLDATA = new Object();
  populateInstallation(); // populate the Latest page
}
/* eslint-disable no-unused-vars */


function populateInstallation() {
  loadPlatformsThenData(function () {
    var handleResponse = function handleResponse(response) {
      buildInstallationHTML(response);
      return true;
    };
    /* eslint-disable no-undef */


    loadAssetInfo(variant, jvmVariant, 'releases', 'latest', undefined, handleResponse, function () {
      errorContainer.innerHTML = '<p>Error... no installation information has been found!</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}

function buildInstallationHTML(releasesJson) {
  // create an array of the details for each asset that is attached to a release
  var assetArray = releasesJson.binaries;
  var ASSETARRAY = []; // for each asset attached to this release, check if it's a valid binary, then add a download block for it...

  assetArray.forEach(function (eachAsset) {
    var ASSETOBJECT = new Object();
    var nameOfFile = eachAsset.binary_name;
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase

    ASSETOBJECT.thisPlatform = findPlatform(eachAsset); // check if the platform name is recognised...

    if (ASSETOBJECT.thisPlatform) {
      ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform) + ' ' + eachAsset.binary_type;
      ASSETOBJECT.thisPlatformType = (ASSETOBJECT.thisPlatform + '-' + eachAsset.binary_type).toUpperCase(); // if the filename contains both the platform name and the matching BINARY extension, add the relevant info to the asset object

      ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform);

      if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
        ASSETOBJECT.thisPlatformExists = true;
        ASSETOBJECT.thisBinaryLink = eachAsset.binary_link;
        ASSETOBJECT.thisBinaryFilename = eachAsset.binary_name;
        ASSETOBJECT.thisChecksumLink = eachAsset.checksum_link;
        ASSETOBJECT.thisChecksumFilename = eachAsset.binary_name.replace(ASSETOBJECT.thisBinaryExtension, '.sha256.txt');
        ASSETOBJECT.thisUnzipCommand = getInstallCommand(ASSETOBJECT.thisPlatform).replace('FILENAME', ASSETOBJECT.thisBinaryFilename);
        ASSETOBJECT.thisChecksumCommand = getChecksumCommand(ASSETOBJECT.thisPlatform).replace('FILENAME', ASSETOBJECT.thisBinaryFilename);
        var dirName = releasesJson.release_name + (eachAsset.binary_type === 'jre' ? '-jre' : '');
        ASSETOBJECT.thisPathCommand = getPathCommand(ASSETOBJECT.thisPlatform).replace('DIRNAME', dirName);
      }

      if (ASSETOBJECT.thisPlatformExists === true) {
        ASSETARRAY.push(ASSETOBJECT);
      }
    }
  });
  ASSETARRAY = orderPlatforms(ASSETARRAY);
  INSTALLDATA.htmlTemplate = ASSETARRAY;
  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  document.getElementById('installation-template').innerHTML = template(INSTALLDATA);
  setInstallationPlatformSelector(ASSETARRAY);
  window.onhashchange = displayInstallPlatform;
  loading.innerHTML = ''; // remove the loading dots

  var installationContainer = document.getElementById('installation-container');
  installationContainer.className = installationContainer.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
}

function displayInstallPlatform() {
  var platformHash = window.location.hash.substr(1).toUpperCase();
  var thisPlatformInstallation = document.getElementById('installation-container-' + platformHash);
  unselectInstallPlatform();

  if (thisPlatformInstallation) {
    platformSelector.value = platformHash;
    thisPlatformInstallation.classList.remove('hide');
  } else {
    var currentValues = [];
    var platformSelectorOptions = Array.apply(null, platformSelector.options);
    platformSelectorOptions.forEach(function (eachOption) {
      currentValues.push(eachOption.value);
    });
    platformSelector.value = 'unknown';
  }
}

function unselectInstallPlatform() {
  var platformInstallationDivs = document.getElementById('installation-container').getElementsByClassName('installation-single-platform');

  for (i = 0; i < platformInstallationDivs.length; i++) {
    platformInstallationDivs[i].classList.add('hide');
  }
}

function setInstallationPlatformSelector(thisReleasePlatforms) {
  if (platformSelector) {
    if (platformSelector.options.length === 1) {
      thisReleasePlatforms.forEach(function (eachPlatform) {
        var op = new Option();
        op.value = eachPlatform.thisPlatformType;
        op.text = eachPlatform.thisOfficialName;
        platformSelector.options.add(op);
      });
    }

    var OS = detectOS();

    if (OS && window.location.hash.length < 1) {
      platformSelector.value = OS.searchableName;
      window.location.hash = platformSelector.value.toLowerCase();
      displayInstallPlatform();
    } else {
      displayInstallPlatform();
    }

    platformSelector.onchange = function () {
      window.location.hash = platformSelector.value.toLowerCase();
      displayInstallPlatform();
    };
  }
}
"use strict";

// set variables for HTML elements
var NIGHTLYDATA;
var tableHead = document.getElementById('table-head');
var tableContainer = document.getElementById('nightly-list');
var nightlyList = document.getElementById('nightly-table');
var searchError = document.getElementById('search-error');
var numberpicker = document.getElementById('numberpicker');
var datepicker = document.getElementById('datepicker'); // When nightly page loads, run:

/* eslint-disable no-unused-vars */

function onNightlyLoad() {
  /* eslint-enable no-unused-vars */
  NIGHTLYDATA = new Object();
  setDatePicker();
  populateNightly(); // run the function to populate the table on the Nightly page.

  numberpicker.onchange = function () {
    setTableRange();
  };

  datepicker.onchange = function () {
    setTableRange();
  };
} // NIGHTLY PAGE FUNCTIONS


function setDatePicker() {
  $(datepicker).datepicker();
  var today = moment().format('MM/DD/YYYY');
  datepicker.value = today;
}
/* eslint-disable no-undef */


function populateNightly() {
  loadPlatformsThenData(function () {
    var handleResponse = function handleResponse(response) {
      // Step 1: create a JSON from the XmlHttpRequest response
      var releasesJson = response.reverse(); // if there are releases...

      if (typeof releasesJson[0] !== 'undefined') {
        var files = getFiles(releasesJson);

        if (files.length === 0) {
          return false;
        }

        buildNightlyHTML(files);
      }

      return true;
    };

    loadAssetInfo(variant, jvmVariant, 'nightly', undefined, undefined, handleResponse, function () {
      errorContainer.innerHTML = '<p>Error... no releases have been found!</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}
/* eslint-disable no-undef */


function getFiles(releasesJson) {
  var assets = []; // for each release...

  releasesJson.forEach(function (eachRelease) {
    // create an array of the details for each binary that is attached to a release
    var assetArray = eachRelease.binaries;
    assetArray.forEach(function (eachAsset) {
      var NIGHTLYOBJECT = new Object();
      var nameOfFile = eachAsset.binary_name;
      NIGHTLYOBJECT.thisPlatform = findPlatform(eachAsset);
      var isArchive = new RegExp('(.tar.gz|.zip)$').test(nameOfFile);
      var correctFile = isArchive; // firstly, check if the platform name is recognised...

      if (correctFile && NIGHTLYOBJECT.thisPlatform) {
        assets.push({
          release: eachRelease,
          asset: eachAsset
        });
      }
    });
  });
  return assets;
}

function buildNightlyHTML(files) {
  tableHead.innerHTML = '<tr id=\'table-header\'><th>Platform</th><th>Type</th></th><th>Date</th><th>Binary</th><th>Checksum</th></tr>';
  var NIGHTLYARRAY = []; // for each release...

  files.forEach(function (file) {
    // for each file attached to this release...
    var eachAsset = file.asset;
    var eachRelease = file.release;
    var NIGHTLYOBJECT = new Object();
    var nameOfFile = eachAsset.binary_name;
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the file uppercase

    NIGHTLYOBJECT.thisPlatform = findPlatform(eachAsset); // get the searchableName, e.g. MAC or X64_LINUX.
    // We don't use includes because IE doesn't support it well, hence we use indexOf instead

    var type = nameOfFile.indexOf('-jre') !== -1 ? 'jre' : 'jdk'; // secondly, check if the file has the expected file extension for that platform...
    // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)

    NIGHTLYOBJECT.thisBinaryExtension = getBinaryExt(NIGHTLYOBJECT.thisPlatform); // get the file extension associated with this platform

    if (uppercaseFilename.indexOf(NIGHTLYOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
      // set values ready to be injected into the HTML
      var publishedAt = eachRelease.timestamp;
      NIGHTLYOBJECT.thisReleaseName = eachRelease.release_name.slice(0, 12);
      NIGHTLYOBJECT.thisType = type;
      NIGHTLYOBJECT.thisReleaseDay = moment(publishedAt).format('D');
      NIGHTLYOBJECT.thisReleaseMonth = moment(publishedAt).format('MMMM');
      NIGHTLYOBJECT.thisReleaseYear = moment(publishedAt).format('YYYY');
      NIGHTLYOBJECT.thisGitLink = eachRelease.release_link;
      NIGHTLYOBJECT.thisOfficialName = getOfficialName(NIGHTLYOBJECT.thisPlatform);
      NIGHTLYOBJECT.thisBinaryLink = eachAsset.binary_link;
      NIGHTLYOBJECT.thisBinarySize = Math.floor(eachAsset.binary_size / 1024 / 1024);
      NIGHTLYOBJECT.thisChecksumLink = eachAsset.checksum_link;
      NIGHTLYARRAY.push(NIGHTLYOBJECT);
    }
  });
  NIGHTLYDATA.htmlTemplate = NIGHTLYARRAY;
  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  nightlyList.innerHTML = template(NIGHTLYDATA);
  setSearchLogic();
  loading.innerHTML = ''; // remove the loading dots
  // show the table, with animated fade-in

  nightlyList.className = nightlyList.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
  setTableRange(); // if the table has a scroll bar, show text describing how to horizontally scroll

  var scrollText = document.getElementById('scroll-text');
  var tableDisplayWidth = document.getElementById('nightly-list').clientWidth;
  var tableScrollWidth = document.getElementById('nightly-list').scrollWidth;

  if (tableDisplayWidth != tableScrollWidth) {
    scrollText.className = scrollText.className.replace(/(?:^|\s)hide(?!\S)/g, '');
  }
}

function setTableRange() {
  var rows = $('#nightly-table tr');
  var selectedDate = moment(datepicker.value, 'MM-DD-YYYY').format();
  var visibleRows = 0;

  for (i = 0; i < rows.length; i++) {
    var thisDate = rows[i].getElementsByClassName('nightly-release-date')[0].innerHTML;
    var thisDateMoment = moment(thisDate, 'D MMMM YYYY').format();
    var isAfter = moment(thisDateMoment).isAfter(selectedDate);

    if (isAfter === true || visibleRows >= numberpicker.value) {
      rows[i].classList.add('hide');
    } else {
      rows[i].classList.remove('hide');
      visibleRows++;
    }
  }

  checkSearchResultsExist();
}

function setSearchLogic() {
  // logic for the realtime search box...
  var $rows = $('#nightly-table tr');
  $('#search').keyup(function () {
    var val = '^(?=.*' + $.trim($(this).val()).split(/\s+/).join(')(?=.*') + ').*$',
        reg = RegExp(val, 'i'),
        text;
    $rows.show().filter(function () {
      text = $(this).text().replace(/\s+/g, ' ');
      return !reg.test(text);
    }).hide();
    checkSearchResultsExist();
  });
}

function checkSearchResultsExist() {
  var numOfVisibleRows = $('#nightly-table').find('tr:visible').length;

  if (numOfVisibleRows == 0) {
    tableContainer.style.visibility = 'hidden';
    searchError.className = '';
  } else {
    tableContainer.style.visibility = '';
    searchError.className = 'hide';
  }
}
"use strict";

// When releases page loads, run:

/* eslint-disable no-unused-vars */
function onLatestLoad() {
  /* eslint-enable no-unused-vars */
  populateLatest(); // populate the Latest page
} // LATEST PAGE FUNCTIONS

/* eslint-disable no-undef */


function populateLatest() {
  loadPlatformsThenData(function () {
    var handleResponse = function handleResponse(response) {
      // create an array of the details for each asset that is attached to a release
      if (response.length === 0) {
        return;
      }

      buildLatestHTML(response, {});
    };

    loadLatestAssets(variant, jvmVariant, 'releases', 'latest', undefined, handleResponse, function () {
      errorContainer.innerHTML = '<p>There are no releases available for ' + variant + ' on the ' + jvmVariant + ' jvm. Please check our <a href=nightly.html?variant=' + variant + '&jvmVariant=' + jvmVariant + ' target=\'blank\'>Nightly Builds</a>.</p>';
      loading.innerHTML = ''; // remove the loading dots
    });
  });
}

function buildLatestHTML(releasesJson) {
  // Populate with description
  var variantObject = getVariantObject(variant + '-' + jvmVariant);

  if (variantObject.descriptionLink) {
    document.getElementById('description_header').innerHTML = 'What is ' + variantObject.description + '?';
    document.getElementById('description_link').innerHTML = 'Find out here';
    document.getElementById('description_link').href = variantObject.descriptionLink;
  } // Array of releases that have binaries we want to display


  var releases = [];
  releasesJson.forEach(function (releaseAsset) {
    var platform = findPlatform(releaseAsset); // Skip this asset if its platform could not be matched (see the website's 'config.json')

    if (!platform) {
      return;
    } // Skip this asset if it's not a binary type we're interested in displaying


    var binary_type = releaseAsset.binary_type.toUpperCase();

    if (['INSTALLER', 'JDK', 'JRE'].indexOf(binary_type) === -1) {
      return;
    } // Get the existing release asset (passed to the template) or define a new one


    var release = releases.find(function (release) {
      return release.platform_name === platform;
    });

    if (!release) {
      release = {
        platform_name: platform,
        platform_official_name: getOfficialName(platform),
        platform_ordinal: getPlatformOrder(platform),
        platform_logo: getLogo(platform),
        release_name: releaseAsset.release_name,
        release_link: releaseAsset.release_link,
        release_datetime: moment(releaseAsset.timestamp).format('YYYY-MM-DD hh:mm:ss'),
        binaries: []
      };
    } // Add the new binary to the release asset


    release.binaries.push({
      type: binary_type,
      extension: 'INSTALLER' === binary_type ? getInstallerExt(platform) : getBinaryExt(platform),
      link: releaseAsset.binary_link,
      checksum_link: releaseAsset.checksum_link,
      size: Math.floor(releaseAsset.binary_size / 1024 / 1024)
    }); // We have the first binary, so add the release asset.

    if (release.binaries.length === 1) {
      releases.push(release);
    }
  });
  releases = orderPlatforms(releases, 'platform_ordinal');
  releases.forEach(function (release) {
    release.binaries.sort(function (binaryA, binaryB) {
      return binaryA.type > binaryB.type ? 1 : binaryA.type < binaryB.type ? -1 : 0;
    });
  });
  var templateSelector = Handlebars.compile(document.getElementById('template-selector').innerHTML);
  var templateInfo = Handlebars.compile(document.getElementById('template-info').innerHTML);
  document.getElementById('latest-selector').innerHTML = templateSelector({
    releases: releases
  });
  document.getElementById('latest-info').innerHTML = templateInfo({
    releases: releases
  });
  setTickLink();
  displayLatestPlatform();
  window.onhashchange = displayLatestPlatform;
  loading.innerHTML = ''; // remove the loading dots

  var latestContainer = document.getElementById('latest-container');
  latestContainer.className = latestContainer.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated fadeIn '); // make this section visible (invisible by default), with animated fade-in
}
/* eslint-disable no-unused-vars */


function selectLatestPlatform(thisPlatform) {
  /* eslint-enable no-unused-vars */
  window.location.hash = thisPlatform.toLowerCase();
}

function displayLatestPlatform() {
  var platformHash = window.location.hash.substr(1).toUpperCase();
  var thisPlatformInfo = document.getElementById('latest-info-' + platformHash);

  if (thisPlatformInfo) {
    unselectLatestPlatform('keep the hash');
    document.getElementById('latest-selector').classList.add('hide');
    thisPlatformInfo.classList.remove('hide');
  }
}

function unselectLatestPlatform(keephash) {
  if (!keephash) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }

  var platformButtons = document.getElementById('latest-selector').getElementsByClassName('latest-asset');
  var platformInfoBoxes = document.getElementById('latest-info').getElementsByClassName('latest-info-container');

  for (i = 0; i < platformButtons.length; i++) {
    platformInfoBoxes[i].classList.add('hide');
  }

  document.getElementById('latest-selector').classList.remove('hide');
}
"use strict";

// Freely copied, see https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses 
// https://tc39.github.io/ecma262/#sec-array.prototype.find
// We have this due to IE not supporting Array.prototype.find correctly
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function value(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this); // 2. Let len be ? ToLength(? Get(O, "length")).

      var len = o.length >>> 0; // 3. If IsCallable(predicate) is false, throw a TypeError exception.

      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      } // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.


      var thisArg = arguments[1]; // 5. Let k be 0.

      var k = 0; // 6. Repeat, while k < len

      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];

        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        } // e. Increase k by 1.


        k++;
      } // 7. Return undefined.


      return undefined;
    },
    configurable: true,
    writable: true
  });
}
"use strict";

// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function value(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this); // 2. Let len be ? ToLength(? Get(O, "length")).

      var len = o.length >>> 0; // 3. If IsCallable(predicate) is false, throw a TypeError exception.

      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      } // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.


      var thisArg = arguments[1]; // 5. Let k be 0.

      var k = 0; // 6. Repeat, while k < len

      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];

        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        } // e. Increase k by 1.


        k++;
      } // 7. Return -1.


      return -1;
    }
  });
}