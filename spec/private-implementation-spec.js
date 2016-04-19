
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('private implementation tests:', function() {
  "use strict";

  describe('mapNonNa', function() {
    var mapNonNa = jd._private_export.mapNonNa;

    it('behaves as expected', function() {
      var func = function(x) { return x === 1; };
      expect(mapNonNa([NaN, 0, NaN, 1], null, func)).toEqual(
        [null, false, null, true]
      );
      expect(mapNonNa([], null, func)).toEqual([]);
    });
  });

  describe('reduceNonNa', function() {
    var reduceNonNa = jd._private_export.reduceNonNa;
    var add = function(acc, val) { return acc + val; };

    it('skips missing values', function() {
      expect(reduceNonNa([1, 2, 3], 0, add)).toBe(6);
      expect(reduceNonNa([NaN, 1, 2, NaN, 3, NaN], 0, add)).toBe(6);
    });

    it('returns "initValue" when there are no non-missing values', function() {
      expect(reduceNonNa([], 42, add)).toBe(42);
      expect(reduceNonNa([NaN, NaN], 42, add)).toBe(42);
    });
  });

  describe('reduceUnless', function() {
    var reduceUnless = jd._private_export.reduceUnless;
    var add = function(acc, val) { return acc + val; };
    var condFunc = function(x) { return x === 42; };

    it('immediately returns any value meeting "condFunc"', function() {
      expect(reduceUnless([1, 2, 3], 0, condFunc, add)).toBe(6);
      expect(reduceUnless([42, 1, 2, 3], 0, condFunc, add)).toBe(42);
      expect(reduceUnless([1, 2, 42, 3], 0, condFunc, add)).toBe(42);
      expect(reduceUnless([1, 2, 3, 42], 0, condFunc, add)).toBe(42);
    });

    it('returns "initValue" when there are no non-missing values', function() {
      expect(reduceUnless([], -1, condFunc, add)).toBe(-1);
    });
  });

  describe('combineArrays', function() {
    var combineArrays = jd._private_export.combineArrays;

    var func = function(val1, val2) { return val1 === val2; };
    var exampleArray = [1, null, NaN];

    it('behaves as expected for equal length arrays', function() {
      expect(combineArrays(exampleArray, exampleArray, func))
        .toEqual([true, true, false]);
      expect(combineArrays([1], [2], func)).toEqual([false]);
      expect(combineArrays([], [], func)).toEqual([]);
    });

    it('automatically skips missing values when "naValue" is specified',
      function() {
        expect(combineArrays(exampleArray, exampleArray, null, func))
          .toEqual([true, null, null]);
        expect(combineArrays([1, NaN, 3], [1, 2, NaN], undefined, func))
          .toEqual([true, undefined, undefined]);

        expect(combineArrays([1], [NaN], null, func)).toEqual([null]);
        expect(combineArrays([NaN], [1], null, func)).toEqual([null]);
      }
    );

    it('accommodates length 1 arrays by repeating the single value',
      function() {
        expect(combineArrays(exampleArray, [null], func))
          .toEqual([false, true, false]);
        expect(combineArrays([null], exampleArray, func))
          .toEqual([false, true, false]);

        expect(combineArrays(exampleArray, [null], null, func))
          .toEqual([null, null, null]);
        expect(combineArrays([null], exampleArray, null, func))
          .toEqual([null, null, null]);

        expect(combineArrays([], [1], func)).toEqual([]);
        expect(combineArrays([1], [], func)).toEqual([]);
      }
    );

    it('throws an error for incompatible array lengths', function() {
      expect(function() {
        combineArrays(exampleArray, [1, 2], func);
      }).toThrowError(/length/);

      expect(function() {
        combineArrays(exampleArray, [1, 2, 3, 4], null, func);
      }).toThrowError(/length/);

      expect(function() {
        combineArrays([], exampleArray, func);
      }).toThrowError(/length/);
    });
  });

  describe('dtype support:', function() {

    describe('inferDtype', function() {
      var inferDtype = jd._private_export.inferDtype;

      it('identifies num, bool, string, dates, and object dtypes', function() {
        expect(inferDtype(-10)).toBe('number');
        expect(inferDtype(1.2)).toBe('number');
        expect(inferDtype(Infinity)).toBe('number');
        expect(inferDtype(true)).toBe('boolean');
        expect(inferDtype(false)).toBe('boolean');
        expect(inferDtype('test')).toBe('string');
        expect(inferDtype('')).toBe('string');
        expect(inferDtype(new Date())).toBe('date');
        expect(inferDtype({})).toBe('object');
        expect(inferDtype([])).toBe('object');
        expect(inferDtype(function() {})).toBe('object');
      });

      it('returns null for inconclusive missing values', function() {
        expect(inferDtype(null)).toBe(null);
        expect(inferDtype(undefined)).toBe(null);
      });

      it('identifies NaN as a number', function() {
        expect(inferDtype(NaN)).toBe('number');
      });
    });

    describe('inferVectorDtype', function() {
      var inferVectorDtype = jd._private_export.inferVectorDtype;

      it('uses the common dtype if all elements are consistent',
        function() {
          var vector = inferVectorDtype([NaN, null, 1], 'date');
          expect(vector.dtype).toEqual('number');
          expect(vector.values).toEqual([NaN, NaN, 1]);

          expect(inferVectorDtype([null, 'x', 'y']).dtype).toBe('string');
        }
      );

      it('uses "object" dtype if there are any inconsistencies',
        function() {
          var vector = inferVectorDtype([NaN, null, 'x'], 'date');
          expect(vector.dtype).toEqual('object');
          expect(vector.values).toEqual([NaN, null, 'x']);
        }
      );

      it('falls back to "defaultDtype" if all elements are inconclusive',
        function() {
          expect(inferVectorDtype([null], 'date').dtype).toBe('date');
          expect(inferVectorDtype([], 'date').dtype).toBe('date');
          expect(inferVectorDtype([null]).dtype).toBe('object');
        }
      );

      it('treats NaN and null values differently (e.g. for "defaultDtype")',
        function() {
          expect(inferVectorDtype([NaN], 'date').dtype).toBe('number');

          var vector = inferVectorDtype([null], 'number');
          expect(vector.dtype).toBe('number');
          expect(vector.values).toEqual([NaN]);
        }
      );
    });

    describe('coerceToNum', function() {
      var coerceToNum = jd._private_export.coerceToNum;

      it('converts its argument to a number, returning NaN if unsuccessful',
        function() {
          expect(coerceToNum(1.2)).toBe(1.2);
          expect(coerceToNum(true)).toBe(1);
          expect(coerceToNum(false)).toBe(0);
          expect(coerceToNum('1.2')).toBe(1.2);
          expect(coerceToNum('not a number')).toEqual(NaN);
          expect(coerceToNum({})).toEqual(NaN);
        }
      );

      it('returns NaN for any missing values', function() {
        expect(coerceToNum(null)).toEqual(NaN);
        expect(coerceToNum(undefined)).toEqual(NaN);
        expect(coerceToNum(NaN)).toEqual(NaN);
      });
    });

    describe('coerceToBool', function() {
      var coerceToBool = jd._private_export.coerceToBool;

      it('converts its argument to a boolean',
        function() {
          expect(coerceToBool(10)).toBe(true);
          expect(coerceToBool(0)).toBe(false);
          expect(coerceToBool(true)).toBe(true);
          expect(coerceToBool(false)).toBe(false);
          expect(coerceToBool('test')).toBe(true);
          expect(coerceToBool('')).toBe(false);
          expect(coerceToBool({})).toBe(true);
        }
      );

      it('returns null for any missing values', function() {
        expect(coerceToBool(null)).toBe(null);
        expect(coerceToBool(undefined)).toBe(null);
        expect(coerceToBool(NaN)).toBe(null);
      });
    });

    describe('coerceToStr', function() {
      var coerceToStr = jd._private_export.coerceToStr;

      it('converts its argument to a string',
        function() {
          expect(coerceToStr(1.2)).toBe('1.2');
          expect(coerceToStr(true)).toBe('true');
          expect(coerceToStr(false)).toBe('false');
          expect(coerceToStr('string')).toBe('string');
        }
      );

      it('returns null for any missing values', function() {
        expect(coerceToStr(null)).toBe(null);
        expect(coerceToStr(undefined)).toBe(null);
        expect(coerceToStr(NaN)).toBe(null);
      });

      it('converts Dates to ISO 8601 strings', function() {
        var date = new Date(Date.UTC(1970, 0, 1));
        expect(coerceToStr(date)).toBe('1970-01-01T00:00:00.000Z');
      });
    });

    describe('coerceToDate', function() {
      var coerceToDate = jd._private_export.coerceToDate;

      it('converts its argument to a Date, returning null if unsuccessful',
        function() {
          expect(coerceToDate(0).getTime()).toBe(0);
          expect(coerceToDate('invalid')).toBe(null);
          expect(coerceToDate('1970-01-01T00:00:00Z').getTime()).toBe(0);
        }
      );

      it('returns null for any missing values', function() {
        expect(coerceToDate(null)).toBe(null);
        expect(coerceToDate(undefined)).toBe(null);
        expect(coerceToDate(NaN)).toBe(null);
      });
    });
  });

  describe('comparison via natural order:', function() {
    var compare = jd._private_export.compare;
    var compareDesc = jd._private_export.reverseComp(compare);

    it('numbers are ordered naturally', function() {
      expect(compare(2, 10)).toBe(-1);
      expect(compare(10, 2)).toBe(1);
      expect(compare(2, 2)).toBe(0);
      expect(compare(NaN, 2)).toBe(-1);
      expect(compare(2, NaN)).toBe(1);
      expect(compare(undefined, 2)).toBe(-1);
      expect(compare(null, 2)).toBe(-1);
    });

    it('reverseComp reverses the compare order', function() {
      expect(compareDesc(2, 10)).toBe(1);
      expect(compareDesc(10, 2)).toBe(-1);
      expect(compareDesc(2, 2)).toBe(0);
      expect(compareDesc(NaN, 2)).toBe(1);
      expect(compareDesc(2, NaN)).toBe(-1);
    });

    it('missing values are ordered as: [undefined, null, NaN]', function() {
      expect(compare(undefined, null)).toBe(-1);
      expect(compare(undefined, NaN)).toBe(-1);
      expect(compare(null, NaN)).toBe(-1);
      expect(compare(undefined, undefined)).toBe(0);
      expect(compare(null, null)).toBe(0);
      expect(compare(NaN, NaN)).toBe(0);
    });

    it('booleans are ordered naturally', function() {
      expect(compare(false, true)).toBe(-1);
      expect(compare(true, false)).toBe(1);
      expect(compare(false, false)).toBe(0);
      expect(compare(null, false)).toBe(-1);
    });

    it('strings are ordered naturally', function() {
      expect(compare('a', 'b')).toBe(-1);
      expect(compare('b', 'a')).toBe(1);
      expect(compare('a', 'a')).toBe(0);
      expect(compare(null, 'a')).toBe(-1);
    });

    it('dates are ordered naturally', function() {
      var earlier = new Date(1970, 0, 1);
      var earlier2 = new Date(1970, 0, 1);
      var later = new Date(2000, 0, 1);
      expect(compare(earlier, later)).toBe(-1);
      expect(compare(later, earlier)).toBe(1);
      expect(compare(earlier, earlier2)).toBe(0);
      expect(compare(null, earlier)).toBe(-1);
    });
  });

  describe('ensureVector', function() {
    var ensureVector = jd._private_export.ensureVector;

    it('returns "values" if it\'s a vector', function() {
      var vector = jd.seq(5);
      expect(ensureVector(vector)).toBe(vector);
    });

    it('converts array values into a vector', function() {
      var vector = ensureVector([0, 1, 2]);
      expect(vector.type).toBe('jsdataframe.Vector');
      expect(vector.dtype).toBe('number');
      expect(vector.values).toEqual([0, 1, 2]);
    });

    it('converts a scalar value as a vector', function() {
      var vector = ensureVector(1);
      expect(vector.type).toBe('jsdataframe.Vector');
      expect(vector.dtype).toBe('number');
      expect(vector.values).toEqual([1]);
    });

    it('infers the dtype correctly using defaultDtype if needed', function() {
      var vector = ensureVector(null);
      expect(vector.type).toBe('jsdataframe.Vector');
      expect(vector.dtype).toBe('object');
      expect(vector.values).toEqual([null]);

      var vector2 = ensureVector([null], 'number');
      expect(vector2.type).toBe('jsdataframe.Vector');
      expect(vector2.dtype).toBe('number');
      expect(vector2.values).toEqual([NaN]);
    });

    it('makes a copy of "values" if it\'s an array', function() {
      var array = [0, 1, 2];
      var vector = ensureVector(array);
      vector.values[0] = -10;

      expect(vector.values).toEqual([-10, 1, 2]);
      expect(array).toEqual([0, 1, 2]);
    });
  });

  describe('printing support', function() {

    describe('toPrintString', function() {
      var toPrintString = jd._private_export.toPrintString;

      it('converts a value to a print-friendly string', function() {
        expect(toPrintString('some string')).toBe('some string');
        expect(toPrintString(undefined)).toBe('undefined');
        expect(toPrintString(null)).toBe('null');
        expect(toPrintString(NaN)).toBe('NaN');
        expect(toPrintString(true)).toBe('true');

        var multiLineString = 'first line\nsecond line\nthird line';
        expect(toPrintString(multiLineString)).toBe('first line...');

        var longString = jd.rep('9', 500).strJoin('');
        var shortened = toPrintString(longString);
        expect(shortened.length).toBe(45);
        expect(shortened).toMatch(/^9+[.]{3}$/);
      });
    });

    describe('fractionDigits', function() {
      var fractionDigits = jd._private_export.fractionDigits;

      it('returns the number of fractional digits in a number', function() {
        expect(fractionDigits(-10)).toBe(0);
        expect(fractionDigits(0)).toBe(0);
        expect(fractionDigits(1.5)).toBe(1);
        expect(fractionDigits(-1000.12345)).toBe(5);
        expect(fractionDigits(NaN)).toBe(0);
      });
    });
  });

});
