
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

jd.version = '0.2.0';


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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    //'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}


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
vectorProto.type = 'jsdataframe.Vector';
var numVecProto = Object.create(vectorProto);
var boolVecProto = Object.create(vectorProto);
var strVecProto = Object.create(vectorProto);
var dateVecProto = Object.create(vectorProto);

var dfProto = {};
dfProto.type = 'jsdataframe.DataFrame';


// Supporting types

var rangeProto = {};
rangeProto.type = 'jsdataframe.Range';

var byDtypeProto = {};
byDtypeProto.type = 'jsdataframe.ByDtype';

var exclusionProto = {};
exclusionProto.type = 'jsdataframe.Exclusion';


// Private helper types

var abstractIndexProto = {};
abstractIndexProto.type = 'jsdataframe.AbstractIndex';

var nestedIndexProto = Object.create(abstractIndexProto);
nestedIndexProto.type = 'jsdataframe.NestedIndex';


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
    if (!isNumber(start)) {
      throw new Error('both "start" and "stop" arguments must be ' +
        'specified for non-numeric sequences');
    }
    stop = start;
    start = 0;
  } else if (inferDtype(start) !== inferDtype(stop)) {
    throw new Error('"start" and "stop" must have the same dtype');
  }
  step = isUndefined(step) ? 1 : step;
  includeStop = isUndefined(includeStop) ? false : includeStop;

  // Handle character sequence case
  if (isString(start)) {
    if (start.length !== 1 || stop.length !== 1) {
      throw new Error('both "start" and "stop" must be single characters ' +
        'for character sequences');
    }
    var charCodeSeq = jd.seq(start.charCodeAt(0), stop.charCodeAt(0),
      step, includeStop);
    return charCodeSeq.map(charCodeToStr);
  }

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
function charCodeToStr(charCode) {
  return String.fromCharCode(charCode);
}


jd.seqOut = function(start, lengthOut, step) {
  if (arguments.length < 3) {
    step = 1;
  }

  // Validate arguments
  step = +step;
  validateNonnegInt(lengthOut, 'lengthOut');

  // Handle character sequence case
  if (isString(start)) {
    if (start.length !== 1) {
      throw new Error('"start" must be a single character ' +
        'for character sequences');
    }
    var charCodeSeq = jd.seqOut(start.charCodeAt(0), lengthOut, step);
    return charCodeSeq.map(charCodeToStr);
  }

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


/*-----------------------------------------------------------------------------
* DataFrame Creation
*/

jd.df = function(columns, colNames) {
  // Standardize 'colNames' argument to string vector if present
  if (!isUndefined(colNames)) {
    colNames = ensureStringVector(colNames);
  }

  // Standardize 'columns' argument to array format
  var numCols;
  if (columns.type === vectorProto.type) {
    throw new Error('"columns" should not itself be a vector');
  } else if (Array.isArray(columns)) {
    numCols = columns.length;
    if (isUndefined(colNames)) {
      colNames = generateColNames(numCols);
    } else if (colNames.size() !== numCols) {
      throw new Error('the length of "colNames" (' + colNames.size() +
        ') does not match the length of "columns" (' + numCols + ')');
    }
  } else if (typeof columns === 'object') {
    var keys = Object.keys(columns);
    numCols = keys.length;
    var colMap = columns;
    if (isUndefined(colNames)) {
      colNames = newVector(keys, 'string');
    } else {
      if (colNames.isNa().any()) {
        throw new Error('"colNames" cannot have null entries when ' +
          '"columns" is an object');
      } else if (colNames.duplicated().any()) {
        throw new Error('"colNames" cannot have duplicate entries when ' +
          '"columns" is an object');
      } else if (colNames.size() !== numCols ||
        colNames.isIn(keys).not().any()) {
          throw new Error('"colNames" must match all the keys in ' +
            '"columns" if "columns" is an object');
      }
    }
    columns = allocArray(numCols);
    for (var i = 0; i < numCols; i++) {
      columns[i] = colMap[colNames.values[i]];
    }
  } else {
    throw new Error('expected "columns" to be an array or object but got: ',
      columns);
  }

  return newDataFrame(columns, colNames);
};


jd.dfFromObjArray = function(objArray, colOrder) {
  if (!Array.isArray(objArray)) {
    throw new Error('"objArray" must be an array');
  }
  var nRow = objArray.length;
  var definedOrder = true;
  var j;
  var columns;
  if (isUndefined(colOrder)) {
    colOrder = [];
    columns = [];
    definedOrder = false;
  } else {
    colOrder = ensureStringVector(colOrder);
    if (colOrder.isNa().any()) {
      throw new Error('"colOrder" cannot have null entries');
    } else if (colOrder.duplicated().any()) {
      throw new Error('"colOrder" cannot have duplicate entries');
    }
    colOrder = colOrder.values;
    columns = allocArray(colOrder.length);
    for (j = 0; j < colOrder.length; j++) {
      columns[j] = allocArray(nRow);
    }
  }

  // Populate columns
  var foundCols = Object.create(null);
  for (var i = 0; i < nRow; i++) {
    var rowObj = objArray[i];
    if (!definedOrder) {
      var keys = Object.keys(rowObj);
      for (j = 0; j < keys.length; j++) {
        var key = keys[j];
        if (!(key in foundCols)) {
          colOrder.push(key);
          var newColArr = allocArray(nRow);
          for (var k = 0; k < i; k++) {
            newColArr[k] = null;
          }
          columns.push(newColArr);
          foundCols[key] = key;
        }
      }
    }
    for (j = 0; j < colOrder.length; j++) {
      columns[j][i] = rowObj.propertyIsEnumerable(colOrder[j]) ?
        rowObj[colOrder[j]] : null;
    }
  }

  return newDataFrame(columns, newVector(colOrder, 'string'));
};


jd.dfFromMatrix = function(matrix, colNames) {
  if (!Array.isArray(matrix)) {
    throw new Error('"matrix" must be an array');
  }
  var nCol = matrix.length > 0 ? matrix[0].length : 0;
  colNames = isUndefined(colNames) ?
    generateColNames(nCol) :
    ensureStringVector(colNames);
  if (nCol > 0 && nCol !== colNames.size()) {
    throw new Error('"colNames" must have the same length as each ' +
      'row array');
  }
  return dfFromMatrixHelper(matrix, 0, colNames);
};
// Forms a data frame using 'matrix' starting with 'startRow' and
// setting column names to the 'colNames' string vector
function dfFromMatrixHelper(matrix, startRow, colNames) {
  var nCol = colNames.size();
  var nRow = matrix.length - startRow;
  var columns = allocArray(nCol);
  var j;
  for (j = 0; j < nCol; j++) {
    columns[j] = allocArray(nRow);
  }
  for (var i = 0; i < nRow; i++) {
    var rowArray = matrix[i + startRow];
    if (rowArray.length !== nCol) {
      throw new Error('all row arrays must be of the same size');
    }
    for (j = 0; j < nCol; j++) {
      columns[j][i] = rowArray[j];
    }
  }
  return newDataFrame(columns, colNames);
}

jd.dfFromMatrixWithHeader = function(matrix) {
  if (!Array.isArray(matrix)) {
    throw new Error('"matrix" must be an array');
  } else if (matrix.length === 0) {
    throw new Error('"matrix" must not have length 0');
  }
  var colNames = ensureStringVector(matrix[0]);
  if (matrix.length > 1 && colNames.size() !== matrix[1].length) {
    throw new Error('header row must have the same length as other ' +
      'row arrays');
  }
  return dfFromMatrixHelper(matrix, 1, colNames);
};


/*-----------------------------------------------------------------------------
* Conversion
*/

jd.unpack = function(obj) {
  if (obj.type === vectorProto.type) {
    return unpackVector(obj);
  } else if (obj.type === dfProto.type) {
    var names = unpackVector(obj.names);
    var cols = obj.cols.map(function(col) {
      return unpackVector(col);
    });
    return jd.df(cols, names);
  } else {
    throw new Error('"obj" has unrecognized type: ' + obj.type);
  }
};
function unpackVector(obj) {
  return jd.vector(obj.values, obj.dtype);
}


/*-----------------------------------------------------------------------------
* Concatenation
*/

jd.vCat = function() {
  var numArgs = arguments.length;

  // First pass: determine total output length and defaultDtype
  var vectorArgs = allocArray(numArgs);
  var defaultDtype = null;
  var outputLen = 0;
  for (var i = 0; i < numArgs; i++) {
    var currArg = arguments[i];
    if (!isUndefined(currArg) && currArg !== null &&
      currArg.type === dfProto.type) {
      throw new Error('cannot pass data frame arguments to jd.vCat');
    }
    var vector = ensureVector(currArg);
    if (defaultDtype === null && vector.dtype !== 'object') {
      defaultDtype = vector.dtype;
    }
    outputLen += vector.size();
    vectorArgs[i] = vector;
  }
  defaultDtype = (defaultDtype === null) ? 'object' : defaultDtype;

  // Second pass: populate output array
  var outputArr = allocArray(outputLen);
  var index = 0;
  for (i = 0; i < numArgs; i++) {
    var argArray = vectorArgs[i].values;
    var argArrLen = argArray.length;
    for (var j = 0; j < argArrLen; j++) {
      outputArr[index] = argArray[j];
      index++;
    }
  }

  return inferVectorDtype(outputArr, defaultDtype);
};


jd.colCat = function() {
  var numArgs = arguments.length;
  var args = allocArray(numArgs);
  for (var i = 0; i < numArgs; i++) {
    args[i] = arguments[i];
  }
  return jd._colCatArray(args);
};

jd._colCatArray = function(array) {
  var arrLen = array.length;
  var columns = [];
  var colNameArray = [];
  var j;
  for (var i = 0; i < arrLen; i++) {
    var elem = array[i];
    if (isUndefined(elem) || elem === null) {
      // treat as scalar
      columns.push(elem);
      colNameArray.push(null);
    } else if (elem.type === dfProto.type) {
      // elem is a data frame
      var nCol = elem._cols.length;
      for (j = 0; j < nCol; j++) {
        columns.push(elem._cols[j]);
        colNameArray.push(elem._names.values[j]);
      }
    } else if (typeof elem === 'object' &&
      elem.type !== vectorProto.type &&
      !Array.isArray(elem)) {
      // elem is an object for column name wrapping
      var keys = Object.keys(elem);
      for (j = 0; j < keys.length; j++) {
        var key = keys[j];
        columns.push(elem[key]);
        colNameArray.push(key);
      }
    } else {
      // elem is a vector, array, or scalar
      columns.push(elem);
      colNameArray.push(null);
    }
  }
  return newDataFrame(columns, newVector(colNameArray, 'string'));
};


jd.rowCat = function() {
  var numArgs = arguments.length;
  var args = allocArray(numArgs);
  for (var i = 0; i < numArgs; i++) {
    args[i] = arguments[i];
  }
  return jd._rowCatArray(args);
};

// Define types of elements for rowCatArray function
var ROW_ELEM_TYPES = {
  SCALAR: 0,
  ARRAY: 1,
  VECTOR: 2,
  DATA_FRAME: 3
};

jd._rowCatArray = function(array) {
  var arrLen = array.length;

  // Check column and row count and resolve column names
  var elemTypes = allocArray(arrLen);
  var colNameArr = null;
  var numRows = 0;
  var numCols = -1;
  var elem, i, j;
  for (i = 0; i < arrLen; i++) {
    elem = array[i];
    var elemColCount;
    if (isUndefined(elem) || elem === null || typeof elem !== 'object') {
      elemTypes[i] = ROW_ELEM_TYPES.SCALAR;
      numRows++;
      elemColCount = numCols;
    } else if (elem.type === dfProto.type) {
      elemTypes[i] = ROW_ELEM_TYPES.DATA_FRAME;
      elemColCount = elem.nCol();
      if (elemColCount === 0) {
        continue;
      }
      numRows += elem.nRow();
      // Check column names
      if (colNameArr === null) {
        colNameArr = elem._names.values.slice();
      } else {
        var len = Math.min(colNameArr.length, elemColCount);
        var elemNameArr = elem._names.values;
        for (j = 0; j < len; j++) {
          if (elemNameArr[j] !== colNameArr[j]) {
            colNameArr[j] = null;
          }
        }
      }
    } else if (elem.type === vectorProto.type) {
      elemTypes[i] = ROW_ELEM_TYPES.VECTOR;
      numRows++;
      elemColCount = elem.values.length;
    } else if (Array.isArray(elem)) {
      elemTypes[i] = ROW_ELEM_TYPES.ARRAY;
      numRows++;
      elemColCount = elem.length;
    } else {
      // treat object as scalar
      elemTypes[i] = ROW_ELEM_TYPES.SCALAR;
      numRows++;
      elemColCount = numCols;
    }
    // Check column counts
    if (numCols === -1) {
      numCols = elemColCount;
    } else if (numCols !== elemColCount) {
      throw new Error('arguments imply differing number of columns: ' +
        numCols + ', ' + elemColCount);
    }
  }
  if (numRows === 0) {
    return jd.df([]);
  }
  if (numCols === -1) {
    numCols = 1;
  }
  var colNames = (colNameArr === null) ?
    jd.repNa(numCols, 'string') :
    newVector(colNameArr, 'string');

  // Assign values for new data frame
  var columns = allocArray(numCols);
  for (j = 0; j < numCols; j++) {
    columns[j] = allocArray(numRows);
  }
  var currRow = 0;
  for (i = 0; i < arrLen; i++) {
    elem = array[i];
    switch (elemTypes[i]) {
      case ROW_ELEM_TYPES.SCALAR:
        for (j = 0; j < numCols; j++) {
          columns[j][currRow] = elem;
        }
        currRow++;
        break;
      case ROW_ELEM_TYPES.VECTOR:
        elem = elem.values;
        /* falls through */
      case ROW_ELEM_TYPES.ARRAY:
        for (j = 0; j < numCols; j++) {
          columns[j][currRow] = elem[j];
        }
        currRow++;
        break;
      case ROW_ELEM_TYPES.DATA_FRAME:
        var nRow = elem.nRow();
        for (j = 0; j < numCols; j++) {
          for (var k = 0; k < nRow; k++) {
            columns[j][currRow + k] = elem._cols[j].values[k];
          }
        }
        currRow += nRow;
        break;
    }
  }

  return newDataFrame(columns, colNames);
};


jd.strCat = function() {
  var numArgs = arguments.length;
  if (numArgs === 0) {
    throw new Error('"strCat" must be called with at least one argument');
  }

  var argArrays = allocArray(numArgs);
  for (var i = 0; i < numArgs; i++) {
    argArrays[i] = ensureVector(arguments[i]).values;
  }
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(argArrays, elemStrCat, internCache);
  return newVector(resultArr, 'string');
};
var elemStrCat = useStringInterning(function() {
  var argLen = arguments.length;
  var args = allocArray(argLen);
  for (var i = 0; i < argLen; i++) {
    var value = arguments[i];
    if (isMissing(value)) {
      return null;
    }
    args[i] = elemToString(value);
  }
  return args.join('');
});


/*-----------------------------------------------------------------------------
* Printing
*/

// Constants
var _MIN_MAX_WIDTH = 55;
var _MIN_MAX_LINES = 4;
var _MAX_STR_WIDTH = 45;
var _FIXED_NUM_DIGITS = 6;
var _EXP_FRAC_DIGITS = 6;
var _NUM_FIXED_LOWER_BOUND = Math.pow(10, 1 - _FIXED_NUM_DIGITS);
var _NUM_FIXED_UPPER_BOUND = 1e7 - 1e-9;
var _PRINT_SEP = '  ';
var _SKIP_MARKER = '..';
var _ROW_ID_SUFFIX = ':';


jd.printingOpts = {};

jd.printingOpts._maxWidth = 79;
jd.printingOpts._maxLines = 10;

jd.printingOpts._printCallback = function(stringToPrint) {
  console.log(stringToPrint);
};


jd.printingOpts.getMaxWidth = function() {
  return this._maxWidth;
};

jd.printingOpts.setMaxWidth = function(maxWidth) {
  validatePrintMax(maxWidth, _MIN_MAX_WIDTH, 'maxWidth');
  this._maxWidth = maxWidth;
};

jd.printingOpts.getMaxLines = function() {
  return this._maxLines;
};

jd.printingOpts.setMaxLines = function(maxLines) {
  validatePrintMax(maxLines, _MIN_MAX_LINES, 'maxLines');
  this._maxLines = maxLines;
};

jd.printingOpts.setPrintFunction = function(callback) {
  validateFunction(callback, 'callback');
  this._printCallback = callback;
};


vectorProto.p = function(maxLines) {
  var printStr = this.printToString(maxLines);
  jd.printingOpts._printCallback(printStr);
};

vectorProto.printToString = function(maxLines) {
  if (isUndefined(maxLines)) {
    maxLines = jd.printingOpts._maxLines;
  } else {
    validatePrintMax(maxLines, _MIN_MAX_LINES, 'maxLines');
  }
  if (this.values.length === 0) {
    return this.toString();
  }
  var rowIds = rightAlign(makeRowIds(this.values.length, maxLines));
  var printVector = rightAlign(this._toTruncatedPrintVector(maxLines));
  var printLines = jd.strCat(rowIds, _PRINT_SEP, printVector);
  return this.toString() + '\n' + printLines.strJoin('\n');
};

dfProto.p = function(maxLines) {
  var printStr = this.printToString(maxLines);
  jd.printingOpts._printCallback(printStr);
};

dfProto.printToString = function(maxLines) {
  if (isUndefined(maxLines)) {
    maxLines = jd.printingOpts._maxLines;
  } else {
    validatePrintMax(maxLines, _MIN_MAX_LINES, 'maxLines');
  }

  var rowIds = rightAlign(jd.vCat('',
    makeRowIds(this.nRow(), maxLines)));
  var printVectors = [rowIds];
  var colIdx = 0;
  var totalWidth = rowIds.at(0).length;
  var stopWidth = jd.printingOpts._maxWidth - _SKIP_MARKER.length -
    _PRINT_SEP.length;
  while (totalWidth <= stopWidth && colIdx < this.nCol()) {
    var colVec = this._cols[colIdx]._toTruncatedPrintVector(maxLines);
    var printVec = rightAlign(jd.vCat(
      toPrintString(this._names.at(colIdx)),
      colVec));
    printVectors.push(_PRINT_SEP);
    printVectors.push(printVec);
    totalWidth += _PRINT_SEP.length + printVec.at(0).length;
    colIdx++;
  }
  if (totalWidth > stopWidth) {
    printVectors.pop();
    printVectors.push(_SKIP_MARKER);
  }

  var printLines = jd.strCat.apply(jd, printVectors);
  return this.toString() + '\n' + printLines.strJoin('\n');
};


// Helper for converting a vector to a string vector of printable
// elements, truncating if the number of elements is more than 'maxLines'
vectorProto._toTruncatedPrintVector = function(maxLines) {
  if (this.values.length > maxLines) {
    var halfCount = Math.ceil(maxLines / 2 - 1);
    var headRange = jd.rng(0, halfCount);
    var tailRange = jd.rng(-halfCount);
    var printVec = this.s([headRange, tailRange])._toPrintVector();
    return jd.vCat(
      printVec.s(headRange), _SKIP_MARKER, printVec.s(tailRange));
  } else {
    return this._toPrintVector();
  }
};

// Helper for converting each element to a printable string
vectorProto._toPrintVector = function() {
  return this.map(toPrintString);
};

// Helper for converting each element to a printable string
numVecProto._toPrintVector = function() {
  if (this.values.some(numIsBelowFixedThreshold) ||
    this.values.some(numIsAboveFixedThreshold)) {

    return this.map(function(num) {
      return num.toExponential(_EXP_FRAC_DIGITS);
    });
  } else {
    var fracDigits = Math.min(_FIXED_NUM_DIGITS,
      this.map(fractionDigits).max());
    return this.map(function(num) {
      return num.toFixed(fracDigits);
    });
  }
};
function numIsBelowFixedThreshold(num) {
  return num !== 0 && Math.abs(num) < _NUM_FIXED_LOWER_BOUND;
}
function numIsAboveFixedThreshold(num) {
  return Math.abs(num) > _NUM_FIXED_UPPER_BOUND;
}


// Helper for right-aligning every element in a string vector,
// padding with spaces so all elements are the same width
function rightAlign(strVec) {
  var maxWidth = strVec.nChar().max();
  var padding = jd.rep(' ', maxWidth).strJoin('');
  return strVec.map(function(str) {
    return (padding + str).slice(-padding.length);
  });
}

// Helper to create column of row ids for printing
function makeRowIds(numRows, maxLines) {
  var printVec = jd.seq(numRows)._toTruncatedPrintVector(maxLines);
  return printVec.map(function(str) {
    return str === _SKIP_MARKER ? str : str + _ROW_ID_SUFFIX;
  });
}

// Helper for converting a value to a printable string
function toPrintString(value) {
  if (isUndefined(value)) {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (Number.isNaN(value)) {
    return 'NaN';
  } else {
    var str = coerceToStr(value);
    var lines = str.split('\n', 2);
    if (lines.length > 1) {
      str = lines[0] + '...';
    }
    if (str.length > _MAX_STR_WIDTH) {
      str = str.slice(0, _MAX_STR_WIDTH - 3) + '...';
    }
    return str;
  }
}
jd._private_export.toPrintString = toPrintString;

// Helper to validate a candidate print maximum
function validatePrintMax(candidate, lowerBound, label) {
  if (typeof candidate !== 'number' || Number.isNaN(candidate)) {
    throw new Error('"' + label + '" must be a number');
  } else if (candidate < lowerBound) {
    throw new Error('"' + label + '" too small');
  }
}

// Helper for retrieving the number of digits after the decimal point for
// the given number.
// This function doesn't work for numbers represented in scientific
// notation, but such numbers will trigger different printing logic anyway.
function fractionDigits(number) {
  var splitArr = number.toString().split('.');
  return (splitArr.length > 1) ?
    splitArr[1].length :
    0;
}
jd._private_export.fractionDigits = fractionDigits;


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

vectorProto.toString = function() {
  return 'Vector[dtype:' + this.dtype +
    ', size:' + this.values.length + ']';
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
  if (dtype === 'string') {
    var internCache = Object.create(null);
    var resultArr = combineMultipleArrays(
      [this.values], coerceToStrInterned, internCache);
    return newVector(resultArr, 'string');
  }
  return jd.vector(this.values, dtype);
};
var coerceToStrInterned = useStringInterning(coerceToStr);


vectorProto.pack = function() {
  return packVector(this);
};
// Helper for packing the given vector, including metadata by default
function packVector(vector, includeMetadata) {
  includeMetadata = isUndefined(includeMetadata) ? true : includeMetadata;
  var dtype = vector.dtype;
  if (vector.dtype === 'date') {
    vector = vector.toDtype('number');
  }
  var values = (vector.dtype !== 'number') ?
    vector.values.slice() :
    vector.values.map(function(x) {
      return Number.isNaN(x) ? null : x;
    });

  var result = {dtype: dtype, values: values};
  if (includeMetadata) {
    result.version = jd.version;
    result.type = vectorProto.type;
  }
  return result;
}


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
  var newArray = subsetArray(this.values, intIdxVec.values);
  return newVector(newArray, this.dtype);
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
  return this.s(jd.rng(0, n));
};


vectorProto.tail = function(n) {
  if (isUndefined(n)) {
    n = 6;
  }
  validateInt(n, 'n');
  var start = (n < 0) ? -n : this.size() - n;
  return this.s(jd.rng(start, undefined));
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


vectorProto.indexOf = function(searchElement) {
  if (this.dtype === 'object') {
    return this.values.indexOf(searchElement);
  }
  var intInds = this._getIndex().lookupKey([searchElement]);
  if (intInds === null) {
    return -1;
  } else if (typeof intInds === 'number') {
    return intInds;
  } else {
    return intInds[0];
  }
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


vectorProto.strJoin = function(separator) {
  return this.values.map(elemToString).join(separator);
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
  throw new Error('unimplemented method (TODO)');
};


vectorProto.equals = function(other, tolerance) {
  if (isMissing(other) || other.type !== vectorProto.type ||
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
  throw new Error('unimplemented method (TODO)');
};


/*-----------------------------------------------------------------------------
* Membership
*/

vectorProto.contains = function(value) {
  validateVectorIsNotDtype(this, 'object');
  value = ensureScalar(value);
  var valDtype = inferDtype(value);
  if (valDtype !== this.dtype && valDtype !== null) {
    throw new Error('"value" does not match the dtype of this vector');
  }
  return this._getIndex().lookupKey([value]) !== null;
};

vectorProto.isIn = function(values) {
  validateVectorIsNotDtype(this, 'object');
  values = ensureVector(values, this.dtype);
  validateVectorIsDtype(values, this.dtype);
  return values._getIndex().has([this]);
};

vectorProto.valueCounts = function() {
  validateVectorIsNotDtype(this, 'object');
  var valCountObj = this._getIndex().valueCounts();
  var df = jd.df([valCountObj.vectors[0], valCountObj.counts],
    ['value', 'count']);
  return df.sort(['count', 'value'], [false, true]);
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

vectorProto.replace = function() {
  // TODO
  throw new Error('unimplemented method (TODO)');
};

vectorProto.describe = function() {
  // TODO
  throw new Error('unimplemented method (TODO)');
};


// Private helper for retrieving the index or creating one if it's not
// yet present
vectorProto._getIndex = function() {
  if (this._index === null) {
    this._index = newNestedIndex([this]);
  }
  return this._index;
};


/*-----------------------------------------------------------------------------
* Set Operations
*/

vectorProto.union = function(other) {
  validateVectorIsNotDtype(this, 'object');
  other = ensureVector(other, this.dtype);
  validateVectorIsDtype(other, this.dtype);
  return jd.vCat(this, other).unique();
};

vectorProto.intersect = function(other) {
  validateVectorIsNotDtype(this, 'object');
  other = ensureVector(other, this.dtype);
  validateVectorIsDtype(other, this.dtype);
  var unique = this.unique();
  return unique.s(unique.isIn(other));
};

vectorProto.setdiff = function(other) {
  validateVectorIsNotDtype(this, 'object');
  other = ensureVector(other, this.dtype);
  validateVectorIsDtype(other, this.dtype);
  var unique = this.unique();
  return unique.s(unique.isIn(other).ex());
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


strVecProto.nChar = function() {
  var resultArr = mapNonNa(this.values, NA_VALUE.number, strNChar);
  return newVector(resultArr, 'number');
};
function strNChar(str) {
  return str.length;
}


strVecProto.charAt = function(index) {
  index = ensureVector(index);
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(
    [this.values, index.values], strCharAt, internCache);
  return newVector(resultArr, 'string');
};
var strCharAt = useStringInterning(function(str, index) {
  if (str === null) {
    return null;
  }
  return str.charAt(index);
});


strVecProto.trim = function() {
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays([this.values], strTrim, internCache);
  return newVector(resultArr, 'string');
};
var strTrim = useStringInterning(function(str) {
  if (str === null) {
    return null;
  }
  return str.trim();
});


strVecProto.strSlice = function(beginSlice, endSlice) {
  beginSlice = ensureVector(beginSlice);
  endSlice = ensureVector(endSlice);
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(
    [this.values, beginSlice.values, endSlice.values],
    elemStrSlice, internCache);
  return newVector(resultArr, 'string');
};
var elemStrSlice = useStringInterning(function(str, begin, end) {
  if (str === null) {
    return null;
  }
  return str.slice(begin, end);
});


strVecProto.substr = function(start, length) {
  start = ensureVector(start);
  length = ensureVector(length);
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(
    [this.values, start.values, length.values], elemSubstr, internCache);
  return newVector(resultArr, 'string');
};
var elemSubstr = useStringInterning(function(str, start, length) {
  if (str === null) {
    return null;
  }
  return str.substr(start, length);
});


strVecProto.strIncludes = function(searchString, position) {
  searchString = ensureVector(searchString);
  position = ensureVector(position);
  var resultArr = combineMultipleArrays(
    [this.values, searchString.values, position.values], elemStrIncludes);
  return newVector(resultArr, 'boolean');
};
function elemStrIncludes(str, searchString, position) {
  if (str === null) {
    return null;
  }
  return str.includes(searchString, position);
}


strVecProto.startsWith = function(searchString, position) {
  searchString = ensureVector(searchString);
  position = ensureVector(position);
  var resultArr = combineMultipleArrays(
    [this.values, searchString.values, position.values], strStartsWith);
  return newVector(resultArr, 'boolean');
};
function strStartsWith(str, searchString, position) {
  if (str === null) {
    return null;
  }
  return str.startsWith(searchString, position);
}


strVecProto.endsWith = function(searchString, position) {
  searchString = ensureVector(searchString);
  position = ensureVector(position);
  var resultArr = combineMultipleArrays(
    [this.values, searchString.values, position.values], strEndsWith);
  return newVector(resultArr, 'boolean');
};
function strEndsWith(str, searchString, position) {
  if (str === null) {
    return null;
  }
  return str.endsWith(searchString, position);
}


strVecProto.strIndexOf = function(searchValue, fromIndex) {
  searchValue = ensureVector(searchValue);
  fromIndex = ensureVector(fromIndex);
  var resultArr = combineMultipleArrays(
    [this.values, searchValue.values, fromIndex.values], elemStrIndexOf);
  return newVector(resultArr, 'number');
};
function elemStrIndexOf(str, searchValue, fromIndex) {
  if (str === null) {
    return NaN;
  }
  return str.indexOf(searchValue, fromIndex);
}


strVecProto.strLastIndexOf = function(searchValue, fromIndex) {
  searchValue = ensureVector(searchValue);
  fromIndex = ensureVector(fromIndex);
  var resultArr = combineMultipleArrays(
    [this.values, searchValue.values, fromIndex.values], elemStrLastIndexOf);
  return newVector(resultArr, 'number');
};
function elemStrLastIndexOf(str, searchValue, fromIndex) {
  if (str === null) {
    return NaN;
  }
  return str.lastIndexOf(searchValue, fromIndex);
}


strVecProto.regexMatch = function(regexp) {
  regexp = ensureVector(regexp);
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(
    [this.values, regexp.values], elemRegexMatch, internCache);
  return newVector(resultArr, 'string');
};
var elemRegexMatch = useStringInterning(function(str, regexp) {
  if (str === null) {
    return null;
  }
  var matchResult = str.match(regexp);
  return (matchResult === null) ? null : matchResult[0];
});


strVecProto.regexSearch = function(regexp) {
  regexp = ensureVector(regexp);
  var resultArr = combineMultipleArrays(
    [this.values, regexp.values], elemRegexSearch);
  return newVector(resultArr, 'number');
};
function elemRegexSearch(str, regexp) {
  if (str === null) {
    return NaN;
  }
  return str.search(regexp);
}


strVecProto.regexTest = function(regexp) {
  regexp = ensureVector(regexp);
  var resultArr = combineMultipleArrays(
    [this.values, regexp.values], elemRegexTest);
  return newVector(resultArr, 'boolean');
};
function elemRegexTest(str, regexp) {
  if (regexp === null || str === null) {
    return null;
  }
  return regexp.test(str);
}


strVecProto.strReplace = function(regexp, newSubStr) {
  regexp = ensureVector(regexp);
  newSubStr = ensureVector(newSubStr);
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(
    [this.values, regexp.values, newSubStr.values],
    elemStrReplace, internCache);
  return newVector(resultArr, 'string');
};
var elemStrReplace = useStringInterning(function(str, regexp, newSubStr) {
  if (str === null) {
    return null;
  }
  return str.replace(regexp, newSubStr);
});


strVecProto.toLowerCase = function() {
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(
    [this.values], strToLowerCase, internCache);
  return newVector(resultArr, 'string');
};
function strToLowerCase(str) {
  if (str === null) {
    return null;
  }
  return str.toLowerCase();
}


strVecProto.toUpperCase = function() {
  var internCache = Object.create(null);
  var resultArr = combineMultipleArrays(
    [this.values], strToUpperCase, internCache);
  return newVector(resultArr, 'string');
};
function strToUpperCase(str) {
  if (str === null) {
    return null;
  }
  return str.toUpperCase();
}


// Helper for transforming a function into a version that performs
// string interning
function useStringInterning(func) {
  return function() {
    var result = func.apply(null, arguments);
    if (result === null) {
      return result;
    }
    var internedStr = this[result];
    if (isUndefined(internedStr)) {
      this[result] = result;
      internedStr = result;
    }
    return internedStr;
  };
}


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

/*-----------------------------------------------------------------------------
* Preliminaries
*/

dfProto.nRow = function() {
  return this._cols.length === 0 ?
    0 :
    this._cols[0].values.length;
};


dfProto.nCol = function() {
  return this._cols.length;
};


dfProto.dtypes = function() {
  return jd.df([this.names(), this._dtypesVector()], ['colName', 'dtype']);
};
// Returns the dtypes as a string vector
dfProto._dtypesVector = function() {
  return newVector(this._cols.map(function(v) { return v.dtype; }), 'string');
};


dfProto.colArray = function() {
    return this._cols.slice();
};


dfProto.colMap = function() {
  var colNameArr = this._names.dropNa().unique().values;
  var colIdx = colNameArr.map(function(colName) {
    return singleColNameLookup(colName, this._names);
  }, this);
  var result = Object.create(null);
  colIdx.forEach(function(colInd, i) {
    var key = colNameArr[i];
    result[key] = this._cols[colInd];
  }, this);
  return result;
};


dfProto.equals = function(other, tolerance) {
  if (other === null || isUndefined(other) ||
    other.type !== dfProto.type || !other.names().equals(this.names())) {
    return false;
  }
  var nCol = this.nCol();
  for (var i = 0; i < nCol; i++) {
    if (!other._cols[i].equals(this._cols[i], tolerance)) {
      return false;
    }
  }
  return true;
};


dfProto.toString = function() {
  var result = 'DataFrame[nRow:' + this.nRow() +
    ', nCol:' + this.nCol() +
    ', allDtype:' + this.allDtype + ']';
  return result;
};


/*-----------------------------------------------------------------------------
* Conversion
*/

dfProto.toObjArray = function() {
  var colNameArr = this._names.dropNa().unique().values;
  var colIdx = colNameArr.map(function(colName) {
    return singleColNameLookup(colName, this._names);
  }, this);
  var nRow = this.nRow();
  var numColsUsed = colNameArr.length;
  var objArray = allocArray(nRow);
  for (var i = 0; i < nRow; i++) {
    var rowObj = {};
    for (var j = 0; j < numColsUsed; j++) {
      rowObj[colNameArr[j]] = this._cols[colIdx[j]].values[i];
    }
    objArray[i] = rowObj;
  }
  return objArray;
};


dfProto.toMatrix = function(includeHeader) {
  includeHeader = isUndefined(includeHeader) ? false : includeHeader;
  var offset = includeHeader ? 1 : 0;
  var nRow = this.nRow();
  var matrix = allocArray(nRow + offset);
  if (includeHeader) {
    matrix[0] = this._names.values;
  }
  var nCol = this.nCol();
  for (var i = 0; i < nRow; i++) {
    var rowArray = allocArray(nCol);
    for (var j = 0; j < nCol; j++) {
      rowArray[j] = this._cols[j].values[i];
    }
    matrix[i + offset] = rowArray;
  }
  return matrix;
};


dfProto.pack = function() {
  var result = {type: dfProto.type, version: jd.version};
  result.names = packVector(this.names(), false);
  result.cols = this._cols.map(function(colVec) {
    return packVector(colVec, false);
  });
  return result;
};


/*-----------------------------------------------------------------------------
* Column Names
*/

dfProto.names = function() {
  return this._names;
};


dfProto.setNames = function(names) {
  names = ensureStringVector(names);
  if (names.size() !== this._cols.length) {
    throw new Error('the length of "names" must match the number of columns');
  }
  return newDataFrame(this._cols, names, false);
};


dfProto.rename = function(nameMap) {
  // TODO
  throw new Error('unimplemented method (TODO)');
};


dfProto.resetNames = function() {
  return newDataFrame(this._cols, generateColNames(this._cols.length), false);
};


/*-----------------------------------------------------------------------------
* Missing Values
*/

dfProto.isNa = function() {
  return this.mapCols(function(vec) {
    return vec.isNa();
  });
};

dfProto.dropNa = function() {
  var nCol = this.nCol();
  var nRow = this.nRow();
  if (nRow === 0) {
    return this;
  }
  var keepArray = allocArray(nRow);
  for (var i = 0; i < nRow; i++) {
    keepArray[i] = true;
    for (var j = 0; j < nCol; j++) {
      if (isMissing(this._cols[j].values[i])) {
        keepArray[i] = false;
        break;
      }
    }
  }
  return this.s(keepArray);
};


/*-----------------------------------------------------------------------------
* Subset Selection / Modification
*/

dfProto.s = function(rowSelect, colSelect) {
  var rowIdxVec = standardIndexing(rowSelect, this.nRow());
  var colIdxVec = columnIndexing(colSelect, this._names, this._dtypesVector());

  var colNameArr = this._names.values;
  var columns = this._cols;
  if (colIdxVec !== null) {
    colNameArr = subsetArray(colNameArr, colIdxVec.values);
    columns = subsetArray(columns, colIdxVec.values);
  }
  var colNames = newVector(colNameArr, 'string');

  if (rowIdxVec !== null) {
    if (colIdxVec === null) {
      // Need to make a copy before modifying columns array
      columns = columns.slice();
    }
    for (var i = 0; i < columns.length; i++) {
      var dtype = columns[i].dtype;
      var newArray = subsetArray(columns[i].values, rowIdxVec.values);
      columns[i] = newVector(newArray, dtype);
    }
  }
  return newDataFrame(columns, colNames, false);
};


dfProto.sMod = function(rowSelect, colSelect, values) {
  var valuesIsDataFrame = (
    !isUndefined(values) &&
    values !== null &&
    values.type === dfProto.type
  );
  if (!valuesIsDataFrame) {
    values = ensureScalar(values);
  }

  var rowIdxVec = standardIndexing(rowSelect, this.nRow());
  var colIdxVec = columnIndexing(colSelect, this._names, this._dtypesVector());
  if (colIdxVec === null) {
    colIdxVec = jd.seq(this.nCol());
  } else {
    validateUniqueColInds(colIdxVec);
  }

  if (valuesIsDataFrame) {
    var numRowsSelected = (rowIdxVec === null) ? this.nRow() : rowIdxVec.size();
    if (numRowsSelected !== values.nRow() ||
      colIdxVec.size() !== values.nCol()) {
      throw new Error('"values" has the wrong dimensions for selection');
    }
  }

  var columns = this._cols.slice();
  for (var i = 0; i < colIdxVec.values.length; i++) {
    var colIdx = colIdxVec.values[i];
    var newValue = valuesIsDataFrame ? values._cols[i] : values;
    columns[colIdx] = (rowIdxVec !== null) ?
      columns[colIdx].sMod(rowIdxVec, newValue) :
      (valuesIsDataFrame ? newValue : jd.rep(newValue, this.nRow()));
  }
  return newDataFrame(columns, this.names(), false);
};


dfProto.c = function(colSelect) {
  var intIdx = singleColNameLookup(colSelect, this._names);
  return this._cols[intIdx];
};


dfProto.cMod = function(colSelect, colValue) {
  var columns = this._cols.slice();
  var intIdx = singleColNameLookup(colSelect, this._names);
  columns[intIdx] = colValue;
  return newDataFrame(columns, this._names);
};


dfProto.insertCol = function(colName, colValue, index) {
  colName = coerceToStr(colName);
  index = isUndefined(index) ? this._cols.length : index;
  index = ensureScalar(index);
  if (!Number.isInteger(index)) {
    throw new Error('expected "index" to be an integer but got: ' + index);
  }

  var columns = this._cols.slice();
  var colNameArr = this._names.values.slice();
  columns.splice(index, 0, colValue);
  colNameArr.splice(index, 0, colName);
  return newDataFrame(columns, newVector(colNameArr, 'string'));
};


dfProto.at = function(i, j) {
  i = ensureScalar(i);
  i = resolveIntIdx(i, this.nRow());
  j = ensureScalar(j);
  if (isNumber(j)) {
    j = resolveIntIdx(j, this.nCol());
  } else if (isString(j) || j === null) {
    j = singleColNameLookup(j, this._names);
  } else {
    throw new Error('expected "j" to be an integer or string but got: ' + j);
  }
  return this._cols[j].values[i];
};


dfProto.locAt = function(lookupCols, lookupKey, colSelect) {
  var lookupVec = this.c(lookupCols);
  var colIdx = singleColNameLookup(colSelect, this._names);
  var rowIdx = lookupVec.indexOf(lookupKey);
  if (rowIdx === -1) {
    throw new Error('no match for lookup key: ' + lookupKey);
  }
  return this._cols[colIdx].values[rowIdx];
};


dfProto.head = function(n) {
  if (isUndefined(n)) {
    n = 6;
  }
  validateInt(n, 'n');
  return this.s(jd.rng(0, n));
};


dfProto.tail = function(n) {
  if (isUndefined(n)) {
    n = 6;
  }
  validateInt(n, 'n');
  var start = (n < 0) ? -n : this.nRow() - n;
  return this.s(jd.rng(start, undefined));
};


/*-----------------------------------------------------------------------------
* Column / Row Iteration
*/

dfProto.mapCols = function(colSelect, func) {
  if (arguments.length < 2) {
    func = colSelect;
    colSelect = null;
  }
  validateFunction(func, 'func');

  var colIdxVec = columnIndexing(colSelect, this._names, this._dtypesVector());
  if (colIdxVec === null) {
    colIdxVec = jd.seq(this._cols.length);
  }

  var oldNameArr = this._names.values;
  var numIters = colIdxVec.values.length;
  var colNameArr = allocArray(numIters);
  var columns = allocArray(numIters);
  for (var j = 0; j < numIters; j++) {
    var colIndex = colIdxVec.values[j];
    var colVector = this._cols[colIndex];
    var colName = oldNameArr[colIndex];
    columns[j] = func(colVector, colName, colIndex, j);
    colNameArr[j] = colName;
  }

  var colNames = newVector(colNameArr, 'string');
  return newDataFrame(columns, colNames);
};


dfProto.updateCols = function(colSelect, func) {
  if (arguments.length < 2) {
    func = colSelect;
    colSelect = null;
  }
  validateFunction(func, 'func');

  var colIdxVec = columnIndexing(colSelect, this._names, this._dtypesVector());
  if (colIdxVec === null) {
    colIdxVec = jd.seq(this._cols.length);
  } else {
    validateUniqueColInds(colIdxVec);
  }

  var nameArray = this._names.values;
  var columns = this._cols.slice();
  var numIters = colIdxVec.values.length;
  for (var j = 0; j < numIters; j++) {
    var colIndex = colIdxVec.values[j];
    var colVector = this._cols[colIndex];
    var colName = nameArray[colIndex];
    columns[colIndex] = func(colVector, colName, colIndex, j);
  }

  return newDataFrame(columns, this._names);
};


dfProto.mapRowObjects = function(func, thisArg) {
  validateFunction(func, 'func');
  return this.toObjArray().map(func, thisArg);
};


dfProto.mapRowArrays = function(func, thisArg) {
  validateFunction(func, 'func');
  return this.toMatrix().map(func, thisArg);
};


dfProto.mapRowVectors = function(func, thisArg) {
  validateFunction(func, 'func');
  var allDtype = this.allDtype;
  if (allDtype === null) {
    throw new Error('cannot call "mapRowVectors" on a data frame with ' +
      'null "allDtype" property');
  }
  var array = this.toMatrix();
  for (var i = 0; i < array.length; i++) {
    array[i] = newVector(array[i], allDtype);
  }
  return array.map(func, thisArg);
};


dfProto.mapRowDfs = function(func, thisArg) {
  validateFunction(func, 'func');
  var nRow = this.nRow();
  var rowDfs = allocArray(nRow);
  for (var i = 0; i < nRow; i++) {
    rowDfs[i] = this.s(i);   // could be optimized
  }
  return rowDfs.map(func, thisArg);
};


/*-----------------------------------------------------------------------------
* Row Uniqueness
*/

dfProto.unique = function() {
  if (this.nCol() === 0) {
    return this;
  }
  validateDataFrameHasNoObjectCols(this);
  var columns = this._getIndex().unique();
  return newDataFrame(columns, this._names, false);
};


dfProto.nUnique = function() {
  if (this.nCol() === 0) {
    return 0;
  }
  validateDataFrameHasNoObjectCols(this);
  return this._getIndex().size;
};


dfProto.duplicated = function(keep) {
  if (this.nCol() === 0) {
    return newVector([], 'boolean');
  }
  validateDataFrameHasNoObjectCols(this);
  return this._getIndex().duplicated(keep);
};


// Private helper for retrieving the multi-column index or creating one
// if it's not yet present.  If this data frame contains only a single
// column, just use the index for that column vector.
dfProto._getIndex = function() {
  if (this._cols.length === 1) {
    return this._cols[0]._getIndex();
  }
  if (this._index === null) {
    this._index = newNestedIndex(this._cols);
  }
  return this._index;
};


/*-----------------------------------------------------------------------------
* Grouping
*/

dfProto.groupApply = function(colSelect, func, colNames) {
  if (isUndefined(colSelect)) {
    throw new Error('"colSelect" must not be undefined');
  }
  var colIdxVec = columnIndexing(colSelect, this._names, this._dtypesVector());
  validateUniqueColInds(colIdxVec);
  if (colIdxVec === null || colIdxVec.size() === this.nCol()) {
    throw new Error('"colSelect" must not select every column in the ' +
      'data frame');
  } else if (colIdxVec.size() === 0) {
    throw new Error('"colSelect" must select at least 1 column');
  }
  var nonKeyDf = this.s(null, colIdxVec.ex());
  var groupKeyDf = this.s(null, colIdxVec);
  validateDataFrameHasNoObjectCols(groupKeyDf);
  var groupIndex = groupKeyDf._getIndex();
  var uniqKeyDf = groupKeyDf.unique();

  validateFunction(func, 'func');

  if (!isUndefined(colNames)) {
    colNames = ensureVector(colNames, 'string');
    if (colNames.dtype !== 'string') {
      colNames = colNames.toDtype('string');
    }
  }

  // Apply 'func' to each group
  var nRow = uniqKeyDf.nRow();
  var groupResultArr = allocArray(nRow);
  var funcNCols = -1;
  var resultInd = 0;
  for (var i = 0; i < nRow; i++) {
    var keyDf = uniqKeyDf.s(i);   // could be optimized
    var rowNums = groupIndex.lookup(uniqKeyDf._cols, i);
    var subsetDf = nonKeyDf.s(rowNums);   // could be optimized
    var groupResult = func(subsetDf, keyDf);
    if (isUndefined(groupResult)) {
      continue;
    }
    var colCount;
    var colCatArr;
    if (groupResult === null) {
      colCount = 1;
      colCatArr = [keyDf, groupResult];
    } else if (groupResult.type === dfProto.type) {
      colCount = groupResult.nCol();
      colCatArr = [keyDf, groupResult];
    } else if (groupResult.type === vectorProto.type) {
      colCount = groupResult.size();
      colCatArr = [keyDf].concat(groupResult.values);
    } else if (Array.isArray(groupResult)) {
      colCount = groupResult.length;
      colCatArr = [keyDf].concat(groupResult);
    } else {
      colCount = 1;
      colCatArr = [keyDf, groupResult];
    }
    if (funcNCols === -1) {
      funcNCols = colCount;
      if (!isUndefined(colNames) && colCount !== colNames.size()) {
        throw new Error('length of "colNames" must match implied number ' +
          'of columns returned by "func"');
      }
    } else if (colCount !== funcNCols) {
      throw new Error('inconsistent implied column counts returned from ' +
        '"func": ' + funcNCols + ', ', + colCount);
    }
    groupResultArr[resultInd] = jd._colCatArray(colCatArr); // could be optimized
    resultInd++;
  }
  if (resultInd === 0) {
    return uniqKeyDf.s([]);
  }
  if (groupResultArr.length !== resultInd) {
    groupResultArr.length = resultInd;
  }

  // Combine results
  var resultDf = jd._rowCatArray(groupResultArr);
  if (!isUndefined(colNames)) {
    var resultNames = resultDf.names();
    resultNames = resultNames.sMod(jd.rng(colIdxVec.size()), colNames);
    resultDf = resultDf.setNames(resultNames);
  }
  return resultDf;
};


/*-----------------------------------------------------------------------------
* Reshaping and Sorting
*/

dfProto.transpose = function(preservedColName, headerSelector) {
  if (this.nRow() === 0) {
    return jd.df([]);
  }
  preservedColName = isUndefined(preservedColName) ? null : preservedColName;
  if (preservedColName !== null && !isString(preservedColName)) {
    throw new Error('"preservedColName" must be a string when not null or ' +
      'undefined');
  }

  var nRowOrig = this.nRow();
  var dfToTranspose;
  var colNames;
  if (!isUndefined(headerSelector)) {
    var intIdx = singleColNameLookup(headerSelector, this._names);
    dfToTranspose = this.s(null, jd.ex(intIdx));
    colNames = this.c(intIdx);
    if (colNames.dtype !== 'string') {
      colNames = colNames.toDtype('string');
    }
  } else {
    dfToTranspose = this;
    colNames = generateColNames(nRowOrig);
  }

  var offset;
  var columns;
  if (preservedColName !== null) {
    colNames = jd.vCat(preservedColName, colNames);
    offset = 1;
    columns = allocArray(nRowOrig + 1);
    columns[0] = dfToTranspose._names;
  } else {
    offset = 0;
    columns = allocArray(nRowOrig);
  }
  var nCol = dfToTranspose.nCol();
  for (var j = 0; j < nRowOrig; j++) {
    var newCol = allocArray(nCol);
    for (var i = 0; i < nCol; i++) {
      newCol[i] = dfToTranspose._cols[i].values[j];
    }
    columns[j + offset] = newCol;
  }

  return newDataFrame(columns, colNames);
};


dfProto.sort = function(colSelect, ascending) {
  if (isUndefined(colSelect)) {
    throw new Error('"colSelect" must not be undefined');
  }

  var colIdxVec = columnIndexing(colSelect, this._names, this._dtypesVector());
  if (colIdxVec === null) {
    colIdxVec = jd.seq(this.nCol());
  } else {
    validateUniqueColInds(colIdxVec);
  }
  var sortDf = this.s(null, colIdxVec);
  validateDataFrameHasNoObjectCols(sortDf);

  ascending = isUndefined(ascending) ? true : ascending;
  ascending = ensureVector(ascending, 'boolean');
  validateVectorIsDtype(ascending, 'boolean');
  if (ascending.isNa().any()) {
    throw new Error('"ascending" must not contain missing values');
  }
  if (ascending.size() === 1) {
    ascending = jd.rep(ascending, sortDf.nCol());
  }

  var argSortIdxArray = argSort(sortDf._cols, ascending.values);
  return this.s(argSortIdxArray);
};


dfProto.melt = function(idVars, varName, valueName) {
  varName = (isUndefined(varName) || varName === null) ? 'variable' :
    ensureScalar(varName).toString();
  valueName = (isUndefined(valueName) || valueName === null) ? 'value' :
    ensureScalar(valueName).toString();

  var idIdxVec = columnIndexing(idVars, this._names, this._dtypesVector());
  var valIdxVec = jd.seq(this.nCol()).s(jd.ex(idIdxVec));
  if (valIdxVec.size() === 0) {
    throw new Error('"idVars" must not select all columns in the data frame');
  }
  validateUniqueColInds(idIdxVec);

  // Construct id vectors
  var idDf = this.mapCols(idIdxVec, function(colVec) {
    return jd.rep(colVec, valIdxVec.size());
  });

  // Construct 'variable' column
  var varVec = jd.repEach(this.names().s(valIdxVec), this.nRow());

  // Construct 'value' column
  var valVec = jd.vCat.apply(jd, this.s(null, valIdxVec).colArray());

  return jd.colCat(idDf, jd.df([varVec, valVec], [varName, valueName]));
};


dfProto.pivot = function(pivotCol, valueCol, opts) {
  opts = isUndefined(opts) ? {} : opts;
  validateOptsProperties(opts, ['idVars', 'aggFunc', 'fillValue']);
  var aggFunc = opts.aggFunc;
  var fillValue = opts.fillValue;

  var pivotIdx = singleColNameLookup(pivotCol, this._names);
  var valueIdx = singleColNameLookup(valueCol, this._names);
  if (pivotIdx === valueIdx) {
    throw new Error('"pivotCol" and "valueCol" must be different');
  }

  var idIdxVec;
  if (isUndefined(opts.idVars)) {
    idIdxVec = jd.seq(this.nCol()).s(jd.ex([pivotIdx, valueIdx]));
  } else {
    idIdxVec = columnIndexing(opts.idVars, this._names, this._dtypesVector());
    if (idIdxVec === null) {
      idIdxVec = jd.seq(this.nCol());
    }
    validateUniqueColInds(idIdxVec);
  }
  if (idIdxVec.contains(pivotIdx) || idIdxVec.contains(valueIdx)) {
    throw new Error('"idVars" must not include pivotCol or valueCol');
  }
  if (idIdxVec.size() === 0) {
    throw new Error('one or more columns must be selected as id columns');
  }

  var pivotColDf = jd.df([this.c(pivotIdx).unique().sort()], ['variable']);
  var relevantCols = jd.vCat(idIdxVec, pivotIdx, valueIdx);
  var trimmedDf = this.s(null, relevantCols);
  var result = trimmedDf.groupApply(jd.rng(0, -2), function(subDf) {
    subDf = subDf.setNames(['variable', 'value']);
    if (!isUndefined(aggFunc)) {
      subDf = subDf.groupApply('variable', function(valueDf) {
        return aggFunc(valueDf.c(0));
      }, 'value');
    }
    var orderedDf = pivotColDf.join(subDf, 'left');
    if (orderedDf.nRow() !== pivotColDf.nRow()) {
      throw new Error('must provide "aggFunc" when aggregation is required');
    }
    return isUndefined(fillValue) ? orderedDf.c('value') :
      orderedDf.c('value').replaceNa(fillValue);
  }, pivotColDf.c('variable'));

  return result;
};


/*-----------------------------------------------------------------------------
* Joins
*/

var validJoinOpts = jd.vector([
  'by', 'leftBy', 'rightBy', 'leftSuffix', 'rightSuffix', 'indicator'
]);

dfProto.join = function(other, how, opts) {
  if (isUndefined(other) || other === null || other.type !== dfProto.type) {
    throw new Error('"other" must be a data frame');
  }
  var joinIndicator = false;
  var leftSuffix = '_x';
  var rightSuffix = '_y';

  // Validate "how"
  var allLeft = false;
  var allRight = false;
  switch (how) {
    case 'inner':
      break;
    case 'left':
      allLeft = true;
      break;
    case 'right':
      allRight = true;
      break;
    case 'outer':
      allLeft = true;
      allRight = true;
      break;
    default:
      throw new Error('"how" must be one of the following strings: ' +
        '"inner", "left", "right", "outer"');
  }

  // Check for valid properties in "opts"
  if (!isUndefined(opts)) {
    validateOptsProperties(opts, validJoinOpts);

    if (!isUndefined(opts.indicator)) {
      joinIndicator = opts.indicator;
    }
    if (!isUndefined(opts.leftSuffix)) {
      leftSuffix = opts.leftSuffix;
    }
    if (!isUndefined(opts.rightSuffix)) {
      rightSuffix = opts.rightSuffix;
    }
  }

  // Resolve key columns
  var keyIdxObj = resolveKeyColumns(this, other, opts);
  var leftKeyIdxVec = keyIdxObj.left;
  var rightKeyIdxVec = keyIdxObj.right;
  var leftKeyDf = this.s(null, leftKeyIdxVec);
  var leftNonKeyDf = this.s(null, leftKeyIdxVec.ex());
  var rightKeyDf = other.s(null, rightKeyIdxVec);
  var rightNonKeyDf = other.s(null, rightKeyIdxVec.ex());
  if (leftKeyDf.dtypes().c('dtype').contains('object') ||
    rightKeyDf.dtypes().c('dtype').contains('object')) {
    throw new Error('key columns must not have "object" dtype');
  }
  if (!leftKeyDf.dtypes().c('dtype').equals(rightKeyDf.dtypes().c('dtype'))) {
    throw new Error('key columns must have matching dtypes on left ' +
      'and right');
  }

  // Form output column names
  var nonKeyCommonNames = leftNonKeyDf.names().s(
    leftNonKeyDf.names().isIn(rightNonKeyDf.names())
  );
  var leftNonKeyNames = leftNonKeyDf.names().map(function(name) {
    return nonKeyCommonNames.contains(name) ?
      name + leftSuffix:
      name;
  });
  var rightNonKeyNames = rightNonKeyDf.names().map(function(name) {
    return nonKeyCommonNames.contains(name) ?
      name + rightSuffix:
      name;
  });
  var colNames = jd.vCat(leftKeyDf.names(), leftNonKeyNames, rightNonKeyNames,
    (joinIndicator ? ['_join'] : []));

  // Perform join
  var rightIndex = rightKeyDf._getIndex();
  var numRows = leftKeyDf.nRow();
  var rightRowFlags, i;
  var arrayCols = allocArray(colNames.size());
  for (i = 0; i < arrayCols.length; i++) {
    arrayCols[i] = [];
  }
  if (allRight) {
    rightRowFlags = allocArray(rightKeyDf.nRow());
    for (i = 0; i < rightRowFlags.length; i++) {
      rightRowFlags[i] = true;
    }
  }
  for (i = 0; i < numRows; i++) {
    var rightInds = rightIndex.lookup(leftKeyDf._cols, i);
    if (rightInds === null) {
      if (allLeft) {
        appendJoinRow(arrayCols, leftKeyDf, leftNonKeyDf, rightNonKeyDf,
          i, null, 'leftOnly');
      }
    } else if (typeof rightInds === 'number') {
      appendJoinRow(arrayCols, leftKeyDf, leftNonKeyDf, rightNonKeyDf,
        i, rightInds, 'both');
      if (allRight) {
        rightRowFlags[rightInds] = false;
      }
    } else {
      for (var j = 0; j < rightInds.length; j++) {
        var rightInd = rightInds[j];
        appendJoinRow(arrayCols, leftKeyDf, leftNonKeyDf, rightNonKeyDf,
          i, rightInd, 'both');
        if (allRight) {
          rightRowFlags[rightInd] = false;
        }
      }
    }
  }
  // Append unmatched rows from right side if requested
  if (allRight) {
    var rightKeyDf2 = rightKeyDf.s(rightRowFlags);
    var rightNonKeyDf2 = rightNonKeyDf.s(rightRowFlags);
    numRows = rightKeyDf2.nRow();
    for (i = 0; i < numRows; i++) {
      appendJoinRow(arrayCols, rightKeyDf2, leftNonKeyDf, rightNonKeyDf2,
        null, i, 'rightOnly', true);
    }
  }

  return newDataFrame(arrayCols, colNames);
};


// Helper for appending values to "arrayCols" from "leftInd" and "rightInd"
function appendJoinRow(arrayCols, keyDf, leftNonKeyDf, rightNonKeyDf,
  leftInd, rightInd, indicatorValue, rightIndForKey) {

  var keyInd = rightIndForKey ? rightInd : leftInd;
  var i, nCol;
  var colInd = 0;
  nCol = keyDf.nCol();
  for (i = 0; i < nCol; i++) {
    arrayCols[colInd].push(keyDf._cols[i].values[keyInd]);
    colInd++;
  }
  nCol = leftNonKeyDf.nCol();
  for (i = 0; i < nCol; i++) {
    var leftVal = (leftInd === null) ? null :
      leftNonKeyDf._cols[i].values[leftInd];
    arrayCols[colInd].push(leftVal);
    colInd++;
  }
  nCol = rightNonKeyDf.nCol();
  for (i = 0; i < nCol; i++) {
    var rightVal = (rightInd === null) ? null :
      rightNonKeyDf._cols[i].values[rightInd];
    arrayCols[colInd].push(rightVal);
    colInd++;
  }
  if (colInd < arrayCols.length) {
    // Add the join indicator value if there's a final column for it
    arrayCols[colInd].push(indicatorValue);
  }
}


// Helper for resolving key columns to integer indices
function resolveKeyColumns(leftDf, rightDf, opts) {
  // Resolve key columns to integer indices
  var leftKeyIdxVec, rightKeyIdxVec;
  if (isUndefined(opts) ||
    (isUndefined(opts.by) && isUndefined(opts.leftBy) &&
      isUndefined(opts.rightBy))) {

    var commonNames = leftDf.names().s(leftDf.names().isIn(rightDf.names()));
    if (commonNames.nUnique() !== commonNames.size()) {
      throw new Error('duplicate names found for key columns');
    }
    leftKeyIdxVec =
      columnIndexing(commonNames, leftDf._names, leftDf._dtypesVector());
    rightKeyIdxVec =
      columnIndexing(commonNames, rightDf._names, rightDf._dtypesVector());
  } else {
    if (!isUndefined(opts.by)) {
      if (!isUndefined(opts.leftBy) || !isUndefined(opts.rightBy)) {
        throw new Error('cannot define opts.by, opts.leftBy, and ' +
          'opts.rightBy all together');
      }
      if (opts.by !== null && typeof opts.by === 'object' &&
        opts.by.type !== vectorProto.type) {
        // Extract left names from keys and right names from values
        var leftNames = Object.keys(opts.by);
        var rightNames = leftNames.map(function(key) {
          return opts.by[key];
        });
        leftKeyIdxVec =
          columnIndexing(leftNames, leftDf._names, leftDf._dtypesVector());
        rightKeyIdxVec =
          columnIndexing(rightNames, rightDf._names, rightDf._dtypesVector());
      } else {
        var keyNames = ensureVector(opts.by, 'string');
        leftKeyIdxVec =
          columnIndexing(keyNames, leftDf._names, leftDf._dtypesVector());
        rightKeyIdxVec =
          columnIndexing(keyNames, rightDf._names, rightDf._dtypesVector());
        if (keyNames.size() !== leftKeyIdxVec.size()) {
          throw new Error('duplicate names found for key columns');
        }
      }
    } else {
      if (isUndefined(opts.leftBy) || isUndefined(opts.rightBy)) {
        throw new Error('must specify both opts.leftBy and ' +
          'opts.rightBy together');
      }
      leftKeyIdxVec =
        columnIndexing(opts.leftBy, leftDf._names, leftDf._dtypesVector());
      rightKeyIdxVec =
        columnIndexing(opts.rightBy, rightDf._names, rightDf._dtypesVector());
    }
  }

  // Check validity of key column indices
  validateUniqueColInds(leftKeyIdxVec);
  validateUniqueColInds(rightKeyIdxVec);
  if (leftKeyIdxVec.size() !== rightKeyIdxVec.size()) {
    throw new Error('must select the same number of key columns on the ' +
      'left and right side; instead got ' + leftKeyIdxVec.size() +
      ', ' + rightKeyIdxVec.size());
  }
  if (leftKeyIdxVec.size() === 0 || rightKeyIdxVec.size() === 0) {
    throw new Error('must select at least one key column to join by');
  }

  return {
    left: leftKeyIdxVec,
    right: rightKeyIdxVec,
  };
}


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

jd.rng = function(start, stop, includeStop) {
  includeStop = isUndefined(includeStop) ? null : includeStop;

  if (includeStop !== null && typeof includeStop !== 'boolean') {
    throw new Error('"includeStop" must be either true, false, or null');
  }
  var mixingNumAndStr = (isNumber(start) && isString(stop)) ||
    (isString(start) && isNumber(stop));
  if (mixingNumAndStr && includeStop === null) {
    throw new Error('"includeStop" must be set to either true or false ' +
      'when mixing numbers and strings for start/stop');
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
* ByDtype
*/

var VALID_DTYPES_VEC = jd.vector(Object.keys(VALID_DTYPES));

jd.byDtype = function(dtypes) {
  dtypes = ensureVector(dtypes);
  validateVectorIsDtype(dtypes, 'string');
  dtypes = dtypes.unique();
  var isValidDtype = dtypes.isIn(VALID_DTYPES_VEC);
  if (!isValidDtype.all()) {
    var invalidDtype = dtypes.s(isValidDtype.not()).at(0);
    throw new Error('invalid dtype: ""' + invalidDtype + '"');
  }
  var byDtype = Object.create(byDtypeProto);
  byDtype._dtypes = dtypes;
  return byDtype;
};

byDtypeProto.ex = function() {
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
  if (isUndefined(selector) || selector === null) {
    return null;
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
  if (isUndefined(selector) || selector === null) {
    return null;
  }

  // Handle boolean case if applicable
  var maxLen = colNames.size();
  var boolIdxResult = attemptBoolIndexing(selector, maxLen);
  if (!isUndefined(boolIdxResult)) {
    return boolIdxResult;
  }

  // Handle integer index / col name lookup hybrid
  var opts = resolverOpts(RESOLVE_MODE.COL, maxLen,
    colNames._getIndex(), dtypes);
  return resolveSelector(selector, opts);
}


// Perform key lookup indexing
// 'index' should be an AbstractIndex implementation
function keyIndexing(selector, maxLen, index) {
  var opts = resolverOpts(RESOLVE_MODE.KEY, maxLen, index);
  return resolveSelector(selector, opts);
}


// Performs boolean indexing if 'selector' is a boolean vector
// or array of the same length as maxLen or an exclusion wrapping
// such a vector or array.
// Returns undefined if 'selector' is inappropriate for boolean
// indexing; returns a vector of integer indices if boolean
// indexing resolves appropriately.
function attemptBoolIndexing(selector, maxLen) {
  if (selector.type === exclusionProto.type) {
    var intIdxVector = attemptBoolIndexing(selector._selector, maxLen);
    return isUndefined(intIdxVector) ?
      undefined :
      excludeIntIndices(intIdxVector, maxLen);
  }
  if (Array.isArray(selector)) {
    selector = inferVectorDtype(selector.slice(), 'object');
  }
  if (selector.type === vectorProto.type && selector.dtype === 'boolean') {
    if (selector.size() !== maxLen) {
      throw new Error('inappropriate boolean indexer length (' +
        selector.size() + '); expected length to be ' + maxLen);
    }
    return selector.which();
  }
}


// Returns the integer indices resulting from excluding the
// intIdxVector based on the given maxLen
function excludeIntIndices(intIdxVector, maxLen) {
  return jd.seq(maxLen).isIn(intIdxVector).not().which();
}


// Construct options for resolveSelector().
// 'resolveMode' should be one of the values in RESOLVE_MODE.
// 'maxLen' should be the total length to index against.
// 'index' should be an AbstractIndex implementation if given.
// 'dtypes' should be a string vector of dtypes if given.
function resolverOpts(resolveMode, maxLen, index, dtypes) {
  index = isUndefined(index) ? null : index;
  dtypes = isUndefined(dtypes) ? null : dtypes;
  return {
    resolveMode: resolveMode,
    maxLen: maxLen,
    index: index,
    dtypes: dtypes,
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
  if (selector !== null && typeof selector === 'object') {
    if (typeof selector._resolveSelectorHelper === 'function') {
      selector._resolveSelectorHelper(opts, resultArr);
      return;
    }
    if (Array.isArray(selector)) {
      for (var i = 0; i < selector.length; i++) {
        resolveSelectorHelper(selector[i], opts, resultArr);
      }
      return;
    }
  }

  // Handle scalar case
  var intInds;
  switch (opts.resolveMode) {
    case RESOLVE_MODE.INT:
      resultArr.push(resolveIntIdx(selector, opts.maxLen));
      break;
    case RESOLVE_MODE.COL:
      if (isNumber(selector)) {
        resultArr.push(resolveIntIdx(selector, opts.maxLen));
      } else if (isString(selector) || selector === null) {
        intInds = opts.index.lookupKey([selector]);
        processLookupResults(intInds, selector, opts, resultArr);
      } else {
        throw new Error('expected integer or string selector but got: ' +
          selector);
      }
      break;
    case RESOLVE_MODE.KEY:
      if (opts.index.arity === 1) {
        var expectedDtype = opts.index.initVectors[0].dtype;
        validateScalarIsDtype(selector, expectedDtype);
        intInds = opts.index.lookupKey([selector]);
        processLookupResults(intInds, selector, opts, resultArr);
      } else {
        // TODO
        throw new Error('unimplemented case (TODO)');
      }
      break;
    default:
      throw new Error('Unrecognized RESOLVE_MODE: ' + opts.resolveMode);
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
        throw new Error('expected number vector for integer indexing ' +
          'but got vector with dtype: "' + this.dtype + '"');
      }
      for (i = 0; i < this.values.length; i++) {
        resultArr.push(resolveIntIdx(this.values[i], opts.maxLen));
      }
      break;
    case RESOLVE_MODE.COL:
      if (isNumDtype) {
        for (i = 0; i < this.values.length; i++) {
          resultArr.push(resolveIntIdx(this.values[i], opts.maxLen));
        }
      } else if (isStrDtype) {
        for (i = 0; i < this.values.length; i++) {
          var currVal = this.values[i];
          intInds = opts.index.lookupKey([currVal]);
          processLookupResults(intInds, currVal, opts, resultArr);
        }
      } else {
        throw new Error('expected number or string vector for column ' +
          'indexing but got vector with dtype: "' + this.dtype + '"');
      }
      break;
    case RESOLVE_MODE.KEY:
      if (opts.index.arity === 1) {
        var expectedDtype = opts.index.initVectors[0].dtype;
        if (this.dtype !== expectedDtype) {
          throw new Error('expected "' + expectedDtype + '" vector for key ' +
            'lookup but got vector with dtype: "' + this.dtype + '"');
        }
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


// ByDtype selector resolution logic
byDtypeProto._resolveSelectorHelper = function(opts, resultArr) {
  if (opts.dtypes === null) {
    throw new Error('ByDtype selector can only be used for column indexing');
  }
  var intIdxVector = opts.dtypes.isIn(this._dtypes).which();
  for (var i = 0; i < intIdxVector.values.length; i++) {
    resultArr.push(intIdxVector.values[i]);
  }
};


// Exclusion selector resolution logic
exclusionProto._resolveSelectorHelper = function(opts, resultArr) {
  var innerResultArr = [];
  resolveSelectorHelper(this._selector, opts, innerResultArr);
  var intIdxVector = excludeIntIndices(newVector(innerResultArr, 'number'),
    opts.maxLen);
  for (var i = 0; i < intIdxVector.values.length; i++) {
    resultArr.push(intIdxVector.values[i]);
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
    for (var j = 0; j < intInds.length; j++) {
      resultArr.push(intInds[j]);
    }
  }
}


// Returns the integer index of the first occurrence of a single column
// name or throws an error if 'selector' is invalid or no occurrence is found.
// 'selector' can be a single integer or string expressed as a scalar,
// array, or vector.  'colNames' must be a string vector
function singleColNameLookup(selector, colNames) {
  if (isUndefined(selector)) {
    throw new Error('selector must not be undefined');
  }
  selector = ensureScalar(selector);
  if (isNumber(selector)) {
    return resolveIntIdx(selector, colNames.values.length);
  } else if (isString(selector) || selector === null) {
    var intInds = colNames._getIndex().lookupKey([selector]);
    if (intInds === null) {
      throw new Error('invalid column name: ' + selector);
    } else if (typeof intInds !== 'number') {
      // must be an array, so use the first element
      intInds = intInds[0];
    }
    return intInds;
  } else {
    throw new Error('column selector must be an integer or string');
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
// a single element to index a single vector).
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
// identical.  'thisArg' (default null) is the value to use as "this" when
// calling func.
function combineMultipleArrays(arrays, func, thisArg) {
  if (arrays.length === 0) {
    throw new Error('cannot combine an empty list of arrays');
  }
  thisArg = isUndefined(thisArg) ? null : thisArg;

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
    resultArray[i] = func.apply(thisArg, argArray);
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


// Uses the integer indexes in 'intIdx' to subset 'array', returning
// the results.  All indices in 'intIdx' are assumed to be in bounds.
function subsetArray(array, intIdx) {
  var result = allocArray(intIdx.length);
  for (var i = 0; i < intIdx.length; i++) {
    result[i] = array[intIdx[i]];
  }
  return result;
}


/*-----------------------------------------------------------------------------
* DataFrame helpers
*/

// Returns a string vector of length 'numCols' with default column names
function generateColNames(numCols) {
  return jd.strCat('c', jd.seq(numCols));
}

// Throws an error if colIdxVec contains any duplicates
function validateUniqueColInds(colIdxVec) {
  if (colIdxVec.nUnique() !== colIdxVec.values.length) {
    throw new Error('duplicate occurrence of one or more columns ' +
      'in selection');
  }
}

// Creates a new data frame with the given 'columns' array and 'colNames'
// string vector.  If "validateCols" is true (the default), every element
// in 'columns' is explicitly converted to a vector and consistency of
// resulting lengths is checked, expanding length-1 vectors if necessary.
// Otherwise, 'columns' is assumed to already contain vectors all of the
// same length
function newDataFrame(columns, colNames, validateCols) {
  var i;
  var nCol = columns.length;

  validateCols = isUndefined(validateCols) ? true : validateCols;
  if (validateCols) {
    var nRow = 1;
    for (i = 0; i < nCol; i++) {
      columns[i] = ensureVector(columns[i]);
      var colLen = columns[i].values.length;
      if (colLen !== 1) {
        if (nRow === 1) {
          nRow = colLen;
        } else if (colLen !== nRow) {
          throw new Error('incompatible column lengths found during ' +
            'data frame construction: ' + nRow + ', ' + colLen);
        }
      }
    }
    // Expand any length-1 vectors if necessary
    if (nRow !== 1) {
      for (i = 0; i < nCol; i++) {
        if (columns[i].values.length === 1) {
          var value = columns[i].values[0];
          var newArray = allocArray(nRow);
          for (var j = 0; j < nRow; j++) {
            newArray[j] = value;
          }
          columns[i] = newVector(newArray, columns[i].dtype);
        }
      }
    }
  }

  // Figure out allDtype
  var allDtype = null;
  if (nCol > 0) {
    allDtype = columns[0].dtype;
    for (i = 1; i < nCol; i++) {
      if (columns[i].dtype !== allDtype) {
        allDtype = null;
        break;
      }
    }
  }

  // Create data frame
  var df = Object.create(dfProto);
  df._cols = columns;
  df._names = colNames;
  df._index = null;
  df.allDtype = allDtype;

  return df;
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
    typeof value !== 'object' ? value.toString() :
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


// Converts the element into a string (e.g. for printing purposes)
function elemToString(element) {
  return (
    element === null ? 'null' :
    isUndefined(element) ? 'undefined' :
    typeof element !== 'object' ? element.toString() :
    isDate(element) ? element.toISOString() :
    element.toString()
  );
}


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


// The reverse of "compare"
var compareReverse = reverseComp(compare);


// Returns a new compare function for Array.prototype.sort() that
// reverses the order of the given compareFunc
function reverseComp(compareFunc) {
  return function(a, b) {
    return -compareFunc(a, b);
  };
}
jd._private_export.reverseComp = reverseComp;


// Returns an array of integer indices that would sort the given array of
// vectors, starting with the first vector, then the second, etc.
// "ascending" must be an array of booleans with the same length as "vectors".
// Returns null if "vectors" is empty.
function argSort(vectors, ascending) {
  if (vectors.length !== ascending.length) {
    throw new Error('length of "ascending" must match the number of ' +
      'sort columns');
  }
  if (vectors.length === 0) {
    return null;
  }
  var nRow = vectors[0].size();
  var result = allocArray(nRow);
  for (var i = 0; i < nRow; i++) {
    result[i] = i;
  }

  // Create composite compare function
  var compareFuncs = ascending.map(function(asc) {
    return asc ? compare : compareReverse;
  });
  var compositeCompare = function(a, b) {
    var result = 0;
    for (var i = 0; i < compareFuncs.length; i++) {
      var aValue = vectors[i].values[a];
      var bValue = vectors[i].values[b];
      result = compareFuncs[i](aValue, bValue);
      if (result !== 0) {
        return result;
      }
    }
    // Order based on row index as last resort to ensure stable sorting
    return compare(a, b);
  };

  result.sort(compositeCompare);
  return result;
}


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
function validateFunction(value, varName) {
  if (typeof value !== 'function') {
    throw new Error('"' + varName + '" must be a function');
  }
}

// Returns undefined or throws an error if invalid
function validateScalarIsDtype(value, dtype) {
  var inferredDtype = inferDtype(value);
  if (inferredDtype !== null && inferredDtype !== dtype) {
    throw new Error('expected scalar to match dtype "' + dtype +
      '" but instead got ' + value + ', which has dtype "' +
      inferredDtype + '"');
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

// Returns undefined or throws an error if invalid
function validateDataFrameHasNoObjectCols(df) {
  if (df._dtypesVector().contains('object')) {
    throw new Error('unsupported operation over data frame columns ' +
      'with "object" dtype');
  }
}

// Returns undefined or throws an error if invalid
function validateOptsProperties(opts, validProperties) {
  var validProps = ensureVector(validProperties);
  var allOpts = jd.vector(Object.keys(opts), 'string');
  var invalidOpts = allOpts.s(allOpts.isIn(validProps).not());
  if (invalidOpts.size() > 0) {
    throw new Error('invalid properties found in "opts": ' +
      invalidOpts.strJoin(', '));
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
  if (isUndefined(value) || value === null) {
    return value;
  }
  var length = 1;
  var description = 'a scalar';
  if (value.type === vectorProto.type) {
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
  if (isMissing(values) || values.type !== vectorProto.type) {
    values = Array.isArray(values) ?
      inferVectorDtype(values.slice(), defaultDtype) :
      inferVectorDtype([values], defaultDtype);
  }
  return values;
}
jd._private_export.ensureVector = ensureVector;

// Like 'ensureVector', but converts the result to 'string' dtype if necessary
function ensureStringVector(values) {
  values = ensureVector(values, 'string');
  return (values.dtype !== 'string') ?
    values.toDtype('string') :
    values;
}


/*-----------------------------------------------------------------------------
* Utilities
*/

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


}));
