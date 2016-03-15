
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('private implementation tests:', function() {
  "use strict";

  describe('combineArrays function', function() {
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

});
