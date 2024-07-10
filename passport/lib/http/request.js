var req = exports = module.exports = {};

/**
 * logIn和logOut方法是用于处理用户登录和登出的，他们的主要作用是管理用户的会话
 * 状态
 */

/**
 * Initiate a login session for `user`.
 * 为用户初始化登录会话
 *
 * Options:
 *   - `session`  Save login state in session, defaults to _true_
 *  是否保存会话中的登录状态，默认为true
 * 
 * Examples:
 *
 *     req.logIn(user, { session: false });
 *
 *     req.logIn(user, function(err) {
 *       if (err) { throw err; }
 *       // session saved
 *     });
 *
 * @param {User} user
 * @param {Object} options
 * @param {Function} done
 * @api public
 * 
 * 1、登录用户，将用户对象存储在请求对象和会话中
 * 2、触发会话管理，调用会话管理器的登录逻辑，将用户
 * 信息序列化并存储在会话中。
 * 3、支持回调，支持异步操作，通过回调函数处理登录结果
 */
req.login =
req.logIn = function(user, options, done) {
  /**如果options是函数，则作为done函数使用 */
  if (typeof options == 'function') {
    done = options;
    options = {};
  }
  /**初始化配置选项对象 */
  options = options || {};
  /**
   * 获取用户属性名称，默认为user。如果在请求对象上设置了
   * _userProperty，则使用该属性。
   */
  var property = this._userProperty || 'user';
  /**没配置session默认为true */
  var session = (options.session === undefined) ? true : options.session;
  /**将用户对象user设置到请求对象的用户属性上 */
  this[property] = user;
  /**如果启用了会话并且存在会话管理器_sessionManager */
  if (session && this._sessionManager) {
    if (typeof done != 'function') { throw new Error('req#login requires a callback function'); }
    /**self在这指请求对象request */
    var self = this;
    /**调用会话管理器的logIn方法，将用户信息存储在会话中 */
    this._sessionManager.logIn(this, user, options, function(err) {
      /**在回调函数中处理错误，如果发生错误则清除用户属性 */
      if (err) { self[property] = null; return done(err); }
      /**调用done，表示登录完成 */
      done();
    });
  } else {
    /**如果未启用会话或不存在会话管理器，直接调用done回调函数 */
    done && done();
  }
};

/**
 * Terminate an existing login session.
 *
 * @api public
 */
req.logout =
req.logOut = function(options, done) {
  /**如果options是一个函数，则将其视为回调函数done，并将options设置为空对象 */
  if (typeof options == 'function') {
    done = options;
    options = {};
  }
  options = options || {};
  /**
   * 获取用户属性名称，默认为user，如果在请求对象上设置了_userProperty
   * 则使用该属性。
   */
  var property = this._userProperty || 'user';
  /**将请求对象的用户属性设置为null */
  this[property] = null;
  /**如果存在会话管理器 _sessionManager*/
  if (this._sessionManager) {
    if (typeof done != 'function') { throw new Error('req#logout requires a callback function'); }
    /**调用会话管理器，logOut方法，清除会话中的用户信息， */
    this._sessionManager.logOut(this, options, done);
  } else {
    /**如果不存在会话管理器，直接调用done回调函数（如果存在） */
    done && done();
  }
};

/**
 * Test if request is authenticated.
 *
 * @return {Boolean}
 * @api public
 * 检查当前请求是否经过身份验证，它通过检查请求对象上是否存在用户属性来确定
 * 用户是否已经登陆
 * 
 * 通过isAuthenticated方法，可以简化在路由或中间件中检查用户登录状态的逻辑
 * 
 * // 保护路由中间件
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
 */
req.isAuthenticated = function() {
  var property = this._userProperty || 'user';
  return (this[property]) ? true : false;
};

/**
 * Test if request is unauthenticated.
 *
 * @return {Boolean}
 * @api public
 */
req.isUnauthenticated = function() {
  return !this.isAuthenticated();
};
