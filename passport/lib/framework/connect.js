/**
 * Module dependencies.
 */
var initialize = require('../middleware/initialize')
  , authenticate = require('../middleware/authenticate');
  
/**
 * Framework support for Connect/Express.
 *
 * This module provides support for using Passport with Express.  It exposes
 * middleware that conform to the `fn(req, res, next)` signature.
 * 
 * 提供与Connect/Express框架的集成支持，使得passport可以作为中间件使用，
 * 并且导出initialize和authenticate中间件，方便在Express应用中使用
 *
 * @return {Object}
 * @api protected
 */
exports = module.exports = function() {
  /**引入两个中间件模块 */
  return {
    // 用于初始化Passport
    initialize: initialize,
    // 用于处理身份shn'f
    authenticate: authenticate
  };
};
