
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
  // TODO
};

vectorProto.dropNa = function() {
  // TODO
};

vectorProto.fillNa = function() {
  // TODO
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
  // TODO
};

vectorProto.reduce = function() {
  // TODO
};

vectorProto.reduceRight = function() {
  // TODO
};

vectorProto.findIndex = function() {
  // TODO
};

vectorProto.concat = function() {
  // TODO
};

vectorProto.sort = function() {
  // TODO
};

vectorProto.reverse = function() {
  // TODO
};

vectorProto.filter = function() {
  // TODO
};


/*-----------------------------------------------------------------------------
* Comparison
*/

vectorProto.eq = function() {
  // TODO
};

vectorProto.neq = function() {
  // TODO
};

vectorProto.lt = function() {
  // TODO
};

vectorProto.gt = function() {
  // TODO
};

vectorProto.lte = function() {
  // TODO
};

vectorProto.gte = function() {
  // TODO
};

vectorProto.between = function() {
  // TODO
};

vectorProto.equals = function() {
  // TODO
};


/*-----------------------------------------------------------------------------
* Order-based
*/

vectorProto.min = function() {
  // TODO
};

vectorProto.max = function() {
  // TODO
};

vectorProto.cuMin = function() {
  // TODO
};

vectorProto.cuMax = function() {
  // TODO
};

vectorProto.idxMin = function() {
  // TODO
};

vectorProto.idxMax = function() {
  // TODO
};

vectorProto.pMin = function() {
  // TODO
};

vectorProto.pMax = function() {
  // TODO
};

vectorProto.clip = function() {
  // TODO
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

  var isSingleton1 = false;
  var isSingleton2 = false;
  var arr1Len = array1.length;
  var arr2Len = array2.length;
  var outputLen = arr1Len;
  if (arr1Len !== arr2Len) {
    if (arr1Len === 1) {
      isSingleton1 = true;
      outputLen = arr2Len;
    } else if (arr2Len === 1) {
      isSingleton2 = true;
    } else {
      throw new Error('incompatible array lengths: ' + arr1Len + ' and ' +
        arr2Len);
    }
  }

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

function validateDtype(dtype) {
  if (!(dtype in VALID_DTYPES)) {
    throw new Error('invalid dtype: "' + dtype + '"');
  }
}

function validateNonnegInt(value, varName) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('"' + varName + '" must be a nonnegative integer');
  }
}

function validateVectorIsDtype(vector, dtype) {
  if (vector.dtype !== dtype) {
    throw new Error('expected vector dtype to be ' + dtype + ' but got ' +
      vector.dtype);
  }
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


}));
