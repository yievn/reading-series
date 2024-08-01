// Module dependencies.
var SessionStrategy = require("./strategies/session"),
  SessionManager = require("./sessionmanager");

/**
 * Create a new `Authenticator` object.
 *
 * @public
 * @class
 */
function Authenticator() {
  /**用于存储会话数据的键 */
  this._key = "passport";
  /**存储注册的认证策略的对象，键为策略名称，值为策略实例 */
  this._strategies = {};
  /**存储序列化用户的函数数组 */
  this._serializers = [];
  /**存储反序列化用户的函数数组 */
  this._deserializers = [];
  /**存储认证信息转换函数的数组 */
  this._infoTransformers = [];
  /**存储框架适配器，默认为null */
  this._framework = null;

  this.init();
}

/**
 * Initialize authenticator.
 * 初始化认证器
 * Initializes the `Authenticator` instance by creating the default `{@link SessionManager}`,
 * {@link Authenticator#use `use()`}'ing the default `{@link SessionStrategy}`, and
 * adapting it to work as {@link https://github.com/senchalabs/connect#readme Connect}-style
 * middleware, which is also compatible with {@link https://expressjs.com/ Express}.
 *
 * @private
 */
Authenticator.prototype.init = function () {
  /**初始化框架函数，引入两个中间件模块 */
  this.framework(require("./framework/connect")());
  /**默认注册session会话策略 */
  this.use(
    new SessionStrategy({ key: this._key }, this.deserializeUser.bind(this))
  );
  /**创建一个会话管理器 */
  this._sm = new SessionManager(
    { key: this._key },
    this.serializeUser.bind(this)
  );
};

/**
 * Register a strategy for later use when authenticating requests.  The name
 * with which the strategy is registered is passed to {@link Authenticator#authenticate `authenticate()`}.
 *注册用于认证请求的策略
 * @public
 * @param {string} [name=strategy.name] - Name of the strategy.  When specified,
 *          this value overrides the strategy's name.
 * @param {Strategy} strategy - Authentication strategy.
 * @returns {this}
 *
 * @example <caption>Register strategy.</caption>
 * passport.use(new GoogleStrategy(...));
 *
 * @example <caption>Register strategy and override name.</caption>
 * passport.use('password', new LocalStrategy(function(username, password, cb) {
 *   // ...
 * }));
 */
Authenticator.prototype.use = function (name, strategy) {
  /**如果strategy不存在，说明没有传入name */
  if (!strategy) {
    strategy = name;
    name = strategy.name;
  }
  if (!name) {
    throw new Error("Authentication strategies must have a name");
  }
  /**保存策略 */
  this._strategies[name] = strategy;
  return this;
};

/**
 * Deregister a strategy that was previously registered with the given name.
 * 注销策略
 *
 * In a typical application, the necessary authentication strategies are
 * registered when initializing the app and, once registered, are always
 * available.  As such, it is typically not necessary to call this function.
 * 在一个典型的应用中，必要的验证都会在初始化APP时候被注册，一旦策略被注册，那么一直都可以使用，
 * 所以 ，一般情况下，unuse不会被调用，
 * @public
 * @param {string} name - Name of the strategy.
 * @returns {this}
 *
 * @example
 * passport.unuse('acme');
 */
Authenticator.prototype.unuse = function (name) {
  delete this._strategies[name];
  return this;
};

/**
 * Adapt this `Authenticator` to work with a specific framework.
 *
 * By default, Passport works as {@link https://github.com/senchalabs/connect#readme Connect}-style
 * middleware, which makes it compatible with {@link https://expressjs.com/ Express}.
 * For any app built using Express, there is no need to call this function.
 *
 * @public
 * @param {Object} fw
 * @returns {this}
 */
Authenticator.prototype.framework = function (fw) {
  /** 两中间件
   * {
      // 用于初始化Passport
      initialize: initialize,
      // 用于处理身份shn'f
      authenticate: authenticate
    }
   */
  this._framework = fw;
  return this;
};

/**
 * Create initialization middleware.
 *
 * Returns middleware that initializes Passport to authenticate requests.
 *
 * As of v0.6.x, it is typically no longer necessary to use this middleware.  It
 * exists for compatiblity with apps built using previous versions of Passport,
 * in which this middleware was necessary.
 *
 * The primary exception to the above guidance is when using strategies that
 * depend directly on `passport@0.4.x` or earlier.  These earlier versions of
 * Passport monkeypatch Node.js `http.IncomingMessage` in a way that expects
 * certain Passport-specific properties to be available.  This middleware
 * provides a compatibility layer for this situation.
 *
 *
 * 创建初始化中间件。
 *
 * 返回初始化 Passport 以验证请求的中间件。
 *
 * 从 v0.6.x 开始，通常不再需要使用此中间件。它
 * 存在是为了与使用以前版本的 Passport 构建的应用程序兼容，
 * 在这些应用程序中，此中间件是必需的。
 *
 * 上述指导的主要例外是使用直接依赖于 `passport@0.4.x` 或更早版本的策略。这些早期版本的
 * Passport monkeypatch Node.js `http.IncomingMessage` 以期望
 * 某些特定于 Passport 的属性可用的方式。此中间件
 * 为这种情况提供了一个兼容层。
 *
 * @public
 * @param {Object} [options]
 * @param {string} [options.userProperty='user'] - Determines what property on
 *          `req` will be set to the authenticated user object.
 * 指定一个request属性，它用于存储已经验证后的用户信息对象
 * @param {boolean} [options.compat=true] - When `true`, enables a compatibility
 *          layer for packages that depend on `passport@0.4.x` or earlier.
 * 当设为true时，为依赖于passport@0.4.x或更早的版本启用兼容模式
 * @returns {function}
 *
 * @example
 * app.use(passport.initialize());
 */
Authenticator.prototype.initialize = function (options) {
  options = options || {};
  return this._framework.initialize(this, options);
};

/**
 * Create authentication middleware.
 *
 * Returns middleware that authenticates the request by applying the given
 * strategy (or strategies).
 *
 * Examples:
 *
 *     passport.authenticate('local', function(err, user) {
 *       if (!user) { return res.redirect('/login'); }
 *       res.end('Authenticated!');
 *     })(req, res);
 *
 * @public
 * @param {string|string[]|Strategy} strategy 策略名，或策略实例对象
 * @param {Object} [options]
 * @param {boolean} [options.session=true] 是否将登陆状态保存在session对象
 * @param {boolean} [options.keepSessionInfo=false]
 * @param {string} [options.failureRedirect] 登录失败后要重定向的url
 * @param {boolean|string|Object} [options.failureFlash=false]
 * @param {boolean|string} [options.failureMessage=false]
 * @param {boolean|string|Object} [options.successFlash=false]
 * @param {string} [options.successReturnToOrRedirect]
 * @param {string} [options.successRedirect]
 * @param {boolean|string} [options.successMessage=false]
 * @param {boolean} [options.failWithError=false]
 * @param {string} [options.assignProperty]
 * @param {boolean} [options.authInfo=true]
 * @param {function} [callback]
 * @returns {function}
 *
 * @example <caption>Authenticate username and password submitted via HTML form.</caption>
 * app.get('/login/password', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));
 *
 * @example <caption>Authenticate bearer token used to access an API resource.</caption>
 * app.get('/api/resource', passport.authenticate('bearer', { session: false }));
 */
Authenticator.prototype.authenticate = function (strategy, options, callback) {
  return this._framework.authenticate(this, strategy, options, callback);
};

/**
 * Create third-party service authorization middleware.
 *
 * Returns middleware that will authorize a connection to a third-party service.
 *
 * This middleware is identical to using {@link Authenticator#authenticate `authenticate()`}
 * middleware with the `assignProperty` option set to `'account'`.  This is
 * useful when a user is already authenticated (for example, using a username
 * and password) and they want to connect their account with a third-party
 * service.
 *
 * In this scenario, the user's third-party account will be set at
 * `req.account`, and the existing `req.user` and login session data will be
 * be left unmodified.  A route handler can then link the third-party account to
 * the existing local account.
 *
 * All arguments to this function behave identically to those accepted by
 * `{@link Authenticator#authenticate}`.
 *
 * @public
 * @param {string|string[]|Strategy} strategy
 * @param {Object} [options]
 * @param {function} [callback]
 * @returns {function}
 *
 * @example
 * app.get('/oauth/callback/twitter', passport.authorize('twitter'));
 */
Authenticator.prototype.authorize = function (strategy, options, callback) {
  options = options || {};
  options.assignProperty = "account";

  var fn = this._framework.authorize || this._framework.authenticate;
  return fn(this, strategy, options, callback);
};

/**
 * 中间件将会从一个Session对象中还原出登录状态
 * web应用通常使用Session去维持请求间的登录状态。例如，
 * 用户将通过在提交给服务器的表单中输入凭据来进行身份验证。
 * 如果凭证有效，则通过在用户的 Web 浏览器中设置包含会
 * 话标识符的 cookie 来建立登录会话。Web 浏览器
 * 将在后续请求中向服务器发送此 cookie，从而维持会话
 *
 * 如果正在使用会话，并且已建立登录会话，则此中间件将使用当前用户填充“req.user”。
 *
 * 请注意，Passport 的运行并不严格要求会话。但是，
 * 一般来说，大多数 Web 应用程序都会使用会话。
 * 此规则的一个例外是 API 服务器，它要求每个 HTTP请求在授权标头中提供凭据。
 *
 * Examples:
 *
 *     app.use(connect.cookieParser());
 *     app.use(connect.session({ secret: 'keyboard cat' }));
 *     app.use(passport.initialize());
 *     app.use(passport.session());
 *
 * Options:
 *   - `pauseStream`      Pause the request stream before deserializing the user
 *                        object from the session.  Defaults to _false_.  Should
 *                        be set to true in cases where middleware consuming the
 *                        request body is configured after passport and the
 *                        deserializeUser method is asynchronous.
 * 在从Session对象中反序列化用户对象之前暂停请求流
 * 默认为 _false_。如果在Passport之后配置使用请求主体的中间件并且 deserializeUser 方法是异步的，则应设置为 true。
 *
 * @param {Object} options
 * @return {Function} middleware
 * @api public
 */
Authenticator.prototype.session = function (options) {
  return this.authenticate("session", options);
};

// TODO: Make session manager pluggable
/*
Authenticator.prototype.sessionManager = function(mgr) {
  this._sm = mgr;
  return this;
}
*/

/**
 * Registers a function used to serialize user objects into the session.
 * 注册一个用于将用户对象序列化到会话中的函数。
 * Examples:
 *
 *     passport.serializeUser(function(user, done) {
 *       done(null, user.id);
 *     });
 *
 * @api public
 *
 * 序列化：序列化是将对象转换为一种可以存储或传输的格式的过程，在Web应用中，通常是将用户对象
 * 转换为一个简单的标识符（如用户ID），以便存储在会话中。
 *
 * 目的： 减少会话存储的大小，提升性能，会话存储通常是有限的，因此只存储必要的信息（如用户ID）而不是
 * 整个用户对象
 *
 * 示例: 将用户对象 { id: 123, name: 'John Doe', email: 'john@example.com' } 序列化为用户 ID 123。
 */
Authenticator.prototype.serializeUser = function (fn, req, done) {
  /**如果fn是一个函数，怎添加到_serializers数组中，这里用于注册序列化用户的函数 */
  if (typeof fn === "function") {
    return this._serializers.push(fn);
  }

  // private implementation that traverses the chain of serializers, attempting
  // to serialize a user
  /**到这里，说明fn不是一个函数，那么将其视为用户对象user */
  var user = fn;

  // For backwards compatibility
  /**如果req是一个函数，则将其视为回调函数done，并将req设置为undefined */
  if (typeof req === "function") {
    done = req;
    req = undefined;
  }
  /**将序列化函数数组作为栈 */
  var stack = this._serializers;
  /**
   * pass函数是一个递归函数，用于遍历_serializers数组中的序列化函数
   *
   * 为什么要用递归的形式调用_serializers中的序列化函数，而不用循环调用实现？
   *
   * 1、在序列化用户时，序列化函数可能是异步的，需要等待异步操作完成后才能继续处理下一个序列化函数，递归
   * 函数可以在异步操作完成后自然地调用自身，继续处理下一个序列化函数。
   *
   * 2、递归函数可以在任意层级捕获错误，并将错误传递给最终的回调函数，这样可以确保一旦发生错误，整个序列化立即停止
   */
  (function pass(i, err, obj) {
    /**
     * 如果序列化函数返回'pass'作为错误，这表示当前序列化函数选择跳过处理，
     * 将err设置为undefined，以便继续处理下一个序列化函数。
     * 
     假设我们有多个序列化函数，每个函数处理不同类型的用户对象。
     某些序列化函数可能不适用于特定的用户对象，因此他们可以返回’pass‘
     来显示地跳过处理
     */
    if ("pass" === err) {
      err = undefined;
    }
    // 发生错误或者获取到序列化结果，则调用done回调函数，结束递归
    if (err || obj || obj === 0) {
      return done(err, obj);
    }
    /**
     * 获取当前索引i对应的序列化函数layer，如果当前序列化函数不存在，则返回错误，表示序列化失败
     */
    var layer = stack[i];
    if (!layer) {
      return done(new Error("Failed to serialize user into session"));
    }

    /**
     *  serialized是一个回调函数，用于处理序列化函数的结果
     * @param {*} e 序列化过程中产生的错误
     * @param {*} o 序列化后的对象
     *
     */
    function serialized(e, o) {
      /**调用pass函数，处理下一个序列化函数 */
      pass(i + 1, e, o);
    }

    try {
      /**获取当前序列化函数的参数长度 */
      var arity = layer.length;
      /**如果参数长度为3，则调用layer(req, user, serialized) */
      if (arity == 3) {
        layer(req, user, serialized);
      } else {
        /**否则，调用 layer(user, serialized)*/
        layer(user, serialized);
      }
    } catch (e) {
      /**如果序列化函数抛出异常，则调用done回调函数，结束递归 */
      return done(e);
    }
  })(0);
};

/**
 * Registers a function used to deserialize user objects out of the session.
 * 注册一个用于从会话中反序列化用户对象的函数。
 * Examples:
 *
 *     passport.deserializeUser(function(id, done) {
 *       User.findById(id, function (err, user) {
 *         done(err, user);
 *       });
 *     });
 *
 * @api public
 *
 * 反序列化：反序列化是将存储或传输的格式转换回对象的过程。在Web应用中，通常是从会话中读取用户ID，并根虎
 * 该ID从数据库中加载完整的用户对象。
 *
 * 目的：恢复用户的完整信息，以便在请求处理过程中使用
 *
 * 示例: 从用户 ID 123 反序列化为用户对象 { id: 123, name: 'John Doe', email: 'john@example.com' }。
 */
Authenticator.prototype.deserializeUser = function (fn, req, done) {
  if (typeof fn === "function") {
    return this._deserializers.push(fn);
  }

  // private implementation that traverses the chain of deserializers,
  // attempting to deserialize a user
  var obj = fn;

  // For backwards compatibility
  if (typeof req === "function") {
    done = req;
    req = undefined;
  }

  var stack = this._deserializers;
  (function pass(i, err, user) {
    // deserializers use 'pass' as an error to skip processing
    if ("pass" === err) {
      err = undefined;
    }
    // an error or deserialized user was obtained, done
    if (err || user) {
      return done(err, user);
    }
    // 建立会话时存在一个有效用户，但该用户已被删除
    if (user === null || user === false) {
      return done(null, false);
    }

    var layer = stack[i];
    if (!layer) {
      return done(new Error("Failed to deserialize user out of session"));
    }

    function deserialized(e, u) {
      pass(i + 1, e, u);
    }

    try {
      var arity = layer.length;
      if (arity == 3) {
        layer(req, obj, deserialized);
      } else {
        layer(obj, deserialized);
      }
    } catch (e) {
      return done(e);
    }
  })(0);
};

/**
 * 注册一个用于转换认证信息的函数。
 *
 * 在某些情况下，授权详情包含在认证凭证中或作为验证的一部分加载。
 *
 * 例如，当使用Bearer令牌进行API认证时，这些令牌可能会直接或间接地在数据库中编码访问范围或令牌发放给哪个客户端等详细信息。
 *
 * 这些授权详情应当与认证分开执行。因为Passport只处理后者，这属于中间件或链条后续路由的责任。然而，之后再去解码相同的数据或执行相同的数据库查询并不理想。为避免这种情况，Passport在一个策略的`success()`操作中接受与认证的`user`一起的可选`info`。这个信息被设置在`req.authInfo`，以便之后的中间件或路由可以访问它。
 *
 * 可选地，应用程序可以注册转换函数来处理这些信息，这些转换在`req.authInfo`设置之前生效。例如，当信息包含客户端ID时，转换可以从数据库加载客户端并将实例包含在转换后的信息中，从而方便地访问完整的客户端属性集。
 *
 * 如果没有注册转换函数，策略提供的`info`将保持不变。
 *
 * Examples:
 *
 *     passport.transformAuthInfo(function(info, done) {
 *       Client.findById(info.clientID, function (err, client) {
 *         info.client = client;
 *         done(err, info);
 *       });
 *     });
 *
 * @api public
 */
Authenticator.prototype.transformAuthInfo = function (fn, req, done) {
  if (typeof fn === "function") {
    return this._infoTransformers.push(fn);
  }

  // private implementation that traverses the chain of transformers,
  // attempting to transform auth info
  var info = fn;

  // For backwards compatibility
  if (typeof req === "function") {
    done = req;
    req = undefined;
  }

  var stack = this._infoTransformers;
  (function pass(i, err, tinfo) {
    // transformers use 'pass' as an error to skip processing
    if ("pass" === err) {
      err = undefined;
    }
    // an error or transformed info was obtained, done
    if (err || tinfo) {
      return done(err, tinfo);
    }

    var layer = stack[i];
    if (!layer) {
      // if no transformers are registered (or they all pass), the default
      // behavior is to use the un-transformed info as-is
      return done(null, info);
    }

    function transformed(e, t) {
      pass(i + 1, e, t);
    }

    try {
      var arity = layer.length;
      if (arity == 1) {
        // sync
        var t = layer(info);
        transformed(null, t);
      } else if (arity == 3) {
        layer(req, info, transformed);
      } else {
        layer(info, transformed);
      }
    } catch (e) {
      return done(e);
    }
  })(0);
};

/**
 * Return strategy with given `name`.
 *
 * @param {String} name
 * @return {Strategy}
 * @api private
 */
Authenticator.prototype._strategy = function (name) {
  return this._strategies[name];
};

/**
 * Expose `Authenticator`.
 */
module.exports = Authenticator;

/**
 * 为什么需要序列化和反序列化
在 Web 应用中，用户登录后，服务器需要在后续的请求中识别用户的身份。为了实现这一点，服务器通常会使用会话（Session）来存储用户的登录状态。会话可以存储在服务器内存、数据库或客户端的 Cookie 中。
序列化: 在用户登录时，将用户对象序列化为一个简单的标识符（如用户 ID），并存储在会话中。
反序列化: 在后续请求中，从会话中读取用户 ID，并根据该 ID 从数据库中加载完整的用户对象。

会话（Session）
定义: 会话是服务器在一段时间内与客户端的交互状态。会话用于在多个请求之间保持用户的登录状态。
存储: 会话数据可以存储在服务器内存、数据库或客户端的 Cookie 中。
作用: 会话用于在多个请求之间保持用户的登录状态，使得用户不需要在每次请求时都重新登录。
 */
