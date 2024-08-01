/**
 * Module dependencies.
 */
var http = require("http"),
  IncomingMessageExt = require("../http/request"),
  AuthenticationError = require("../errors/authenticationerror");

/**
 * Authenticates requests.
 *
 * Applies the `name`ed strategy (or strategies) to the incoming request, in
 * order to authenticate the request.  If authentication is successful, the user
 * will be logged in and populated at `req.user` and a session will be
 * established by default.  If authentication fails, an unauthorized response
 * will be sent.
 *
 * Options:
 *   - `session`          Save login state in session, defaults to _true_ 将登录状态保存在session对象
 *   - `successRedirect`  After successful login, redirect to given URL 登陆成功后，重定向的url
 *   - `successMessage`   True to store success message in
 *                        req.session.messages, or a string to use as override
 *                        如果为true，则将成功消息存储在req.session.messages中，或用作成功时的覆盖字符串
 *                        message for success.
 *   - `successFlash`     True to flash success messages or a string to use as a flash
 *                        message for success (overrides any from the strategy itself).
 *                        如果为true，使用默认的成功消息并闪现给用户
 *                        如果为字符串，使用自定义的成功消息闪现给用户
 *   - `failureRedirect`  After failed login, redirect to given URL 在登录失败后，重定向的内容
 *   - `failureMessage`   True to store failure message in 如果为true，则将失败消息存储在req.session.messages，或用作失败时的覆盖字符串
 *                        req.session.messages, or a string to use as override
 *                        message for failure.
 *   - `failureFlash`     True to flash failure messages or a string to use as a flash
 *                        message for failures (overrides any from the strategy itself).
 *   - `assignProperty`   Assign the object provided by the verify callback to given property
 *                        将验证回调提供的对象分配给给定的属性
 *
 * An optional `callback` can be supplied to allow the application to override
 * the default manner in which authentication attempts are handled.  The
 * callback has the following signature, where `user` will be set to the
 * authenticated user on a successful authentication attempt, or `false`
 * otherwise.  An optional `info` argument will be passed, containing additional
 * details provided by the strategy's verify callback - this could be information about
 * a successful authentication or a challenge message for a failed authentication.
 * An optional `status` argument will be passed when authentication fails - this could
 * be a HTTP response code for a remote authentication failure or similar.
 * 可以提供可选的 `callback`，以允许应用程序覆盖处理身份验证尝试的默认方式。
 * 回调具有以下签名，其中 `user` 将在身份验证成功时设置为经过身份验证的用户，
 * 否则设置为 `false`。将传递可选的 `info` 参数，其中包含策略的验证回调提供的其他详细信息
 * 这可能是有关成功身份验证的信息或身份验证失败的质询消息。当身份验证失败时，
 * 将传递可选的 `status` 参数 - 这可能是远程身份验证失败或类似情况的 HTTP 响应代码。
 *
 *     app.get('/protected', function(req, res, next) {
 *       passport.authenticate('local', function(err, user, info, status) {
 *         if (err) { return next(err) }
 *         if (!user) { return res.redirect('/signin') }
 *         res.redirect('/account');
 *       })(req, res, next);
 *     });
 *
 * Note that if a callback is supplied, it becomes the application's
 * responsibility to log-in the user, establish a session, and otherwise perform
 * the desired operations.
 *
 * Examples:
 *
 *     passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' });
 *
 *     passport.authenticate('basic', { session: false });
 *
 *     passport.authenticate('twitter');
 *
 * @param {Strategy|String|Array} name 可以是策略实例、
 * @param {Object} options
 * @param {Function} callback
 * @return {Function}
 * @api public
 */
module.exports = function authenticate(passport, name, options, callback) {
  /**如果options是函数，那么当做回调函数使用 */
  if (typeof options == "function") {
    callback = options;
    options = {};
  }
  options = options || {};
  /**默认多策略验证 */
  var multi = true;

  // Cast `name` to an array, allowing authentication to pass through a chain of
  // strategies.  The first strategy to succeed, redirect, or error will halt
  // the chain.  Authentication failures will proceed through each strategy in
  // series, ultimately failing if all strategies fail.
  //
  // This is typically used on API endpoints to allow clients to authenticate
  // using their preferred choice of Basic, Digest, token-based schemes, etc.
  // It is not feasible to construct a chain of multiple strategies that involve
  // redirection (for example both Facebook and Twitter), since the first one to
  // redirect will halt the chain.

  // 将 `name` 转换为数组，允许认证通过一系列策略链。第一个成功、重定向或出错的策略将停止链的执行。
  // 认证失败将依次通过每个策略，最终如果所有策略都失败则认证失败。
  //
  // 这通常用于 API 端点，允许客户端使用其首选的 Basic、Digest、基于令牌的方案等进行认证。
  // 构建涉及重定向的多个策略链（例如同时使用 Facebook 和 Twitter）是不可行的，因为第一个重定向的策略将停止链的执行。

  /**
   * 多策略验证在以下场景中非常有用：
   * 1、在一个应用中，用户可能希望使用不同的身份验证方式登录。
   * 例如，用户可以选择使用用户名和密码、本地账户、OAuth
   * （如 Google、Facebook、Twitter）或其他第三方身份验证服务。；
   * 2、在某些情况下，你可能希望逐步降级身份验证策略。例如，首先尝试使用 OAuth
   *  令牌进行身份验证，如果失败，则回退到基本身份验证（用户名和密码）
   * 3、在 API 端点中，客户端可能使用不同的认证方式。例如，某些客户端可能使用 API
   *  密钥进行认证，而其他客户端可能使用 OAuth 令牌。
   * 4、在某些应用中，不同的用户角色可能需要不同的认证方式。
   * 例如，管理员可能需要使用更强的认证方式（如双因素认证），
   * 而普通用户只需要使用用户名和密码。
   */

  if (!Array.isArray(name)) {
    name = [name];
    multi = false;
  }

  return function authenticate(req, res, next) {
    req.login = req.logIn = req.logIn || IncomingMessageExt.logIn;
    req.logout = req.logOut = req.logOut || IncomingMessageExt.logOut;
    req.isAuthenticated =
      req.isAuthenticated || IncomingMessageExt.isAuthenticated;
    req.isUnauthenticated =
      req.isUnauthenticated || IncomingMessageExt.isUnauthenticated;

    req._sessionManager = passport._sm;

    // accumulator for failures from each strategy in the chain
    // 用于存放
    var failures = [];

    function allFailed() {
      if (callback) {
        if (!multi) {
          return callback(
            null,
            false,
            failures[0].challenge,
            failures[0].status
          );
        } else {
          var challenges = failures.map(function (f) {
            return f.challenge;
          });
          var statuses = failures.map(function (f) {
            return f.status;
          });
          return callback(null, false, challenges, statuses);
        }
      }

      // Strategies are ordered by priority.  For the purpose of flashing a
      // message, the first failure will be displayed.
      var failure = failures[0] || {},
        challenge = failure.challenge || {},
        msg;

      if (options.failureFlash) {
        var flash = options.failureFlash;
        if (typeof flash == "string") {
          flash = { type: "error", message: flash };
        }
        flash.type = flash.type || "error";

        var type = flash.type || challenge.type || "error";
        msg = flash.message || challenge.message || challenge;
        if (typeof msg == "string") {
          req.flash(type, msg);
        }
      }
      if (options.failureMessage) {
        msg = options.failureMessage;
        if (typeof msg == "boolean") {
          msg = challenge.message || challenge;
        }
        if (typeof msg == "string") {
          req.session.messages = req.session.messages || [];
          req.session.messages.push(msg);
        }
      }
      if (options.failureRedirect) {
        return res.redirect(options.failureRedirect);
      }

      // When failure handling is not delegated to the application, the default
      // is to respond with 401 Unauthorized.  Note that the WWW-Authenticate
      // header will be set according to the strategies in use (see
      // actions#fail).  If multiple strategies failed, each of their challenges
      // will be included in the response.
      var rchallenge = [],
        rstatus,
        status;

      for (var j = 0, len = failures.length; j < len; j++) {
        failure = failures[j];
        challenge = failure.challenge;
        status = failure.status;

        rstatus = rstatus || status;
        if (typeof challenge == "string") {
          rchallenge.push(challenge);
        }
      }

      res.statusCode = rstatus || 401;
      if (res.statusCode == 401 && rchallenge.length) {
        res.setHeader("WWW-Authenticate", rchallenge);
      }
      if (options.failWithError) {
        return next(
          new AuthenticationError(http.STATUS_CODES[res.statusCode], rstatus)
        );
      }
      res.end(http.STATUS_CODES[res.statusCode]);
    }

    (function attempt(i) {
      /**获取索引对应的策略 */
      var layer = name[i];
      // If no more strategies exist in the chain, authentication has failed.
      /**如果索引没有对应策略，那么说明验证已经失败 */
      if (!layer) {
        return allFailed();
      }

      // Get the strategy, which will be used as prototype from which to create
      // a new instance.  Action functions will then be bound to the strategy
      // within the context of the HTTP request/response pair.
      var strategy, prototype;
      /**layer.authenticate 存在并且是个函数，那么传入的name是一个策略实例，否则是一个策略名称 */
      if (typeof layer.authenticate == "function") {
        strategy = layer;
      } else {
        /**根据策略名称，从策略集合中获取到策略实例 */
        prototype = passport._strategy(layer);
        /**没有策略实例，报错 */
        if (!prototype) {
          return next(
            new Error('Unknown authentication strategy "' + layer + '"')
          );
        }
        /**创建一个新实例，将获取到的策略实例作为新实例的原型 */
        strategy = Object.create(prototype);
      }

      // ----- BEGIN STRATEGY AUGMENTATION -----
      // Augment the new strategy instance with action functions.  These action
      // functions are bound via closure the the request/response pair.  The end
      // goal of the strategy is to invoke *one* of these action methods, in
      // order to indicate successful or failed authentication, redirect to a
      // third-party identity provider, etc.

      /**
       * Authenticate `user`, with optional `info`.
       *
       * Strategies should call this function to successfully authenticate a
       * user.  `user` should be an object supplied by the application after it
       * has been given an opportunity to verify credentials.  `info` is an
       * optional argument containing additional user information.  This is
       * useful for third-party authentication strategies to pass profile
       * details.
       *
       * 认证 `user`，可以选择附带 `info`。
       * 策略应调用此函数来成功认证用户。`user` 应是应用程序在验证凭证后提供的对象。
       * `info` 是一个可选参数，包含额外的用户信息。
       * 对于第三方认证策略传递用户资料详细信息，这非常有用。
       *
       * @param {Object} user
       * @param {Object} info
       * @api public
       */
      strategy.success = function (user, info) {
        if (callback) {
          return callback(null, user, info);
        }
        /**附加信息 */
        info = info || {};
        var msg;

        if (options.successFlash) {
          var flash = options.successFlash;
          if (typeof flash == "string") {
            flash = { type: "success", message: flash };
          }
          flash.type = flash.type || "success";

          var type = flash.type || info.type || "success";
          msg = flash.message || info.message || info;
          if (typeof msg == "string") {
            req.flash(type, msg);
          }
        }
        if (options.successMessage) {
          msg = options.successMessage;
          if (typeof msg == "boolean") {
            msg = info.message || info;
          }
          if (typeof msg == "string") {
            req.session.messages = req.session.messages || [];
            req.session.messages.push(msg);
          }
        }
        if (options.assignProperty) {
          req[options.assignProperty] = user;
          if (options.authInfo !== false) {
            passport.transformAuthInfo(info, req, function (err, tinfo) {
              if (err) {
                return next(err);
              }
              req.authInfo = tinfo;
              next();
            });
          } else {
            next();
          }
          return;
        }

        req.logIn(user, options, function (err) {
          if (err) {
            return next(err);
          }

          function complete() {
            if (options.successReturnToOrRedirect) {
              var url = options.successReturnToOrRedirect;
              if (req.session && req.session.returnTo) {
                url = req.session.returnTo;
                delete req.session.returnTo;
              }
              return res.redirect(url);
            }
            if (options.successRedirect) {
              return res.redirect(options.successRedirect);
            }
            next();
          }

          if (options.authInfo !== false) {
            passport.transformAuthInfo(info, req, function (err, tinfo) {
              if (err) {
                return next(err);
              }
              req.authInfo = tinfo;
              complete();
            });
          } else {
            complete();
          }
        });
      };

      /**
       * Fail authentication, with optional `challenge` and `status`, defaulting
       * to 401.
       *
       * Strategies should call this function to fail an authentication attempt.
       *
       * @param {String} challenge challenge 参数通常用于提供有关失败原因的详细信息，或者用于向客户端发送特定的身份验证挑战信息。
       * @param {Number} status
       * @api public
       */
      strategy.fail = function (challenge, status) {
        if (typeof challenge == "number") {
          status = challenge;
          challenge = undefined;
        }

        // push this failure into the accumulator and attempt authentication
        // using the next strategy
        /**
         * 将当前策略的失败认证放到累加器中，并尝试进行下一个策略的认证
         */
        failures.push({ challenge: challenge, status: status });
        attempt(i + 1);
      };

      /**
       * Redirect to `url` with optional `status`, defaulting to 302.
       *
       * Strategies should call this function to redirect the user (via their
       * user agent) to a third-party website for authentication.
       *
       * @param {String} url
       * @param {Number} status
       * @api public
       */
      strategy.redirect = function (url, status) {
        // NOTE: Do not use `res.redirect` from Express, because it can't decide
        //       what it wants.
        //
        //       Express 2.x: res.redirect(url, status)
        //       Express 3.x: res.redirect(status, url) -OR- res.redirect(url, status)
        //         - as of 3.14.0, deprecated warnings are issued if res.redirect(url, status)
        //           is used
        //       Express 4.x: res.redirect(status, url)
        //         - all versions (as of 4.8.7) continue to accept res.redirect(url, status)
        //           but issue deprecated versions

        res.statusCode = status || 302;
        res.setHeader("Location", url);
        res.setHeader("Content-Length", "0");
        res.end();
      };

      /**
       * Pass without making a success or fail decision.
       *
       * Under most circumstances, Strategies should not need to call this
       * function.  It exists primarily to allow previous authentication state
       * to be restored, for example from an HTTP session.
       *
       * @api public
       */
      strategy.pass = function () {
        next();
      };

      /**
       * Internal error while performing authentication.
       *
       * Strategies should call this function when an internal error occurs
       * during the process of performing authentication; for example, if the
       * user directory is not available.
       *
       * @param {Error} err
       * @api public
       */
      strategy.error = function (err) {
        if (callback) {
          return callback(err);
        }

        next(err);
      };

      // ----- END STRATEGY AUGMENTATION -----

      strategy.authenticate(req, options);
    })(0); // attempt
  };
};
