// Module dependencies.
var util = require('util')
  , Strategy = require('passport-strategy');


/**
 *  Create a new `SessionStrategy` object.
 * 创建
 *
 * An instance of this strategy is automatically used when creating an
 * `{@link Authenticator}`.  As such, it is typically unnecessary to create an
 * instance using this constructor.
 * 
 * 当创建Authenticator时会自动创建一个SessionStrategy的实例，
 * 所以通常不用再次使用SessionStrategy再创建一次
 *
 * @classdesc This `Strategy` authenticates HTTP requests based on the contents
 * of session data.
 *
 * 这个策略是基于Session会话数据来认证HTTP请求
 * The login session must have been previously initiated, typically upon the
 * user interactively logging in using a HTML form.  During session initiation,
 * the logged-in user's information is persisted to the session so that it can
 * be restored on subsequent requests.
 * 
 * 登录会话必须提前被初始化，通常是在用户使用HTML表单交互登录时，在会话初始化期间，
 * 登录用户的信息被持久化到会话中，以便在后续请求时可以重新使用。
 *
 * Note that this strategy merely restores the authentication state from the
 * session, it does not authenticate the session itself.  Authenticating the
 * underlying session is assumed to have been done by the middleware
 * implementing session support.  This is typically accomplished by setting a
 * signed cookie, and verifying the signature of that cookie on incoming
 * requests.
 * 注意，这个策略仅从会话中恢复身份验证状态，而不会对会话本身进行身份验证。
 * 因为到这里我们假定身份验证已经被实现会话支持的中间件（express-session）完成。
 * 这个通常是通过在cookie中设置签名，并且在传入的请求中验证该请求携带的cookie的签名来实现。
 *
 * In {@link https://expressjs.com/ Express}-based apps, session support is
 * commonly provided by {@link https://github.com/expressjs/session `express-session`}
 * or {@link https://github.com/expressjs/cookie-session `cookie-session`}.
 *
 * @public
 * @class
 * @augments base.Strategy
 * @param {Object} [options]
 * 用户配置会话键
 * @param {string} [options.key='passport'] - Determines what property ("key") on
 *          the session data where login session data is located.  The login
 *          session is stored and read from `req.session[key]`.
 * 反序列化用户的函数，用于从会话数据中恢复用户信息
 * @param {function} deserializeUser - Function which deserializes user.
 */
function SessionStrategy(options, deserializeUser) {
  /**当options是函数时，将它当做deserializeUser 反序列化函数 */
  if (typeof options == 'function') {
    deserializeUser = options;
    options = undefined;
  }
  options = options || {};
  
  Strategy.call(this);
  
  /** The name of the strategy, set to `'session'`.
   *
   * @type {string}
   * @readonly
   */
  this.name = 'session';
  /**指定存储用户数据的session对象属性 */
  this._key = options.key || 'passport';
  this._deserializeUser = deserializeUser;
}

// Inherit from `passport.Strategy`.
/**使得SessionStrategy继承Strategy，实际上Strategy是一个策略实现规范，相当于是一个抽象类 */
util.inherits(SessionStrategy, Strategy);

/**
 * 
 * Authenticate request based on current session data.
 *
 * When login session data is present in the session, that data will be used to
 * restore login state across requests by calling the deserialize user
 * function.
 * 
 * 当登录会话数据在会话对象中存在，那么这个数据会被用于通过调用序列化函数来恢复登录状态
 *
 * If login session data is not present, the request will be passed to the next
 * middleware, rather than failing authentication - which is the behavior of
 * most other strategies.  This deviation allows session authentication to be
 * performed at the application-level, rather than the individual route level,
 * while allowing both authenticated and unauthenticated requests and rendering
 * responses accordingly.  Routes that require authentication will need to guard
 * that condition.
 * 
 * 如果登录会话数据不存在，这个请求将会交给下一个中间件处理，而不是抛出一个校验错误，大部分其他策略也都是这么处理的。
 * 
 *
 * This function is protected, and should not be called directly.  Instead,
 * use `passport.authenticate()` middleware and specify the {@link SessionStrategy#name `name`}
 * of this strategy and any options.
 *
 * @protected
 * @param {http.IncomingMessage} req - The Node.js {@link https://nodejs.org/api/http.html#class-httpincomingmessage `IncomingMessage`}
 *          object.
 * @param {Object} [options]
 * @param {boolean} [options.pauseStream=false] - When `true`, data events on
 *          the request will be paused, and then resumed after the asynchronous
 *          `deserializeUser` function has completed.  This is only necessary in
 *          cases where later middleware in the stack are listening for events,
 *          and ensures that those events are not missed.
 *
 * @example
 * passport.authenticate('session');
 */
SessionStrategy.prototype.authenticate = function(req, options) {
  /**检查请求对象req是否包含会话。如果没有包含会话，返回错误，提示需要会话支持，前提要用express-session开启会话 */
  if (!req.session) { return this.error(new Error('Login sessions require session support. Did you forget to use `express-session` middleware?')); }
  /**初始化选项对象 */
  options = options || {};

  var self = this, 
      su;
  /**从会话中获取用于信息，并赋值给su。会话数据存储在req.session[this._key]中，
   * 默认键为“passport”
   */
  if (req.session[this._key]) {
    su = req.session[this._key].user;
  }

  /**如果su存在或者为0 */
  if (su || su === 0) {
    // NOTE: Stream pausing is desirable in the case where later middleware is
    //       listening for events emitted from request.  For discussion on the
    //       matter, refer to: https://github.com/jaredhanson/passport/pull/106
    /**如果options.pauseStream为true，则暂停请求流，以防止在反序列化
     * 期间丢失数据事件
     */
    var paused = options.pauseStream ? pause(req) : null;
    /**调用this._deserializeUser方法，将会话中的用户信息su反序列化为用户对象user */
    this._deserializeUser(su, req, function(err, user) {
      if (err) { return self.error(err); }
      if (!user) {
        /** */
        delete req.session[self._key].user;
      } else {
        var property = req._userProperty || 'user';
        req[property] = user;
      }
      self.pass();
      if (paused) {
        paused.resume();
      }
    });
  } else {
    self.pass();
  }
};


function pause (stream) {
  var events = []
  var onData = createEventListener('data', events)
  var onEnd = createEventListener('end', events)

  // buffer data
  stream.on('data', onData)

  // buffer end
  stream.on('end', onEnd)

  return {
    end: function end () {
      stream.removeListener('data', onData)
      stream.removeListener('end', onEnd)
    },
    resume: function resume () {
      this.end()

      for (var i = 0; i < events.length; i++) {
        stream.emit.apply(stream, events[i])
      }
    }
  }
}

function createEventListener (name, events) {
  return function onEvent () {
    var args = new Array(arguments.length + 1)

    args[0] = name
    for (var i = 0; i < arguments.length; i++) {
      args[i + 1] = arguments[i]
    }

    events.push(args)
  }
}

// Export `SessionStrategy`.
module.exports = SessionStrategy;
