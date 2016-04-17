
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('supporting types:', function() {
  "use strict";

  describe('range:', function() {
    it('is constructed via jd.r()', function() {
      var range1 = jd.r(5, 10);
      expect(range1.type).toBe('jsdataframe.Range');
      expect(range1._start).toBe(5);
      expect(range1._stop).toBe(10);
      expect(range1._includeStop).toBe(null);

      var range2 = jd.r('a', undefined, true);
      expect(range2._start).toBe('a');
      expect(range2._stop).toBe(undefined);
      expect(range2._includeStop).toBe(true);

      var range3 = jd.r(1, -1, false);
      expect(range3._start).toBe(1);
      expect(range3._stop).toBe(-1);
      expect(range3._includeStop).toBe(false);

      expect(function() {
        jd.r(1, 2, 'invalid');
      }).toThrowError(/includeStop/);
    });

    it('responds to range.ex()', function() {
      var range = jd.r(10, undefined);
      var exclusion = range.ex();
      expect(exclusion.type).toBe('jsdataframe.Exclusion');
    });
  });

  describe('range concatenation:', function() {
    var rangeCat = jd.rCat([0, 2], jd.r(5, 8), -1);

    it('is constructed via jd.rCat()', function() {
      expect(rangeCat.type).toBe('jsdataframe.RangeCat');
    });

    it('responds to rangeCat.ex()', function() {
      var exclusion = rangeCat.ex();
      expect(exclusion.type).toBe('jsdataframe.Exclusion');
    });

    it('cannot contain any exclusions', function() {
      expect(function() {
        jd.rCat([0, 2], jd.r(5, 8).ex(), -1);
      }).toThrowError(/exclusion/);
    });
  });

  describe('exclusion:', function() {
    it('can be constructed via jd.ex()', function() {
      var exclusion = jd.ex('unwanted_column');
      expect(exclusion.type).toBe('jsdataframe.Exclusion');
      expect(exclusion._selector).toBe('unwanted_column');

      expect(function() {
        jd.ex();
      }).toThrowError(/selector/);
    });

    it('can also be constructed via vector.ex()', function() {
      var exclusion = jd.seq(5).ex();
      expect(exclusion.type).toBe('jsdataframe.Exclusion');
    });
  });

});
