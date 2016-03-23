
// UMD boilerplate from https://github.com/umdjs/umd - "commonjsStrict.js" template
;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    factory(exports);
  } else {
    // Browser globals
    factory((root.jsdataframe = {}));
  }
}(this, function (exports) {
"use strict";

var jd = exports;


/*=============================================================================

 #####  ######  ####  #        ##   #####    ##   ##### #  ####  #    #  ####
 #    # #      #    # #       #  #  #    #  #  #    #   # #    # ##   # #
 #    # #####  #      #      #    # #    # #    #   #   # #    # # #  #  ####
 #    # #      #      #      ###### #####  ######   #   # #    # #  # #      #
 #    # #      #    # #      #    # #   #  #    #   #   # #    # #   ## #    #
 #####  ######  ####  ###### #    # #    # #    #   #   #  ####  #    #  ####

*/

/*-----------------------------------------------------------------------------
* Define prototypes (instead of constructor functions)
*/

var vectorProto = {};
var numVecProto = Object.create(vectorProto);
var boolVecProto = Object.create(vectorProto);
var strVecProto = Object.create(vectorProto);
var dateVecProto = Object.create(vectorProto);

var dfProto = {};


/*-----------------------------------------------------------------------------
* Constants
*/

var VALID_DTYPES = Object.create(null);
VALID_DTYPES.number = true;
VALID_DTYPES.boolean = true;
VALID_DTYPES.string = true;
VALID_DTYPES.date = true;
VALID_DTYPES.object = true;

var NA_VALUE = {
  number: NaN,
  boolean: null,
  string: null,
  date: null,
  object: null
};

var PROTO_MAP = {
  number: numVecProto,
  boolean: boolVecProto,
  string: strVecProto,
  date: dateVecProto,
  object: vectorProto
};

var COERCE_FUNC = {
  number: coerceToNum,
  boolean: coerceToBool,
  string: coerceToStr,
  date: coerceToDate,
  object: function(x) { return x; }
};


/*=============================================================================

  ####  #####   ##   ##### #  ####     ###### #    # #    #  ####   ####
 #        #    #  #    #   # #    #    #      #    # ##   # #    # #
  ####    #   #    #   #   # #         #####  #    # # #  # #       ####
      #   #   ######   #   # #         #      #    # #  # # #           #
 #    #   #   #    #   #   # #    #    #      #    # #   ## #    # #    #
  ####    #   #    #   #   #  ####     #       ####  #    #  ####   ####

*/

/*-----------------------------------------------------------------------------
* Vector Creation
*/

jd.vector = function(array, dtype, copyArray) {
  if (!Array.isArray(array)) {
    throw new Error('"array" argument must be an Array');
  }
  if (isUndefined(copyArray) || copyArray) {
    array = array.slice();
  }
  if (isUndefined(dtype)) {
    dtype = null;
  }
  return (dtype === null) ?
    inferVectorDtype(array) :
    enforceVectorDtype(array, dtype);
};


jd.seq = function(start, stop, step, includeStop) {
  if (arguments.length === 1) {
    stop = start;
    start = 0;
  }
  step = isUndefined(step) ? 1 : step;
  includeStop = isUndefined(includeStop) ? false : includeStop;

  // Validate step sign
  if (step === 0) {
    throw new Error('"step" must be nonzero');
  }
  if (start < stop && step < 0) {
    throw new Error('"step" must be positive when start < stop');
  }
  if (start > stop && step > 0) {
    throw new Error('"step" must be negative when start > stop');
  }

  // Generate sequence
  var array = [];
  var curr = start;
  while (
    step > 0 ?
      (includeStop ? curr <= stop : curr < stop) :
      (includeStop ? curr >= stop : curr > stop)
  ) {
    array.push(curr);
    curr += step;
  }

  return newVector(array, 'number');
};


jd.seqOut = function(start, step, lengthOut) {
  // Validate arguments
  start = +start;
  step = +step;
  validateNonnegInt(lengthOut, 'lengthOut');

  // Generate sequence
  var array = allocArray(lengthOut);
  var curr = start;
  for (var i = 0; i < lengthOut; i++) {
    array[i] = curr;
    curr += step;
  }

  return newVector(array, 'number');
};


jd.linspace = function(start, stop, length) {
  // Validate arguments
  start = +start;
  stop = +stop;
  validateNonnegInt(length, 'length');

  // Generate sequence
  var array = allocArray(length);
  var step = (length === 1) ? 0 : (stop - start) / (length - 1);
  for (var i = 0; i < length; i++) {
    array[i] = start + i * step;
  }

  return newVector(array, 'number');
};


jd.rep = function(values, times) {
  validateNonnegInt(times, 'times');
  values = ensureVector(values);

  var inputArr = values.values;
  var inputLength = inputArr.length;

  var outputArr = allocArray(inputLength * times);
  for (var repInd = 0; repInd < times; repInd++) {
    var offset = repInd * inputLength;
    for (var inputInd = 0; inputInd < inputLength; inputInd++) {
      outputArr[offset + inputInd] = inputArr[inputInd];
    }
  }

  return newVector(outputArr, values.dtype);
};


jd.repEach = function(values, times) {
  validateNonnegInt(times, 'times');
  values = ensureVector(values);

  var inputArr = values.values;
  var inputLength = inputArr.length;

  var outputArr = allocArray(inputLength * times);
  for (var inputInd = 0; inputInd < inputLength; inputInd++) {
    var offset = inputInd * times;
    for (var repInd = 0; repInd < times; repInd++) {
      outputArr[offset + repInd] = inputArr[inputInd];
    }
  }

  return newVector(outputArr, values.dtype);
};


jd.repNa = function(times, dtype) {
  validateNonnegInt(times, 'times');
  validateDtype(dtype);
  var naValue = NA_VALUE[dtype];

  var array = allocArray(times);
  for (var i = 0; i < times; i++) {
    array[i] = naValue;
  }

  return newVector(array, dtype);
};


/*=============================================================================

 #    # ######  ####  #####  ####  #####
 #    # #      #    #   #   #    # #    #
 #    # #####  #        #   #    # #    #
 #    # #      #        #   #    # #####
  #  #  #      #    #   #   #    # #   #
   ##   ######  ####    #    ####  #    #

*/

vectorProto.type = 'Vector';
vectorProto.dtype = 'object';

// Initializes the vector instance's properties
vectorProto._init = function(array) {
  this.values = array;
};


vectorProto.size = function() {
  return this.values.length;
};

vectorProto.copy = function() {
  // TODO
};

vectorProto.append = function() {
  // TODO
};


/*-----------------------------------------------------------------------------
* Conversion
*/

vectorProto.toArray = function() {
  return this.values.slice();
};


vectorProto.toDtype = function(dtype) {
  if (this.dtype === dtype) {
    return this;
  }
  return jd.vector(this.values, dtype);
};


vectorProto.serialize = function() {
  // TODO
};


/*-----------------------------------------------------------------------------
* Missing Values
*/

vectorProto.isNa = function() {
  return newVector(this.values.map(isMissing), 'boolean');
};


vectorProto.dropNa = function() {
  return this.filter(isNotMissing);
};
function isNotMissing(value) {
  return !isMissing(value);
}


vectorProto.replaceNa = function(value) {
  var coerceFunc = COERCE_FUNC[this.dtype];
  value = coerceFunc(value);

  var array = this.values.slice();
  for (var i = 0; i < array.length; i++) {
    if (isMissing(array[i])) {
      array[i] = value;
    }
  }
  return newVector(array, this.dtype);
};


/*-----------------------------------------------------------------------------
* Subset Selection / Modification
*/

vectorProto.s = function() {
  // TODO
};

vectorProto.sMod = function() {
  // TODO
};

vectorProto.at = function() {
  // TODO
};

vectorProto.head = function() {
  // TODO
};

vectorProto.tail = function() {
  // TODO
};

vectorProto.ifElse = function() {
  // TODO
};


/*-----------------------------------------------------------------------------
* Array.prototype Adaptations
*/

vectorProto.map = function() {
  var array = Array.prototype.map.apply(this.values, arguments);
  return inferVectorDtype(array, this.dtype);
};


vectorProto.reduce = function() {
  return Array.prototype.reduce.apply(this.values, arguments);
};


vectorProto.reduceRight = function() {
  return Array.prototype.reduceRight.apply(this.values, arguments);
};


vectorProto.findIndex = function() {
  return Array.prototype.findIndex.apply(this.values, arguments);
};


vectorProto.concat = function() {
  // TODO
};


vectorProto.sort = function(compareFunction) {
  if (isUndefined(compareFunction)) {
    compareFunction = compare;
  }
  var array = this.values.slice();
  Array.prototype.sort.call(array, compareFunction);
  return newVector(array, this.dtype);
};


vectorProto.reverse = function() {
  var array = this.values.slice();
  Array.prototype.reverse.call(array);
  return newVector(array, this.dtype);
};


vectorProto.filter = function() {
  var array = Array.prototype.filter.apply(this.values, arguments);
  return newVector(array, this.dtype);
};


/*-----------------------------------------------------------------------------
* Comparison
*/

vectorProto.eq = function(other) {
  other = ensureVector(other, this.dtype);
  var outputLen = validateArrayLengths(this.size(), other.size());
  if (this.dtype !== other.dtype) {
    return jd.repNa(outputLen, 'boolean');
  }
  var array = (this.dtype === 'object') ?
    combineArrays(this.values, other.values, null, elemObjEq) :
    combineArrays(this.values, other.values, null, elemEq);
  return newVector(array, 'boolean');
};
function elemEq(x, y) {
  return compare(x, y) === 0;
}
// Returns true if x === y or if x and y are both NaN.  This is meant
// for shallow equals over elements with "object" dtype only.
function elemObjEq(x, y) {
  return (Number.isNaN(x) && Number.isNaN(y)) || x === y;
}


vectorProto.neq = function(other) {
  return this.eq(other).not();
};


vectorProto.lt = function(other) {
  other = ensureVector(other, this.dtype);
  var outputLen = validateArrayLengths(this.size(), other.size());
  if (this.dtype !== other.dtype) {
    return jd.repNa(outputLen, 'boolean');
  }
  var array = combineArrays(this.values, other.values, null, elemLt);
  return newVector(array, 'boolean');
};
function elemLt(x, y) {
  return compare(x, y) < 0;
}


vectorProto.gt = function(other) {
  other = ensureVector(other, this.dtype);
  var outputLen = validateArrayLengths(this.size(), other.size());
  if (this.dtype !== other.dtype) {
    return jd.repNa(outputLen, 'boolean');
  }
  var array = combineArrays(this.values, other.values, null, elemGt);
  return newVector(array, 'boolean');
};
function elemGt(x, y) {
  return compare(x, y) > 0;
}


vectorProto.lte = function(other) {
  return this.lt(other).or(this.eq(other));
};


vectorProto.gte = function(other) {
  return this.gt(other).or(this.eq(other));
};


vectorProto.between = function(lower, upper, inclusive) {
  // TODO
};


vectorProto.equals = function(other, tolerance) {
  if (isMissing(other) || other.type !== 'Vector' ||
    this.size() !== other.size() || this.dtype !== other.dtype) {
    return false;
  }
  if (this === other) {
    return true;
  }

  var eqFunc = elemEq;
  if (this.dtype === 'number') {
    eqFunc = isUndefined(tolerance) ? numClose :
      function(x, y) {
        return (Number.isNaN(x) && Number.isNaN(y)) ||
          Math.abs(x - y) <= tolerance;
      };
  } else if (this.dtype === 'object'){
    eqFunc = elemObjEq;
  }

  var array1 = this.values;
  var array2 = other.values;
  for (var i = 0; i < array1.length; i++) {
    if (!eqFunc(array1[i], array2[i])) {
      return false;
    }
  }
  return true;
};
// Returns true if x and y are within 1e-7 tolerance or are both NaN
function numClose(x, y) {
  return (Number.isNaN(x) && Number.isNaN(y)) ||
    Math.abs(x - y) <= 1e-7;
}


/*-----------------------------------------------------------------------------
* Order-based
*/

vectorProto.min = function(skipNa) {
  var ind = this.idxMin(skipNa);
  return Number.isNaN(ind) ? NA_VALUE[this.dtype] : this.values[ind];
};


vectorProto.max = function(skipNa) {
  var ind = this.idxMax(skipNa);
  return Number.isNaN(ind) ? NA_VALUE[this.dtype] : this.values[ind];
};


vectorProto.cuMin = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  var array = skipNa ?
    cumulativeReduce(this.values, elemMin) :
    cumulativeReduce(this.values, NA_VALUE[this.dtype], elemMin);
  return newVector(array, this.dtype);
};
function elemMin(x, y) {
  return compare(y, x) < 0 ? y : x;
}


vectorProto.cuMax = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  var array = skipNa ?
    cumulativeReduce(this.values, elemMax) :
    cumulativeReduce(this.values, NA_VALUE[this.dtype], elemMax);
  return newVector(array, this.dtype);
};
function elemMax(x, y) {
  return compare(y, x) > 0 ? y : x;
}


vectorProto.idxMin = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  var thisArray = this.values;
  var minIndex = NaN;
  var minValue = null;
  for (var i = 0; i < thisArray.length; i++) {
    var currVal = thisArray[i];
    if (!isMissing(currVal)) {
      if (compare(currVal, minValue) < 0 || Number.isNaN(minIndex)) {
        minValue = currVal;
        minIndex = i;
      }
    } else if (!skipNa) {
      return NaN;
    }
  }
  return minIndex;
};

vectorProto.idxMax = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  var thisArray = this.values;
  var maxIndex = NaN;
  var maxValue = null;
  for (var i = 0; i < thisArray.length; i++) {
    var currVal = thisArray[i];
    if (!isMissing(currVal)) {
      if (compare(currVal, maxValue) > 0 || Number.isNaN(maxIndex)) {
        maxValue = currVal;
        maxIndex = i;
      }
    } else if (!skipNa) {
      return NaN;
    }
  }
  return maxIndex;
};


vectorProto.pMin = function(other) {
  other = ensureVector(other, this.dtype);
  validateVectorIsDtype(other, this.dtype);
  var array = combineArrays(this.values, other.values, NA_VALUE[this.dtype],
    elemMin);
  return newVector(array, this.dtype);
};


vectorProto.pMax = function(other) {
  other = ensureVector(other, this.dtype);
  validateVectorIsDtype(other, this.dtype);
  var array = combineArrays(this.values, other.values, NA_VALUE[this.dtype],
    elemMax);
  return newVector(array, this.dtype);
};


vectorProto.clip = function(lower, upper) {
  lower = ensureVector(lower, this.dtype);
  upper = ensureVector(upper, this.dtype);
  validateVectorIsDtype(lower, this.dtype);
  validateVectorIsDtype(upper, this.dtype);
  if (lower.gt(upper).any()) {
    throw new Error('found one more elements where lower > upper');
  }
  return this.pMax(lower).pMin(upper);
};


vectorProto.rank = function() {
  // TODO
};


/*-----------------------------------------------------------------------------
* Computations
*/

vectorProto.isIn = function() {
  // TODO
};

vectorProto.valueCounts = function() {
  // TODO
};

vectorProto.combine = function() {
  // TODO
};

vectorProto.unique = function() {
  // TODO
};

vectorProto.duplicated = function() {
  // TODO
};

vectorProto.intersect = function() {
  // TODO
};

vectorProto.replace = function() {
  // TODO
};

vectorProto.describe = function() {
  // TODO
};


/*=============================================================================

 #    # #    # #    #    #    # ######  ####
 ##   # #    # ##  ##    #    # #      #    #
 # #  # #    # # ## #    #    # #####  #
 #  # # #    # #    #    #    # #      #
 #   ## #    # #    #     #  #  #      #    #
 #    #  ####  #    #      ##   ######  ####

*/

numVecProto.dtype = 'number';


/*=============================================================================

 #####   ####   ####  #         #    # ######  ####
 #    # #    # #    # #         #    # #      #    #
 #####  #    # #    # #         #    # #####  #
 #    # #    # #    # #         #    # #      #
 #    # #    # #    # #          #  #  #      #    #
 #####   ####   ####  ######      ##   ######  ####

*/

boolVecProto.dtype = 'boolean';


boolVecProto.and = function(other) {
  other = ensureVector(other, 'boolean');
  validateVectorIsDtype(other, 'boolean');
  var array = combineArrays(this.values, other.values, boolAnd);
  return newVector(array, 'boolean');
};
function boolAnd(x, y) {
  return (
    x === false || y === false ? false :
    x === null || y === null ? null :
    true
  );
}


boolVecProto.or = function(other) {
  other = ensureVector(other, 'boolean');
  validateVectorIsDtype(other, 'boolean');
  var array = combineArrays(this.values, other.values, boolOr);
  return newVector(array, 'boolean');
};
function boolOr(x, y) {
  return (
    x === true || y === true ? true :
    x === null || y === null ? null :
    false
  );
}


boolVecProto.not = function() {
  var array = mapNonNa(this.values, null, boolNot);
  return newVector(array, 'boolean');
};
function boolNot(x) {
  return !x;
}


boolVecProto.xor = function(other) {
  other = ensureVector(other, 'boolean');
  validateVectorIsDtype(other, 'boolean');
  var array = combineArrays(this.values, other.values, boolXor);
  return newVector(array, 'boolean');
};
function boolXor(x, y) {
  return (
    x === null || y === null ? null :
    x !== y
  );
}


boolVecProto.all = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = false;
  }
  return skipNa ?
    reduceNonNa(this.values, true, boolAnd) :
    this.values.reduce(boolAnd, true);
};


boolVecProto.any = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = false;
  }
  return skipNa ?
    reduceNonNa(this.values, false, boolOr) :
    this.values.reduce(boolOr, false);
};


boolVecProto.sum = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  if (skipNa) {
    return reduceNonNa(this.values, 0, boolSum);
  } else {
    var result = reduceUnless(this.values, 0, isMissing, boolSum);
    return result === null ? NaN : result;
  }
};
function boolSum(x, y) {
  return (+x) + (+y);
}


boolVecProto.which = function() {
  var array = [];
  for (var i = 0; i < this.values.length; i++) {
    var value = this.values[i];
    if (value === true) {
      array.push(i);
    }
  }
  return newVector(array, 'number');
};


/*=============================================================================

  ####  ##### #####     #    # ######  ####
 #        #   #    #    #    # #      #    #
  ####    #   #    #    #    # #####  #
      #   #   #####     #    # #      #
 #    #   #   #   #      #  #  #      #    #
  ####    #   #    #      ##   ######  ####

*/

strVecProto.dtype = 'string';


/*=============================================================================

 #####    ##   ##### ######    #    # ######  ####
 #    #  #  #    #   #         #    # #      #    #
 #    # #    #   #   #####     #    # #####  #
 #    # ######   #   #         #    # #      #
 #    # #    #   #   #          #  #  #      #    #
 #####  #    #   #   ######      ##   ######  ####

*/

dateVecProto.dtype = 'date';


/*=============================================================================

 #####    ##   #####   ##   ###### #####    ##   #    # ######
 #    #  #  #    #    #  #  #      #    #  #  #  ##  ## #
 #    # #    #   #   #    # #####  #    # #    # # ## # #####
 #    # ######   #   ###### #      #####  ###### #    # #
 #    # #    #   #   #    # #      #   #  #    # #    # #
 #####  #    #   #   #    # #      #    # #    # #    # ######

*/

dfProto.type = 'DataFrame';


/*=============================================================================

 #    # ###### #      #####  ###### #####   ####
 #    # #      #      #    # #      #    # #
 ###### #####  #      #    # #####  #    #  ####
 #    # #      #      #####  #      #####       #
 #    # #      #      #      #      #   #  #    #
 #    # ###### ###### #      ###### #    #  ####

*/

jd._private_export = {};


// Defines which values are considered "missing" in jsdataframe
function isMissing(value) {
  return value === null || isUndefined(value) || Number.isNaN(value);
}


// Allocates a new array for the given number of elements.
// We define a function in case we want to tune our preallocation
// strategy later.  (e.g. http://www.html5rocks.com/en/tutorials/speed/v8/)
function allocArray(numElems) {
  return new Array(numElems);
}


// Constructs a vector of the given dtype backed by the given array
// without checking or modifying any of the array elements
function newVector(array, dtype) {
  validateDtype(dtype);
  var proto = PROTO_MAP[dtype];
  var vector = Object.create(proto);
  vector._init(array);
  return vector;
}


// Maps the 'func' on all non-missing elements of array while immediately
// yielding 'naValue' instead of applying 'func' for any missing elements.
// The returned result will be a new array of the same length as 'array'.
function mapNonNa(array, naValue, func) {
  var len = array.length;
  var result = allocArray(len);
  for (var i = 0; i < len; i++) {
    var value = array[i];
    result[i] = isMissing(value) ? naValue : func(value);
  }
  return result;
}
jd._private_export.mapNonNa = mapNonNa;


// Performs a left-to-right reduce on 'array' using 'func' starting with
// 'initValue' while skipping over any missing values.  If there are no
// non-missing values then the result is simply 'initValue'.
function reduceNonNa(array, initValue, func) {
  var result = initValue;
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (!isMissing(value)) {
      result = func(result, value);
    }
  }
  return result;
}
jd._private_export.reduceNonNa = reduceNonNa;

// Performs a left-to-right reduce on 'array' using 'func' starting with
// 'initValue' unless there's an element for which 'condFunc' returns truthy,
// in which case this element is immediately returned, halting the rest
// of the reduction.  For an empty array 'initValue' is immediaately returned.
function reduceUnless(array, initValue, condFunc, func) {
  var result = initValue;
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (condFunc(value)) {
      return value;
    }
    result = func(result, value);
  }
  return result;
}
jd._private_export.reduceUnless = reduceUnless;


// Applies the given 'func' to each pair of elements from the 2 given arrays
// and yields a new array with the results.  The lengths of the input arrays
// must either be identical or one of the arrays must have length 1, in which
// case that single value will be repeated for the length of the other array.
// The 'naValue' argument is optional.  If present, any pair of elements
// with either value missing will immediately result in 'naValue' without
// evaluating 'func'.  If 'naValue' isn't specified, 'func' will be applied
// to all pairs of elements.
function combineArrays(array1, array2, naValue, func) {
  var skipMissing = true;
  if (isUndefined(func)) {
    func = naValue;
    skipMissing = false;
  }

  var arr1Len = array1.length;
  var arr2Len = array2.length;
  var outputLen = validateArrayLengths(arr1Len, arr2Len);
  var isSingleton1 = (arr1Len === 1);
  var isSingleton2 = (arr2Len === 1);

  var result = allocArray(outputLen);
  for (var i = 0; i < outputLen; i++) {
    var val1 = isSingleton1 ? array1[0] : array1[i];
    var val2 = isSingleton2 ? array2[0] : array2[i];
    if (skipMissing && (isMissing(val1) || isMissing(val2))) {
      result[i] = naValue;
    } else {
      result[i] = func(val1, val2);
    }
  }
  return result;
}
jd._private_export.combineArrays = combineArrays;


// Applies the given 'func' to reduce each element in 'array', returning
// the cumulative results in a new array.  The 'naValue' argument
// is optional.  Any missing value will result in a corresponding
// missing element in the output, but if 'naValue' isn't specified,
// the 'func' reduction will still be carried out on subsequent
// non-missing elements.  On the other hand, if 'naValue' is supplied
// it will be used as the output value for all elements following
// the first missing value encountered.
function cumulativeReduce(array, naValue, func) {
  var skipMissing = false;
  if (isUndefined(func)) {
    func = naValue;
    skipMissing = true;
  }

  var outputLen = array.length;
  var result = allocArray(outputLen);

  var accumulatedVal = undefined;
  var foundNonMissing = false;
  for (var i = 0; i < outputLen; i++) {
    var currVal = array[i];
    if (isMissing(currVal)) {
      result[i] = currVal;
      if (!skipMissing) {
        // Fill the rest of the array with naValue and break;
        for (var j = i + 1; j < outputLen; j++) {
          result[j] = naValue;
        }
        break;
      }
    } else {
      accumulatedVal = foundNonMissing ?
        func(accumulatedVal, currVal) :
        currVal;
      foundNonMissing = true;
      result[i] = accumulatedVal;
    }
  }
  return result;
}


/*-----------------------------------------------------------------------------
* Dtype helpers
*/

// Returns the dtype of 'value' or null if inconclusive
function inferDtype(value) {
  return (
    (value === null || isUndefined(value)) ? null :
    isNumber(value) ? 'number' :
    isBoolean(value) ? 'boolean' :
    isString(value) ? 'string' :
    isDate(value) ? 'date' :
    'object'
  );
}
jd._private_export.inferDtype = inferDtype;


// Creates a new vector backed by the given array after coercing each
// element to the given dtype.
function enforceVectorDtype(array, dtype) {
  validateDtype(dtype);
  var coerceFunc = COERCE_FUNC[dtype];

  // Coerce all elements to dtype
  for (var i = 0; i < array.length; i++) {
    array[i] = coerceFunc(array[i]);
  }

  // Construct vector
  return newVector(array, dtype);
}


// Creates a new vector backed by the given array by inferring the dtype
// based on the array's values.  The first value for which 'inferDtype' is
// conclusive determines the dtype for the entire vector, and all elements
// are coerced to this inferred dtype.  The 'defaultDtype' argument
// determines the resulting dtype only if all values are inconclusive.
// If 'defaultDtype' is undefined it will default to 'object'.
function inferVectorDtype(array, defaultDtype) {
  if (isUndefined(defaultDtype)) {
    defaultDtype = 'object';
  }
  var dtype = null;
  var coerceFunc = null;

  // Coerce all elements to dtype upon inferring it
  for (var i = 0; i < array.length; i++) {
    if (coerceFunc === null) {
      var inferredDtype = inferDtype(array[i]);
      if (inferredDtype !== null) {
        dtype = inferredDtype;
        coerceFunc = COERCE_FUNC[dtype];
        // Apply inferred dtype to all previous elements
        for (var j = 0; j <= i; j++) {
          array[j] = coerceFunc(array[j]);
        }
      }
    } else {
      array[i] = coerceFunc(array[i]);
    }
  }

  // Use 'defaultDtype' if all inferences were inconclusive
  if (dtype === null) {
    dtype = defaultDtype;

    // Make sure all values are normalized to the right missing value dtype
    if (dtype !== 'object') {
      var naValue = NA_VALUE[dtype];
      for (i = 0; i < array.length; i++) {
        array[i] = naValue;
      }
    }
  }

  // Construct vector
  return newVector(array, dtype);
}
jd._private_export.inferVectorDtype = inferVectorDtype;


function coerceToNum(value) {
  return (
    isMissing(value) ? NA_VALUE.number :
    +value
  );
}
jd._private_export.coerceToNum = coerceToNum;


function coerceToBool(value) {
  return (
    isMissing(value) ? NA_VALUE.boolean :
    !!value
  );
}
jd._private_export.coerceToBool = coerceToBool;


function coerceToStr(value) {
  return (
    isMissing(value) ? NA_VALUE.string :
    isDate(value) ? value.toISOString() :
    value.toString()
  );
}
jd._private_export.coerceToStr = coerceToStr;


function coerceToDate(value) {
  if (isMissing(value)) {
    return NA_VALUE.date;
  }
  var result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}
jd._private_export.coerceToDate = coerceToDate;


/*-----------------------------------------------------------------------------
* Sorting helpers
*/

// Sort order within different types of missing values
var MISSING_ORDER = {
  undefined: 0,
  null: 1,
  NaN: 2
};

// Comparison function for Array.prototype.sort().
// This sorts number, boolean, string, or Date values via their
// natural ascending order, with any missing values showing up first.
// The intention is to impose a natural total ordering of
// all elements within a particular non-object dtype, including the dtype's
// missing value.  The result of compare(a, b) should be 0 if and only if
// a and b have equal values (e.g. deep equality for Dates).
// All bets are off comparing elements across different dtypes though.
function compare(a, b) {
  var aMissing = isMissing(a);
  var bMissing = isMissing(b);
  if (aMissing && bMissing) {
    a = MISSING_ORDER[a];
    b = MISSING_ORDER[b];
  } else if (aMissing) {
    return -1;
  } else if (bMissing) {
    return 1;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}
jd._private_export.compare = compare;


// Returns a new compare function for Array.prototype.sort() that
// reverses the order of the given compareFunc
function reverseComp(compareFunc) {
  return function(a, b) {
    return -compareFunc(a, b);
  };
}
jd._private_export.reverseComp = reverseComp;


/*-----------------------------------------------------------------------------
* Validations
*/

// Returns undefined or throws an error if invalid
function validateDtype(dtype) {
  if (!(dtype in VALID_DTYPES)) {
    throw new Error('invalid dtype: "' + dtype + '"');
  }
}

// Returns undefined or throws an error if invalid
function validateNonnegInt(value, varName) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('"' + varName + '" must be a nonnegative integer');
  }
}

// Returns undefined or throws an error if invalid
function validateVectorIsDtype(vector, dtype) {
  if (vector.dtype !== dtype) {
    throw new Error('expected vector dtype to be ' + dtype + ' but got ' +
      vector.dtype);
  }
}

// Returns the compatible output vector length for element-wise operation
// on vectors of length 'len1' and 'len2' or throws an error if incompatible
function validateArrayLengths(len1, len2) {
  var outputLen = len1;
  if (len1 !== len2) {
    if (len1 === 1) {
      outputLen = len2;
    } else if (len2 !== 1) {
      throw new Error('incompatible array lengths: ' + len1 + ' and ' +
        len2);
    }
  }
  return outputLen;
}

// Returns a vector representing the given values, which can be either
// a vector, array, or scalar.
// If already a vector, this vector is simply returned.
// If an array, it's converted to a vector with inferred dtype.
// If a scalar, it's wrapped in an array and converted to a vector also.
// The defaultDtype is used only if all values are missing.  It defaults
// to 'object' if undefined.
function ensureVector(values, defaultDtype) {
  if (isMissing(values) || values.type !== 'Vector') {
    values = Array.isArray(values) ?
      inferVectorDtype(values.slice(), defaultDtype) :
      inferVectorDtype([values], defaultDtype);
  }
  return values;
}
jd._private_export.ensureVector = ensureVector;


/*-----------------------------------------------------------------------------
* Utilities
*/

function readOnlyEnumProp(value) {
  return {
    enumerable: true,
    configurable: false,
    writable: false,
    value: value
  };
}

function isNumber(obj) {
  return Object.prototype.toString.call(obj) === '[object Number]';
}

function isBoolean(obj) {
  return Object.prototype.toString.call(obj) === '[object Boolean]';
}

function isString(obj) {
  return Object.prototype.toString.call(obj) === '[object String]';
}

function isDate(obj) {
  return Object.prototype.toString.call(obj) === '[object Date]';
}

function isUndefined(obj) {
  return obj === void 0;
}


/*-----------------------------------------------------------------------------
* Polyfills
*/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
Number.isNaN = Number.isNaN || function(value) {
  return value !== value;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
Number.isInteger = Number.isInteger || function(value) {
  return typeof value === "number" &&
    isFinite(value) &&
    Math.floor(value) === value;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}


}));
