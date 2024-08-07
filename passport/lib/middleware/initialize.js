/**
 * Module dependencies.
 */
var IncomingMessageExt = require("../http/request");

/**
 * Passport initialization.
 *
 * Intializes Passport for incoming requests, allowing authentication strategies
 * to be applied.
 * 为传入的请求初始化Passport，允许应用身份验证策略
 *
 * If sessions are being utilized, applications must set up Passport with
 * functions to serialize a user into and out of a session.  For example, a
 * common pattern is to serialize just the user ID into the session (due to the
 * fact that it is desirable to store the minimum amount of data in a session).
 * When a subsequent request arrives for the session, the full User object can
 * be loaded from the database by ID.
 * 如果正在使用会话，应用程序必须使用将用户序列化到会话和从会话中退出的功能来设置Passport。
 * 例如，一种常用的方式是将用户id序列化到会话中（因为一般提倡在会话中存储尽可能少的数据），当后续
 * 会话请求到达时，可以通过ID从数据库加载完整的User对象。
 *
 * Note that additional middleware is required to persist login state, so we
 * must use the `connect.session()` middleware _before_ `passport.initialize()`.
 *
 * If sessions are being used, this middleware must be in use by the
 * Connect/Express application for Passport to operate.  If the application is
 * entirely stateless (not using sessions), this middleware is not necessary,
 * but its use will not have any adverse impact.
 *
 * 如果正在使用会话，Connect/Express应用程序必须使用此中间件才能使Passport运行，如果应用程序完全无状态（不适用会话）。
 * 则不需要此中间件，但使用它不会产生任何不利影响，
 *
 * Examples:
 *
 *     app.use(connect.cookieParser());
 *     app.use(connect.session({ secret: 'keyboard cat' }));
 *     app.use(passport.initialize());
 *     app.use(passport.session());
 *
 *     passport.serializeUser(function(user, done) {
 *       done(null, user.id);
 *     });
 *
 *     passport.deserializeUser(function(id, done) {
 *       User.findById(id, function (err, user) {
 *         done(err, user);
 *       });
 *     });
 *
 * @return {Function}
 * @api public
 */
module.exports = function initialize(passport, options) {
  options = options || {};

  return function initialize(req, res, next) {
    req.login = req.logIn = req.logIn || IncomingMessageExt.logIn;
    req.logout = req.logOut = req.logOut || IncomingMessageExt.logOut;
    req.isAuthenticated =
      req.isAuthenticated || IncomingMessageExt.isAuthenticated;
    req.isUnauthenticated =
      req.isUnauthenticated || IncomingMessageExt.isUnauthenticated;

    req._sessionManager = passport._sm;

    if (options.userProperty) {
      req._userProperty = options.userProperty;
    }

    var compat = options.compat === undefined ? true : options.compat;
    if (compat) {
      // `passport@0.5.1` [removed][1] all internal use of `req._passport`.
      // From the standpoint of this package, this should have been a
      // non-breaking change.  However, some strategies (such as `passport-azure-ad`)
      // depend directly on `passport@0.4.x` or earlier.  `require`-ing earlier
      // versions of `passport` has the effect of monkeypatching `http.IncomingMessage`
      // with `logIn`, `logOut`, `isAuthenticated` and `isUnauthenticated`
      // functions that [expect][2] the `req._passport` property to exist.
      // Since pre-existing functions on `req` are given [preference][3], this
      // results in [issues][4].
      //
      // The changes here restore the expected properties needed when earlier
      // versions of `passport` are `require`-ed.  This compatibility mode is
      // enabled by default, and can be disabld by simply not `use`-ing `passport.initialize()`
      // middleware or setting `compat: false` as an option to the middleware.
      //
      // An alternative approach to addressing this issue would be to not
      // preferentially use pre-existing functions on `req`, but rather always
      // overwrite `req.logIn`, etc. with the versions of those functions shiped
      // with `authenticate()` middleware.  This option should be reconsidered
      // in a future major version release.
      //
      // [1]: https://github.com/jaredhanson/passport/pull/875
      // [2]: https://github.com/jaredhanson/passport/blob/v0.4.1/lib/http/request.js
      // [3]: https://github.com/jaredhanson/passport/blob/v0.5.1/lib/middleware/authenticate.js#L96
      // [4]: https://github.com/jaredhanson/passport/issues/877
      passport._userProperty = options.userProperty || "user";

      req._passport = {};
      req._passport.instance = passport;
    }

    next();
  };
};
