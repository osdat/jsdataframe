
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

  // Retrieve appropriate coerceFunc if dtype is defined
  var coerceFunc = null;
  if (dtype !== null) {
    validateDtype(dtype);
    coerceFunc = COERCE_FUNC[dtype];
  }

  // Coerce all elements to dtype, inferring dtype along the way if necessary
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

  // Declare dtype as "object" if all inferences were inconclusive
  if (dtype === null) {
    dtype = 'object';
  }

  // Construct vector
  return newVector(array, dtype);
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

  // Convert values to vector
  if (isMissing(values) || values.type !== 'Vector') {
    values = Array.isArray(values) ? jd.vector(values) : jd.vector([values]);
  }

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

  // Convert values to vector
  if (isMissing(values) || values.type !== 'Vector') {
    values = Array.isArray(values) ? jd.vector(values) : jd.vector([values]);
  }

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

// Constructs a vector of the correct dtype backed by the given array
function newVector(array, dtype) {
  validateDtype(dtype);
  var proto = PROTO_MAP[dtype];
  var vector = Object.create(proto);
  vector._init(array);
  return vector;
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
