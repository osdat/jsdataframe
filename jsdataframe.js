
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

  var jsdataframe = exports;


  /* ==========================================================================
   * Define prototypes (instead of constructor functions)
   */


  /* ==========================================================================
   * Define private helpers
   */

   function readOnlyEnumProp(value) {
     return {
       enumerable: true,
       configurable: false,
       writable: false,
       value: value
     };
   }

   function isString(obj) {
     return Object.prototype.toString.call(obj) === '[object String]';
   }


}));
