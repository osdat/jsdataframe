
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
vectorProto.type = 'Vector';
var numVecProto = Object.create(vectorProto);
var boolVecProto = Object.create(vectorProto);
var strVecProto = Object.create(vectorProto);
var dateVecProto = Object.create(vectorProto);

var dfProto = {};
dfProto.type = 'DataFrame';


// Supporting types

var rangeProto = {};
rangeProto.type = 'Range';

var rangeCatProto = {};
rangeCatProto.type = 'RangeCat';

var byDtypeProto = {};
byDtypeProto.type = 'ByDtype';

var exclusionProto = {};
exclusionProto.type = 'Exclusion';


// Private helper types

var abstractIndexProto = {};
abstractIndexProto.type = 'AbstractIndex';

var nestedIndexProto = Object.create(abstractIndexProto);
nestedIndexProto.type = 'NestedIndex';


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


// Private exports for testing purposes
jd._private_export = {};


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

vectorProto.dtype = 'object';

// Initializes the vector instance's properties
vectorProto._init = function(array) {
  this.values = array;
  this._index = null;
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

vectorProto.s = function(selector) {
  var intIdxVec = standardIndexing(selector, this.values.length);
  if (intIdxVec === null) {
    return this;
  }
  var intIdxArr = intIdxVec.values;
  var result = allocArray(intIdxArr.length);
  for (var i = 0; i < intIdxArr.length; i++) {
    result[i] = this.values[intIdxArr[i]];
  }
  return newVector(result, this.dtype);
};


vectorProto.sMod = function(selector, values) {
  var intIdxVec = standardIndexing(selector, this.values.length);
  if (intIdxVec === null) {
    intIdxVec = jd.seq(this.values.length);
  }
  values = ensureVector(values, this.dtype);
  validateVectorIsDtype(values, this.dtype);
  var isSingleValue = (values.size() === 1);
  if (!isSingleValue && values.size() !== intIdxVec.size()) {
    throw new Error('length mismatch: cannot assign ' + values.size() +
      ' values to a selection of length ' + intIdxVec.size());
  }

  var intIdxArr = intIdxVec.values;
  var result = this.values.slice();
  for (var i = 0; i < intIdxArr.length; i++) {
    result[intIdxArr[i]] = isSingleValue ? values.values[0] : values.values[i];
  }
  return newVector(result, this.dtype);
};


vectorProto.at = function(i) {
  i = ensureScalar(i);
  i = resolveIntIdx(i, this.size());
  return this.values[i];
};


vectorProto.head = function(n) {
  if (isUndefined(n)) {
    n = 6;
  }
  validateInt(n, 'n');
  return this.s(jd.r(0, n));
};


vectorProto.tail = function(n) {
  if (isUndefined(n)) {
    n = 6;
  }
  validateInt(n, 'n');
  var start = (n < 0) ? -n : this.size() - n;
  return this.s(jd.r(start, undefined));
};


vectorProto.ifElse = function(cond, other) {
  cond = ensureVector(cond, 'boolean');
  if (cond.size() !== this.size()) {
    throw new Error('"cond" must be the same length as this vector');
  }
  validateVectorIsDtype(cond, 'boolean');

  other = ensureVector(other, this.dtype);
  validateVectorIsDtype(other, this.dtype);

  var resultArr = combineMultipleArrays(
    [this.values, cond.values, other.values, [NA_VALUE[this.dtype]]],
    elemIfElse
  );
  return newVector(resultArr, this.dtype);
};
function elemIfElse(thisElem, cond, other, naValue) {
  return (
    isMissing(cond) ? naValue :
    cond ? thisElem :
    other
  );
}


vectorProto.ex = function() {
  return jd.ex(this);
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


vectorProto.combine = function() {
  var numArgs = arguments.length;
  if (numArgs < 2) {
    throw new Error('must supply at least one "varg"');
  }
  var func = arguments[numArgs - 1];
  if (typeof func !== 'function') {
    throw new Error('the last argument to "combine" must be a function');
  }

  var vargArrays = allocArray(numArgs);
  vargArrays[0] = this.values;
  for (var j = 1; j < numArgs; j++) {
    vargArrays[j] = ensureVector(arguments[j - 1]).values;
  }
  var resultArray = combineMultipleArrays(vargArrays, func);
  return jd.vector(resultArray);
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
  var resultArr = combineMultipleArrays(
    [this.values, lower.values, upper.values],
    elemClip
  );
  return newVector(resultArr, this.dtype);
};
function elemClip(elem, lower, upper) {
  var missingLower = isMissing(lower);
  var missingUpper = isMissing(upper);
  if (!missingLower && !missingUpper && lower > upper) {
    throw new Error('invalid range: lower (' + lower + ') > upper (' +
      upper + ')');
  }
  return (
    isMissing(elem) ? elem :
    (!missingLower && elem < lower) ? lower :
    (!missingUpper && elem > upper) ? upper :
    elem
  );
}


vectorProto.rank = function() {
  // TODO
};


/*-----------------------------------------------------------------------------
* Membership
*/

vectorProto.isIn = function(values) {
  validateVectorIsNotDtype(this, 'object');
  values = ensureVector(values, this.dtype);
  validateVectorIsDtype(values, this.dtype);
  return values._getIndex().has([this]);
};

vectorProto.valueCounts = function() {
  validateVectorIsNotDtype(this, 'object');
  // TODO
};

vectorProto.unique = function() {
  validateVectorIsNotDtype(this, 'object');
  return this._getIndex().unique()[0];
};

vectorProto.nUnique = function() {
  validateVectorIsNotDtype(this, 'object');
  return this._getIndex().size;
};

vectorProto.duplicated = function(keep) {
  validateVectorIsNotDtype(this, 'object');
  return this._getIndex().duplicated(keep);
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


// Private helper for retrieving the index or creating one if it's not
// yet present
vectorProto._getIndex = function() {
  if (this._index === null) {
    this._index = newNestedIndex([this]);
  }
  return this._index;
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


/*-----------------------------------------------------------------------------
* Operators
*/

numVecProto.add = function(other) {
  other = ensureVector(other, 'number');
  validateVectorIsDtype(other, 'number');
  var array = combineArrays(this.values, other.values, NaN, numberAdd);
  return newVector(array, 'number');
};
function numberAdd(x, y) {
  return x + y;
}

numVecProto.sub = function(other) {
  other = ensureVector(other, 'number');
  validateVectorIsDtype(other, 'number');
  var array = combineArrays(this.values, other.values, NaN, numberSub);
  return newVector(array, 'number');
};
function numberSub(x, y) {
  return x - y;
}

numVecProto.mul = function(other) {
  other = ensureVector(other, 'number');
  validateVectorIsDtype(other, 'number');
  var array = combineArrays(this.values, other.values, NaN, numberMul);
  return newVector(array, 'number');
};
function numberMul(x, y) {
  return x * y;
}

numVecProto.div = function(other) {
  other = ensureVector(other, 'number');
  validateVectorIsDtype(other, 'number');
  var array = combineArrays(this.values, other.values, NaN, numberDiv);
  return newVector(array, 'number');
};
function numberDiv(x, y) {
  return x / y;
}

numVecProto.mod = function(other) {
  other = ensureVector(other, 'number');
  validateVectorIsDtype(other, 'number');
  var array = combineArrays(this.values, other.values, NaN, numberMod);
  return newVector(array, 'number');
};
function numberMod(x, y) {
  return x % y;
}

numVecProto.pow = function(other) {
  other = ensureVector(other, 'number');
  validateVectorIsDtype(other, 'number');
  var array = combineArrays(this.values, other.values, NaN, Math.pow);
  return newVector(array, 'number');
};


/*-----------------------------------------------------------------------------
* Unary functions
*/

numVecProto.abs = function() {
  return newVector(this.values.map(Math.abs), 'number');
};

numVecProto.sqrt = function() {
  return newVector(this.values.map(Math.sqrt), 'number');
};

numVecProto.sign = function() {
  return newVector(this.values.map(Math.sign), 'number');
};

numVecProto.ceil = function() {
  return newVector(this.values.map(Math.ceil), 'number');
};

numVecProto.floor = function() {
  return newVector(this.values.map(Math.floor), 'number');
};

numVecProto.round = function() {
  return newVector(this.values.map(Math.round), 'number');
};

numVecProto.exp = function() {
  return newVector(this.values.map(Math.exp), 'number');
};

numVecProto.log = function() {
  return newVector(this.values.map(Math.log), 'number');
};

numVecProto.sin = function() {
  return newVector(this.values.map(Math.sin), 'number');
};

numVecProto.cos = function() {
  return newVector(this.values.map(Math.cos), 'number');
};

numVecProto.tan = function() {
  return newVector(this.values.map(Math.tan), 'number');
};

numVecProto.asin = function() {
  return newVector(this.values.map(Math.asin), 'number');
};

numVecProto.acos = function() {
  return newVector(this.values.map(Math.acos), 'number');
};

numVecProto.atan = function() {
  return newVector(this.values.map(Math.atan), 'number');
};


/*-----------------------------------------------------------------------------
* Aggregation
*/

numVecProto.sum = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  return skipNa ?
    reduceNonNa(this.values, 0, numberAdd) :
    reduceUnless(this.values, 0, isMissing, numberAdd);
};


numVecProto.cuSum = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  var array = skipNa ?
    cumulativeReduce(this.values, numberAdd) :
    cumulativeReduce(this.values, NA_VALUE.number, numberAdd);
  return newVector(array, 'number');
};


numVecProto.mean = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  var stats = {n: 0, sum: 0.0};
  var result = skipNa ?
    reduceNonNa(this.values, stats, meanReducer) :
    reduceUnless(this.values, stats, isMissing, meanReducer);
  return (Number.isNaN(result) || result.n === 0) ?
    NaN :
    result.sum / result.n;
};
function meanReducer(stats, x) {
  stats.n++;
  stats.sum += x;
  return stats;
}


numVecProto.stdev = function(skipNa) {
  var variance = this.var(skipNa);
  return Number.isNaN(variance) ? NaN : Math.sqrt(variance);
};


// Implement the "online algorithm" for variance:
// https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Online_algorithm
numVecProto.var = function(skipNa) {
  if (isUndefined(skipNa)) {
    skipNa = true;
  }
  var stats = {n: 0, mean: 0.0, M2: 0.0};
  var result = skipNa ?
    reduceNonNa(this.values, stats, varReducer) :
    reduceUnless(this.values, stats, isMissing, varReducer);
  return (Number.isNaN(result) || result.n < 2) ?
    NaN :
    result.M2 / (result.n - 1);
};
function varReducer(stats, x) {
  stats.n++;
  var delta = x - stats.mean;
  stats.mean += delta / stats.n;
  stats.M2 += delta * (x - stats.mean);
  return stats;
}


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


/*=============================================================================

  ####  #    # #####  #####   ####  #####  #####
 #      #    # #    # #    # #    # #    #   #
  ####  #    # #    # #    # #    # #    #   #
      # #    # #####  #####  #    # #####    #
 #    # #    # #      #      #    # #   #    #
  ####   ####  #      #       ####  #    #   #

*/

// Public supporting types


/*-----------------------------------------------------------------------------
* Range
*/

jd.r = function(start, stop, includeStop) {
  includeStop = isUndefined(includeStop) ? null : includeStop;

  if (includeStop !== null && typeof includeStop !== 'boolean') {
    throw new Error('"includeStop" must be either true, false, or null');
  }

  var range = Object.create(rangeProto);
  range._start = start;
  range._stop = stop;
  range._includeStop = includeStop;
  return range;
};


rangeProto.ex = function() {
  return jd.ex(this);
};


/*-----------------------------------------------------------------------------
* RangeCat
*/

jd.rCat = function() {
  var numArgs = arguments.length;
  var args = allocArray(numArgs);
  for (var i = 0; i < numArgs; i++) {
    var arg = arguments[i];
    if (arg.type === 'Exclusion') {
      throw new Error('rCat must not contain any exclusions');
    }
    args[i] = arg;
  }

  var rangeCat = Object.create(rangeCatProto);
  rangeCat._selectors = args;
  return rangeCat;
};


rangeCatProto.ex = function() {
  return jd.ex(this);
};


/*-----------------------------------------------------------------------------
* Exclusion
*/

jd.ex = function(selector) {
  if (isUndefined(selector)) {
    throw new Error('"selector" must not be undefined');
  }
  var exclusion = Object.create(exclusionProto);
  exclusion._selector = selector;
  return exclusion;
};


/*-----------------------------------------------------------------------------
* Selection logic
*/


var RESOLVE_MODE = {
  INT: "INT",   // integer indexing
  COL: "COL", // column selection
  KEY: "KEY"    // key lookup
};


// Standard row or element indexing
// 'maxLen' should be the total length to index against.
// Returns null if all rows/elements should be selected in order.
function standardIndexing(selector, maxLen) {
  if (selector === null) {
    return null;
  }
  if (selector.type === 'Exclusion') {
    var intIdxVector = standardIdxHelper(selector._selector, maxLen);
    return excludeIntIndices(intIdxVector, maxLen);
  } else {
    return standardIdxHelper(selector, maxLen);
  }
}
function standardIdxHelper(selector, maxLen) {
  if (Array.isArray(selector)) {
    selector = inferVectorDtype(selector, 'number');
  }

  // Handle boolean case if applicable
  var boolIdxResult = attemptBoolIndexing(selector, maxLen);
  if (!isUndefined(boolIdxResult)) {
    return boolIdxResult;
  }

  // Handle integer indexing
  var opts = resolverOpts(RESOLVE_MODE.INT, maxLen);
  return resolveSelector(selector, opts);
}


// Column name indexing
// 'colNames' should be a string vector of column names
// Returns null if all rows/elements should be selected in order.
function columnIndexing(selector, colNames, dtypes) {
  if (selector === null) {
    return null;
  }
  if (selector.type === 'Exclusion') {
    var intIdxVector = columnIdxHelper(selector._selector, colNames);
    return excludeIntIndices(intIdxVector, colNames.size());
  } else {
    return columnIdxHelper(selector, colNames);
  }
}
function columnIdxHelper(selector, colNames, dtypes) {
  var maxLen = colNames.size();
  if (Array.isArray(selector)) {
    selector = inferVectorDtype(selector, 'string');
  }

  // Handle boolean case if applicable
  var boolIdxResult = attemptBoolIndexing(selector, maxLen);
  if (!isUndefined(boolIdxResult)) {
    return boolIdxResult;
  }

  // Handle ByDtype case if applicable
  // TODO

  // Handle integer index / col name lookup hybrid
  var opts = resolverOpts(RESOLVE_MODE.COL, maxLen, colNames._getIndex());
  return resolveSelector(selector, opts);
}


// Perform key lookup indexing
// 'index' should be an AbstractIndex implementation
function keyIndexing(selector, maxLen, index) {
  if (selector.type === 'Exclusion') {
    var intIdxVector = keyIndexing(selector._selector, maxLen, index);
    return excludeIntIndices(intIdxVector, maxLen);
  }
  var opts = resolverOpts(RESOLVE_MODE.KEY, maxLen, index);
  return resolveSelector(selector, opts);
}


// Returns the integer indices resulting from excluding the
// intIdxVector based on the given maxLen
function excludeIntIndices(intIdxVector, maxLen) {
  return jd.seq(maxLen).isIn(intIdxVector).not().which();
}


// Performs boolean indexing if 'selector' is a boolean vector
// of the same length as maxLen.
// Returns undefined if 'selector' is inappropriate for boolean
// indexing; returns a vector of integer indices if boolean
// indexing resolves appropriately.
function attemptBoolIndexing(selector, maxLen) {
  if (selector.type === 'Vector' && selector.dtype === 'boolean') {
    if (selector.size() !== maxLen) {
      throw new Error('inappropriate boolean indexer length (' +
        selector.size() + '); expected length to be ' + maxLen);
    }
    return selector.which();
  }
}


// Construct options for resolveSelector().
// 'resolveMode' should be one of the values in RESOLVE_MODE.
// 'maxLen' should be the total length to index against.
// 'index' should be an AbstractIndex implementation if given.
function resolverOpts(resolveMode, maxLen, index) {
  index = isUndefined(index) ? null : index;
  return {
    resolveMode: resolveMode,
    maxLen: maxLen,
    index: index
  };
}


// Resolve a selector to a vector of integer indices using the 'opts' object
function resolveSelector(selector, opts) {
  var resultArr = [];
  resolveSelectorHelper(selector, opts, resultArr);
  return newVector(resultArr, 'number');
}
// Recursive helper that updates running results in 'resultArr'
function resolveSelectorHelper(selector, opts, resultArr) {
  if (typeof selector._resolveSelectorHelper === 'function') {
    selector._resolveSelectorHelper(opts, resultArr);
  } else {
    if (opts.resolveMode === RESOLVE_MODE.KEY && opts.index.arity > 1) {
      if (!Array.isArray(selector)) {
        throw new Error('expected compound key for index lookup but got: ' +
          selector);
      }
      selector = newVector(selector, 'object');
    } else {
      selector = ensureVector(selector);
    }
    selector._resolveSelectorHelper(opts, resultArr);
  }
}


// Vector selector resolution logic
vectorProto._resolveSelectorHelper = function(opts, resultArr) {
  var isNumDtype = (this.dtype === 'number');
  var isStrDtype = (this.dtype === 'string');
  var i, intInds;
  switch (opts.resolveMode) {
    case RESOLVE_MODE.INT:
      if (!isNumDtype) {
        throw new Error('attempted integer indexing using invalid dtype: "' +
          this.dtype + '"');
      }
      for (i = 0; i < this.values.length; i++) {
        resultArr.push(resolveIntIdx(this.values[i], opts.maxLen));
      }
      break;
    case RESOLVE_MODE.COL:
      for (i = 0; i < this.values.length; i++) {
        var currVal = this.values[i];
        if (isNumDtype || isNumber(currVal)) {
          resultArr.push(resolveIntIdx(this.values[i], opts.maxLen));
        } else if (isStrDtype || isString(currVal)) {
          intInds = opts.index.lookupKey([currVal]);
          processLookupResults(intInds, currVal, opts, resultArr);
        } else {
          throw new Error('expected integer or string selector but got: ' +
            currVal);
        }
      }
      break;
    case RESOLVE_MODE.KEY:
      if (opts.index.arity === 1) {
        var lookupVectors = [this];
        for (i = 0; i < this.values.length; i++) {
          intInds = opts.index.lookup(lookupVectors, i);
          processLookupResults(intInds, this.values[i], opts, resultArr);
        }
      } else {
        // TODO
        throw new Error('unimplemented case (TODO)');
      }
      break;
    default:
      throw new Error('Unrecognized RESOLVE_MODE: ' + opts.resolveMode);
  }
};


// Range selector resolution logic
rangeProto._resolveSelectorHelper = function(opts, resultArr) {
  // Resolve range start first
  var startIdx = resolveRangeBound(this._start, opts, false);
  if (startIdx >= opts.maxLen) {
    return;
  }
  // Resolve range stop
  var stopIdx = resolveRangeBound(this._stop, opts, true, this._includeStop);
  if (stopIdx <= 0) {
    return;
  }
  // Clip invalid bounds
  startIdx = (startIdx < 0) ? 0 : startIdx;
  stopIdx = (stopIdx > opts.maxLen) ? opts.maxLen : stopIdx;
  // Add all integer indices
  for (var i = startIdx; i < stopIdx; i++) {
    resultArr.push(i);
  }
};
// Returns the resolved integer index for the bound
function resolveRangeBound(bound, opts, isStop, includeStop) {
  var result;
  if (isUndefined(bound)) {
    return isStop ? opts.maxLen : 0;
  }
  var useIntIndexing = (
    opts.resolveMode === RESOLVE_MODE.INT ||
    (opts.resolveMode === RESOLVE_MODE.COL && typeof bound === 'number')
  );
  if (includeStop === null) {
    includeStop = useIntIndexing ? false : true;
  }
  if (useIntIndexing) {
    result = resolveIntIdx(bound, opts.maxLen, false);
    return (isStop && includeStop) ? result + 1 : result;
  } else {
    if (opts.index.arity === 1) {
      result = opts.index.lookupKey([bound]);
      if (result === null) {
        throw new Error('could not find entry for range bound: ' + bound);
      } else if (typeof result === 'number') {
        return (isStop && includeStop) ? result + 1 : result;
      } else {
        return (isStop && includeStop) ?
          result[result.length - 1] + 1 :
          result[0];
      }
    } else {
      // TODO
      throw new Error('unimplemented case (TODO)');
    }
  }
}


// RangeCat selector resolution logic
rangeCatProto._resolveSelectorHelper = function(opts, resultArr) {
  for (var i = 0; i < this._selectors.length; i++) {
    resolveSelectorHelper(this._selectors[i], opts, resultArr);
  }
};


// Uses 'maxLen' to compute the integer index for 'inputInt' or
// throws an error if invalid.  'checkBounds' is true by default
// but if false, the resulting integer index won't be checked.
function resolveIntIdx(inputInt, maxLen, checkBounds) {
  if (isUndefined(checkBounds)) {
    checkBounds = true;
  }
  if (!Number.isInteger(inputInt)) {
    throw new Error('expected integer selector for integer indexing ' +
      'but got non-integer: ' + inputInt);
  }
  var result = inputInt < 0 ? maxLen + inputInt : inputInt;
  if (checkBounds && (result < 0 || result >= maxLen)) {
    throw new Error('integer index out of bounds');
  }
  return result;
}


// Processes 'intInds', the result returned from lookup via an AbstractIndex.
// Results are placed in 'resultArr' if present, or an error is thrown.
function processLookupResults(intInds, key, opts, resultArr) {
  if (intInds === null) {
    if (opts.resolveMode === RESOLVE_MODE.COL) {
      throw new Error('could not find column named "' + key + '"');
    } else {
      throw new Error('could find entry for key: ' + key);
    }
  } else if (typeof intInds === 'number') {
    resultArr.push(intInds);
  } else {
    for (j = 0; j < intInds.length; j++) {
      resultArr.push(intInds[j]);
    }
  }
}


/*=============================================================================

 # #    # #####  ###### #    # ######  ####
 # ##   # #    # #       #  #  #      #
 # # #  # #    # #####    ##   #####   ####
 # #  # # #    # #        ##   #           #
 # #   ## #    # #       #  #  #      #    #
 # #    # #####  ###### #    # ######  ####

*/

// Private helper types for fast lookup of row numbers based on row content.
// Indexes can be built for data frames or vectors.  The term "row number"
// will be used for both cases, even though a "row" is just a single
// element in the vector case.


/*-----------------------------------------------------------------------------
* AbstractIndex
*/

// Abstract index methods defined in terms of the following
// properties that a concrete implementation must define:
// 1. lookup(vectors, i) - a method for looking up the row numbers
// associated with the row content at index i in the given vectors
// 2. lookupKey(keyArray) - a method for looking up the row numbers
// associated with the keyArray, which represents a single compound key
// 3. initVectors - a property containing the array of vectors
// originally used to create this index
// 4. size - a property containing the number of unique keys
// 5. arity - a property containing the number of entries in each key
//
// So far the only concrete implementation is NestedIndex.
// Some potential future alternatives:
// 1. Sorted key index using binary search for lookup
// 2. Use string concatenation for compound keys instead of nesting
// 3. Implement a hash table from scratch for generic keys with 'hashCode'
// and 'equals'


// This method should be overriden by a concrete implementation.
// It should return the row numbers associated with the entry indexed by i
// within the given "vectors" array.
// Returns an array of integer row numbers if there are multiple or
// just returns an integer if there's only one row number.
// Returns null if there are no associated row numbers.
abstractIndexProto.lookup = function(vectors, i) {
  throw new Error('abstract "lookup" method called without concrete ' +
    'implementation');
};


// Returns a boolean vector the same length as the vectors in 'vectors'
// that's true for every row contained in this index and false otherwise.
abstractIndexProto.has = function(vectors) {
  var numRows = vectors[0].size();
  var result = allocArray(numRows);
  for (var i = 0; i < numRows; i++) {
    result[i] = this.lookup(vectors, i) === null ? false : true;
  }
  return newVector(result, 'boolean');
};


// Implements the logic for the 'valueCounts' method.
// Returns an object with 'vectors' property containing an array
// of vectors of unique rows and 'counts' property containing
// a number vector of corresponding counts.
abstractIndexProto.valueCounts = function() {
  var initVectors = this.initVectors;
  var arity = this.arity;
  var numKeys = this.size;
  var outputValues = allocArray(arity);
  for (var j = 0; j < arity; j++) {
    outputValues[j] = allocArray(numKeys);
  }
  var counts = allocArray(numKeys);

  // Populate values and counts
  var initNumRows = initVectors[0].size();
  var outputRow = 0;
  for (var i = 0; i < initNumRows; i++) {
    var rowNums = this.lookup(initVectors, i);
    if (rowNums === i || rowNums[0] === i) {
      for (j = 0; j < arity; j++) {
        outputValues[j][outputRow] = initVectors[j].values[i];
      }
      counts[outputRow] = (rowNums === i) ? 1 : rowNums.length;
      outputRow++;
    }
  }

  // Wrap values and counts as vectors
  var outputVectors = outputValues.map(function(array, j) {
    return newVector(array, initVectors[j].dtype);
  });
  return {
    vectors: outputVectors,
    counts: newVector(counts, 'number')
  };
};


// Implements the logic for the 'unique' method.
// Returns an array of vectors containing the unique rows
abstractIndexProto.unique = function() {
  return this.valueCounts().vectors;
};


// Implements the logic for the 'duplicated' method.
// Returns a boolean vector denoting duplicate rows.
// 'keep' must be one of 3 values:
// 1. 'first' string: mark duplicates as true except for the first occurrence.
//    This is the default.
// 2. 'last' string: mark duplicates as true except for the last occurrence
// 3. false boolean: will mark all duplicates as true
abstractIndexProto.duplicated = function(keep) {
  if (isUndefined(keep)) {
    keep = 'first';
  }
  var keepFirst = false;
  var keepLast = false;
  if (keep === 'first') {
    keepFirst = true;
  } else if (keep === 'last') {
    keepLast = true;
  } else if (keep !== false) {
    throw new Error('"keep" must be either "first", "last", or false');
  }

  var initVectors = this.initVectors;
  var initNumRows = initVectors[0].size();
  var result = allocArray(initNumRows);
  for (var i = 0; i < initNumRows; i++) {
    result[i] = false;
  }

  // Populate values and counts
  var startInd = keepFirst ? 1 : 0;
  for (i = 0; i < initNumRows; i++) {
    var rowNums = this.lookup(initVectors, i);
    if (typeof rowNums !== 'number' && rowNums[0] === i) {
      var rowNumLen = rowNums.length;
      var stopInd = keepLast ? rowNumLen - 1 : rowNumLen;
      for (var j = startInd; j < stopInd; j++) {
        result[rowNums[j]] = true;
      }
    }
  }

  return newVector(result, 'boolean');
};


/*-----------------------------------------------------------------------------
* NestedIndex
*/

// This implementation uses nested objects to handle multiple vectors.

var ESCAPED_KEYS = {
  null: '_INTERNAL_JSDATAFRAME_NULL_KEY_',
  undefined: '_INTERNAL_JSDATAFRAME_UNDEFINED_KEY_'
};

// Returns a clean version of the given 'key', transforming if the dtype
// doesn't hash well directly and escaping if necessary to avoid
// collisions for missing values
function cleanKey(key, dtype) {
  return (
    key === null ? ESCAPED_KEYS.null :
    isUndefined(key) ? ESCAPED_KEYS.undefined :
    dtype === 'date' ? key.valueOf() :
    key
  );
}


// Creates a new NestedIndex for the given 'vectors' array (which may contain
// only a single element to index a single vector).
function newNestedIndex(vectors) {
  var arity = vectors.length;
  if (arity === 0) {
    throw new Error('cannot index an empty list of vectors');
  }
  var numRows = vectors[0].size();

  // Initialize properties
  var nestedIndex = Object.create(nestedIndexProto);
  nestedIndex.initVectors = vectors;
  nestedIndex.size = 0;
  nestedIndex.arity = arity;
  nestedIndex._dtypes = vectors.map(function(v) { return v.dtype; });
  nestedIndex._map = Object.create(null);

  // Build index
  var rootMap = nestedIndex._map;
  var lastColInd = arity - 1;
  for (var i = 0; i < numRows; i++) {
    var currMap = rootMap;
    var currVector, key;
    for (var j = 0; j < lastColInd; j++) {
      currVector = vectors[j];
      key = cleanKey(currVector.values[i], currVector.dtype);
      var innerMap = currMap[key];

      // Create innerMap if not present
      if (isUndefined(innerMap)) {
        currMap[key] = innerMap = Object.create(null);
      }
      currMap = innerMap;
    }

    // Add the row number to the entry
    currVector = vectors[lastColInd];
    key = cleanKey(currVector.values[i], currVector.dtype);
    var rowNums = currMap[key];
    if (isUndefined(rowNums)) {
      currMap[key] = i;
      nestedIndex.size++;
    } else if (typeof rowNums === 'number') {
      currMap[key] = [rowNums, i];
    } else {
      // rowNums must be an array
      rowNums.push(i);
    }
  }

  return nestedIndex;
}
jd._private_export.newNestedIndex = newNestedIndex;


nestedIndexProto.lookup = function(vectors, i) {
  var arity = this.arity;
  var dtypes = this._dtypes;
  var nestedMap = this._map;
  for (var j = 0; j < arity; j++) {
    var currVector = vectors[j];
    var key = cleanKey(currVector.values[i], dtypes[j]);
    nestedMap = nestedMap[key];
    if (isUndefined(nestedMap)) {
      return null;
    }
  }
  // The last iteration (j === arity - 1) replaces 'nestedMap' with
  // the desired row numbers
  return nestedMap;
};


nestedIndexProto.lookupKey = function(keyArray) {
  var arity = this.arity;
  var dtypes = this._dtypes;
  var nestedMap = this._map;
  for (var j = 0; j < arity; j++) {
    var key = cleanKey(keyArray[j], dtypes[j]);
    nestedMap = nestedMap[key];
    if (isUndefined(nestedMap)) {
      return null;
    }
  }
  // The last iteration (j === arity - 1) replaces 'nestedMap' with
  // the desired row numbers
  return nestedMap;
};


/*=============================================================================

 #    # ###### #      #####  ###### #####   ####
 #    # #      #      #    # #      #    # #
 ###### #####  #      #    # #####  #    #  ####
 #    # #      #      #####  #      #####       #
 #    # #      #      #      #      #   #  #    #
 #    # ###### ###### #      ###### #    #  ####

*/

// Private helper functions


// Defines which values are considered "missing" in jsdataframe
function isMissing(value) {
  return value === null || isUndefined(value) || Number.isNaN(value);
}


// Allocates a new array for the given number of elements.
// We define a function in case we want to tune our preallocation
// strategy later.  (e.g. http://www.html5rocks.com/en/tutorials/speed/v8/)
function allocArray(numElems) {
  return numElems < 64000 ?
    new Array(numElems) :
    [];
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


// Applies 'func' to each tuple of elements from 'arrays', an array of
// arrays.  The lengths of any arrays that aren't length 1 must be
// identical.
function combineMultipleArrays(arrays, func) {
  if (arrays.length === 0) {
    throw new Error('cannot combine an empty list of arrays');
  }

  // Check lengths
  var numArgs = arrays.length;
  var isSingle = allocArray(numArgs);
  var numElems = 1;
  var j;
  for (j = 0; j < numArgs; j++) {
    if (arrays[j].length === 1) {
      isSingle[j] = true;
    } else {
      isSingle[j] = false;
      if (numElems === 1) {
        numElems = arrays[j].length;
      } else if (numElems !== arrays[j].length) {
        throw new Error('length mismatch: expected ' + numElems +
          ' elements but found ' + arrays[j].length);
      }
    }
  }

  // Apply func element-wise
  var resultArray = allocArray(numElems);
  var argArray = allocArray(numArgs);
  for (var i = 0; i < numElems; i++) {
    for (j = 0; j < numArgs; j++) {
      argArray[j] = isSingle[j] ? arrays[j][0] : arrays[j][i];
    }
    resultArray[i] = func.apply(null, argArray);
  }

  return resultArray;
}


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

  var accumulatedVal = null;
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
// based on the array's values.  If all elements have the same inferred
// dtype, this dtype will be used for the resulting vector.  If any
// two elements have different inferred dtypes, the resulting vector dtype
// will be "object", and none of the elements of the array will be altered.
// Any null or undefined elements are ignored since dtype inference is
// inconslusive for them, but if a non-"object" dtype is inferred for
// the vector, all missing elements will be standarized to use
// the same value (according to NA_VALUE).  The 'defaultDtype' argument
// determines the resulting dtype only if all values are inconclusive.
// If 'defaultDtype' is undefined it will default to 'object'.
function inferVectorDtype(array, defaultDtype) {
  if (isUndefined(defaultDtype)) {
    defaultDtype = 'object';
  }
  var dtype = null;

  // Attempt to infer the dtype
  for (var i = 0; i < array.length; i++) {
    var inferredDtype = inferDtype(array[i]);
    if (inferredDtype !== null) {
      if (dtype === null) {
        dtype = inferredDtype;
      }
      if (dtype !== inferredDtype || inferredDtype === 'object') {
        return newVector(array, 'object');
      }
    }
  }

  // Use 'defaultDtype' if all inferences were inconclusive
  var naValue;
  if (dtype === null) {
    dtype = defaultDtype;
    if (dtype !== 'object') {
      naValue = NA_VALUE[dtype];
      for (i = 0; i < array.length; i++) {
        array[i] = naValue;
      }
    }
    return newVector(array, dtype);
  }

  // Make sure all values are normalized to the right missing value dtype
  if (dtype !== 'object') {
    naValue = NA_VALUE[dtype];
    for (i = 0; i < array.length; i++) {
      if (isMissing(array[i])) {
        array[i] = naValue;
      }
    }
  }
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
function validateInt(value, varName) {
  if (!Number.isInteger(value)) {
    throw new Error('expected an integer for "' + varName +
      '" but got: ' + value);
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
    throw new Error('expected vector dtype to be "' + dtype + '" but got "' +
      vector.dtype + '"');
  }
}

// Returns undefined or throws an error if invalid
function validateVectorIsNotDtype(vector, dtype) {
  if (vector.dtype === dtype) {
    throw new Error('unsupported operation for dtype "' + dtype + '"');
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

// If value is a vector or array, this function will return the single
// scalar value contained or throw an error if the length is not 1.
// If value isn't a vector or array, it is simply returned.
function ensureScalar(value) {
  var length = 1;
  var description = 'a scalar';
  if (value.type === 'Vector') {
    length = value.size();
    value = value.values[0];
    description = 'a vector';
  } else if (Array.isArray(value)) {
    length = value.length;
    value = value[0];
    description = 'an array';
  }
  if (length !== 1) {
    throw new Error('expected a single scalar value but got ' +
      description + ' of length ' + length);
  }
  return value;
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
  return typeof obj === 'number';
}

function isBoolean(obj) {
  return typeof obj === 'boolean';
}

function isString(obj) {
  return typeof obj === 'string';
}

function isDate(obj) {
  return Object.prototype.toString.call(obj) === '[object Date]';
}

function isUndefined(obj) {
  return typeof obj === 'undefined';
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
