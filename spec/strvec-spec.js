
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('string vector methods:', function() {
  "use strict";

  var strYears = jd.vector(['2000', '2001', '2002', null]);

  describe('strVec.nChar', function() {
    it('behaves as expected', function() {
      expect(strYears.nChar().values).toEqual([4, 4, 4, NaN]);
    });
  });

  describe('strVec.charAt', function() {
    it('behaves as expected', function() {
      expect(strYears.charAt(3).values).toEqual(['0', '1', '2', null]);
      expect(strYears.charAt([-1, 1, 3, 5]).values).toEqual(
        ['', '0', '2', null]
      );
      expect(function() {
        strYears.charAt([1, 2]);
      }).toThrowError(/length/);
    });
  });

  describe('strVec.trim', function() {
    it('behaves as expected', function() {
      expect(strYears.trim().values).toEqual(strYears.values);
      expect(jd.vector([' y', 'y  ', '  y ', 'y']).trim().values).toEqual(
        jd.rep('y', 4).values
      );
    });
  });

  describe('strVec.strSlice', function() {
    it('behaves as expected', function() {
      expect(strYears.strSlice(2).values).toEqual(['00', '01', '02', null]);
      expect(strYears.strSlice([0, 1, 2, 3], [3, 3, 4, 4]).values).toEqual(
        ['200', '00', '02', null]
      );
    });
  });

  describe('strVec.substr', function() {
    it('behaves as expected', function() {
      expect(strYears.substr(3, 1).values).toEqual(['0', '1', '2', null]);
      expect(strYears.substr([0, 1, 2, 3], [3, 2, 2, 1]).values).toEqual(
        ['200', '00', '02', null]
      );
    });
  });

  describe('strVec.strIncludes', function() {
    it('behaves as expected', function() {
      expect(strYears.strIncludes('00').values).toEqual(
        [true, true, true, null]
      );
      expect(strYears.strIncludes('00', [2, 2, 1, 1]).values).toEqual(
        [true, false, true, null]
      );
    });
  });

  describe('strVec.startsWith', function() {
    it('behaves as expected', function() {
      expect(strYears.startsWith('20').values).toEqual(
        [true, true, true, null]
      );
      expect(strYears.startsWith('02', jd.seq(4)).values).toEqual(
        [false, false, true, null]
      );
    });
  });

  describe('strVec.endsWith', function() {
    it('behaves as expected', function() {
      expect(strYears.endsWith('00').values).toEqual(
        [true, false, false, null]
      );
      expect(strYears.endsWith(['20', '02', '02', ''], jd.seq(2, 6)).values)
        .toEqual([true, false, true, null]);
    });
  });

  describe('strVec.strIndexOf', function() {
    it('behaves as expected', function() {
      expect(strYears.strIndexOf('000').values).toEqual([1, -1, -1, NaN]);
      expect(strYears.strIndexOf('00', jd.seq(4)).values).toEqual(
        [1, 1, -1, NaN]
      );
    });
  });

  describe('strVec.strLastIndexOf', function() {
    it('behaves as expected', function() {
      expect(strYears.strLastIndexOf('00').values).toEqual([2, 1, 1, NaN]);
    });
  });

  describe('strVec.regexMatch', function() {
    it('behaves as expected', function() {
      expect(strYears.regexMatch(/2(00)[12]/).values).toEqual(
        [null, '2001', '2002', null]
      );

      expect(strYears.regexMatch(/[12]/g).values).toEqual(
        ['2', '2', '2', null]
      );
    });
  });

  describe('strVec.regexSearch', function() {
    it('behaves as expected', function() {
      expect(strYears.regexSearch(/[12]$/).values).toEqual([-1, 3, 3, NaN]);
    });
  });

  describe('strVec.regexTest', function() {
    it('behaves as expected', function() {
      expect(strYears.regexTest(/[12]$/).values).toEqual(
        [false, true, true, null]
      );
    });
  });

  describe('strVec.strReplace', function() {
    it('behaves as expected', function() {
      expect(jd.vector(['This is...', null]).strReplace('is.', 'will.').values)
        .toEqual(['This will...', null]);
      expect(jd.vector(['Jane Doe', 'Richard Roe'])
        .strReplace(/(\w+)\s(\w+)/, '$2, $1').values)
        .toEqual(['Doe, Jane', 'Roe, Richard']);
      expect(jd.vector(['Super Sale!', 'Huge Savings!'])
        .strReplace(/s/gi, ['$$$$$$', '$$']).values)
        .toEqual(['$$$uper $$$ale!', 'Huge $aving$!']);
    });
  });

  describe('strVec.toLowerCase', function() {
    it('behaves as expected', function() {
      expect(jd.vector(['test1', 'Test1', 'TEST2', null]).toLowerCase().values)
        .toEqual(['test1', 'test1', 'test2', null]);
    });
  });

  describe('strVec.toUpperCase', function() {
    it('behaves as expected', function() {
      expect(jd.vector(['test1', 'Test1', 'TEST2', null]).toUpperCase().values)
        .toEqual(['TEST1', 'TEST1', 'TEST2', null]);
    });
  });
});
