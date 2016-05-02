
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('supporting types:', function() {
  "use strict";

  describe('range:', function() {
    it('is constructed via jd.rng()', function() {
      var range1 = jd.rng(5, 10);
      expect(range1.type).toBe('jsdataframe.Range');
      expect(range1._start).toBe(5);
      expect(range1._stop).toBe(10);
      expect(range1._includeStop).toBe(null);

      var range2 = jd.rng('a', undefined, true);
      expect(range2._start).toBe('a');
      expect(range2._stop).toBe(undefined);
      expect(range2._includeStop).toBe(true);

      var range3 = jd.rng(1, -1, false);
      expect(range3._start).toBe(1);
      expect(range3._stop).toBe(-1);
      expect(range3._includeStop).toBe(false);

      expect(function() {
        jd.rng(1, 2, 'invalid');
      }).toThrowError(/includeStop/);
    });

    it('responds to range.ex()', function() {
      var range = jd.rng(10, undefined);
      var exclusion = range.ex();
      expect(exclusion.type).toBe('jsdataframe.Exclusion');
    });

    it('throws an error if includeStop is undefined when either start or ' +
      'stop is a number and the other is a string',
      function() {
        expect(function() {
          jd.rng(0, 'string');
        }).toThrowError(/includeStop/);

        expect(function() {
          jd.rng('string', -1);
        }).toThrowError(/includeStop/);

        jd.rng(0, 'string', true);
        jd.rng('string', -1, false);
      }
    );
  });

  describe('ByDtype:', function() {
    it('is constructed via jd.byDtype()', function() {
      var byDtype1 = jd.byDtype('string');
      expect(byDtype1.type).toBe('jsdataframe.ByDtype');

      var byDtype2 = jd.byDtype(['object', 'number']);
      expect(byDtype2.type).toBe('jsdataframe.ByDtype');

      var byDtype3 = jd.byDtype(jd.vector(['string', 'number', 'string']));
      expect(byDtype3.type).toBe('jsdataframe.ByDtype');
    });

    it('must be constructed with valid dtype strings', function() {
      expect(function() {
        jd.byDtype([]);
      }).toThrowError(/string/);

      expect(function() {
        jd.byDtype(['object', 1234]);
      }).toThrowError(/string/);

      expect(function() {
        jd.byDtype(['string', 'invalid_dtype']);
      }).toThrowError(/invalid dtype/);

      expect(function() {
        jd.byDtype(['string', null]);
      }).toThrowError(/invalid dtype/);
    });

    it('responds to rangeCat.ex()', function() {
      var exclusion = jd.byDtype('boolean').ex();
      expect(exclusion.type).toBe('jsdataframe.Exclusion');
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
