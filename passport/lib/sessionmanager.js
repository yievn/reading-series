var merge = require('utils-merge');
/**
 * 它的主要作用是处理用户的登录和登出操作，将用户信息序列化和反序列化到会话中。
 * 通过SessionManager，应用程序可以在多个请求
 * 之间保持用户的身份验证状态。
 */
/**
 * 
 * @param {*} options  { key: 'passport' }
 * @param {*} serializeUser 序列化函数
 */
function SessionManager(options, serializeUser) {
  /**如果options是函数，那么它将作为序列化函数使用 */
  if (typeof options == 'function') {
    serializeUser = options;
    options = undefined;
  }
  options = options || {};
  /**初始化_key，默认为passport */
  this._key = options.key || 'passport';
  /**初始化序列化函数 */
  this._serializeUser = serializeUser;
}
/**将用户数据序列化，并存到session对象中 */
SessionManager.prototype.logIn = function(req, user, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  
  if (!req.session) { return cb(new Error('Login sessions require session support. Did you forget to use `express-session` middleware?')); }
  
  var self = this;
  /**保存当前会话 */
  var prevSession = req.session;
  
  /**
   * 会话再生成（req.session.regenerate）是一个安全措施，
   * 用于防止会话固定攻击。在再生成会话时，
   * 会创建一个新的会话 ID，并丢弃旧的会话数据。
   */
  req.session.regenerate(function(err) {
    if (err) {
      return cb(err);
    }
    
    self._serializeUser(user, req, function(err, obj) {
      if (err) {
        return cb(err);
      }
      if (options.keepSessionInfo) {
        /**通过合并会话数据，可以确保用户的会话数据在再生成过程中不会丢失 */
        merge(req.session, prevSession);
      }
      /**如果session中没有_key对应的值，则赋值空对象 */
      if (!req.session[self._key]) {
        req.session[self._key] = {};
      }
      /**
       * 重新将用户信息保存到session中的_key对象（通常是passport）中的user属性上，通常里面保存一个用户id，
       */
      req.session[self._key].user = obj;
      // save the session before redirection to ensure page
      // load does not happen before session is saved
      /**
       * 在重定向之前保存会话，以确保在保存会话之前不会发生页面加载s
       */
      req.session.save(function(err) {
        if (err) {
          return cb(err);
        }
        cb();
      });
    });
  });
}

SessionManager.prototype.logOut = function(req, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  
  if (!req.session) { return cb(new Error('Login sessions require session support. Did you forget to use `express-session` middleware?')); }
  
  var self = this;
  
  // clear the user from the session object and save.
  // this will ensure that re-using the old session id
  // does not have a logged in user
  /**
   * 从会话对象中清除用户并保存。这将避免重新使用旧的会话ID而导致没有让用户重新登录
   */
  if (req.session[this._key]) {
    delete req.session[this._key].user;
  }
  var prevSession = req.session;
  
  req.session.save(function(err) {
    if (err) {
      return cb(err)
    }
  
    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function(err) {
      if (err) {
        return cb(err);
      }
      if (options.keepSessionInfo) {
        merge(req.session, prevSession);
      }
      cb();
    });
  });
}


module.exports = SessionManager;
