/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 * @private
 */

var Route = require("./route");
var Layer = require("./layer");
var methods = require("methods");
/**
 * function mixin(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
}
 */
var mixin = require("utils-merge");
var debug = require("debug")("express:router");
var deprecate = require("depd")("express");
var flatten = require("array-flatten");
var parseUrl = require("parseurl");
var setPrototypeOf = require("setprototypeof");

/**
 * Module variables.
 * @private
 */

var objectRegExp = /^\[object (\S+)\]$/;
var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

/**
 * Initialize a new `Router` with the given `options`.
 *
 * @param {Object} [options]
 * @return {Router} which is a callable function
 * @public
 */

var proto = (module.exports = function (options) {
  var opts = options || {};

  function router(req, res, next) {
    router.handle(req, res, next);
  }

  // mixin Router class functions
  setPrototypeOf(router, proto);
  /**存储路径参数的处理函数，键是参数名，值是处理函数
   *  router.params['userId'] = [function(req, res, next, value) { ... }];
   */
  router.params = {};
  /**存储全局参数处理函数，这些函数在所有路由参数处理之前执行 */
  router._params = [];
  /**布尔值 指定路由是否区分大小写 */
  router.caseSensitive = opts.caseSensitive;
  /**布尔值 指定是否将父路由的参数合并到子路由中 */
  router.mergeParams = opts.mergeParams;
  /**布尔值 指定路由是否严格匹配路径末尾的斜杆 */
  router.strict = opts.strict;
  /**存放layer实例 */
  router.stack = [];

  return router;
});

/**
 * Map the given param placeholder `name`(s) to the given callback.
 *
 * Parameter mapping is used to provide pre-conditions to routes
 * which use normalized placeholders. For example a _:user_id_ parameter
 * could automatically load a user's information from the database without
 * any additional code,
 *
 * The callback uses the same signature as middleware, the only difference
 * being that the value of the placeholder is passed, in this case the _id_
 * of the user. Once the `next()` function is invoked, just like middleware
 * it will continue on to execute the route, or subsequent parameter functions.
 *
 * Just like in middleware, you must either respond to the request or call next
 * to avoid stalling the request.
 *
 *  app.param('user_id', function(req, res, next, id){
 *    User.find(id, function(err, user){
 *      if (err) {
 *        return next(err);
 *      } else if (!user) {
 *        return next(new Error('failed to load user'));
 *      }
 *      req.user = user;
 *      next();
 *    });
 *  });
 *
 * 为指定的路由参数添加处理函数
 *
 * @param {String} name
 * @param {Function} fn
 * @return {app} for chaining
 * @public
 */

proto.param = function param(name, fn) {
  // param logic
  if (typeof name === "function") {
    deprecate("router.param(fn): Refactor to use path params");
    this._params.push(name);
    return;
  }

  // apply param functions
  var params = this._params;
  var len = params.length;
  var ret;

  if (name[0] === ":") {
    deprecate(
      "router.param(" +
        JSON.stringify(name) +
        ", fn): Use router.param(" +
        JSON.stringify(name.slice(1)) +
        ", fn) instead"
    );
    name = name.slice(1);
  }

  for (var i = 0; i < len; ++i) {
    if ((ret = params[i](name, fn))) {
      fn = ret;
    }
  }

  // ensure we end up with a
  // middleware function
  if ("function" !== typeof fn) {
    throw new Error("invalid param() call for " + name + ", got " + fn);
  }

  (this.params[name] = this.params[name] || []).push(fn);
  return this;
};

/**
 * Dispatch a req, res into the router.
 * 分发请求到路由堆栈中的处理函数
 * @private
 */

proto.handle = function handle(req, res, out) {
  var self = this;

  debug("dispatching %s %s", req.method, req.url);

  var idx = 0;
  var protohost = getProtohost(req.url) || "";
  var removed = "";
  var slashAdded = false;
  var sync = 0;
  var paramcalled = {};

  // store options for OPTIONS request
  // only used if OPTIONS request
  var options = [];

  // middleware and routes
  var stack = self.stack;

  // manage inter-router variables
  var parentParams = req.params;
  var parentUrl = req.baseUrl || "";
  var done = restore(out, req, "baseUrl", "next", "params");

  // setup next layer
  req.next = next;

  // for options requests, respond with a default if nothing else responds
  if (req.method === "OPTIONS") {
    done = wrap(done, function (old, err) {
      if (err || options.length === 0) return old(err);
      sendOptionsResponse(res, options, old);
    });
  }

  // setup basic req values
  req.baseUrl = parentUrl;
  req.originalUrl = req.originalUrl || req.url;

  next();

  function next(err) {
    var layerError = err === "route" ? null : err;

    // remove added slash 删除添加的斜杠
    if (slashAdded) {
      req.url = req.url.slice(1);
      slashAdded = false;
    }

    // restore altered req.url 恢复更改后的req.url
    if (removed.length !== 0) {
      req.baseUrl = parentUrl;
      req.url = protohost + removed + req.url.slice(protohost.length);
      removed = "";
    }

    // signal to exit router
    if (layerError === "router") {
      /**使用setImmediate可以避免递归调用导致的栈溢出 */
      setImmediate(done, null);
      return;
    }

    // no more matching layers
    if (idx >= stack.length) {
      setImmediate(done, layerError);
      return;
    }

    // max sync stack
    if (++sync > 100) {
      return setImmediate(next, err);
    }

    // get pathname of request
    var path = getPathname(req);

    if (path == null) {
      return done(layerError);
    }

    // find next matching layer
    var layer;
    var match;
    var route;

    while (match !== true && idx < stack.length) {
      layer = stack[idx++];
      match = matchLayer(layer, path);
      route = layer.route;

      if (typeof match !== "boolean") {
        // 不是boolean类型，那肯定是错误对象，说明匹配出错
        layerError = layerError || match;
      }
      /**match为false或者为错误对象，跳过，执行下一个匹配 */
      if (match !== true) {
        continue;
      }
      /**匹配中了，但没有route，说明是使用use注册的中间件，而不是通过router[http_method]定义的路由层 */
      if (!route) {
        // process non-route handlers normally
        continue;
      }
      // 即便当前layer匹配中了，但是之前匹配过程中有错误，也会跳到下一个，而不会继续往下执行，直到结束
      if (layerError) {
        // routes do not match with a pending error
        match = false;
        continue;
      }

      var method = req.method;
      var has_method = route._handles_method(method);

      // build up automatic options response
      if (!has_method && method === "OPTIONS") {
        appendMethods(options, route._options());
      }

      // don't even bother matching route 方法没匹配上
      if (!has_method && method !== "HEAD") {
        match = false;
      }
    }

    // no match
    /**
     * 到这里还没匹配到或者说因为匹配中出错导致的，
     * 因为上面只有匹配出现错误，就会一直continue，直到结束，所以在这里调用done结束匹配
     */
    if (match !== true) {
      return done(layerError);
    }

    // store route for dispatch on change  有route，说明是通过app.get。。。等请求方法注册的中间件
    if (route) {
      // 储存route以备变更时分发
      req.route = route;
    }

    // Capture one-time layer values 合并参数
    req.params = self.mergeParams
      ? mergeParams(layer.params, parentParams)
      : layer.params;
    var layerPath = layer.path;

    // this should be done for the layer
    self.process_params(layer, paramcalled, req, res, function (err) {
      if (err) {
        next(layerError || err);
      } else if (route) {
        layer.handle_request(req, res, next);
      } else {
        trim_prefix(layer, layerError, layerPath, path);
      }

      sync = 0;
    });
  }

  function trim_prefix(layer, layerError, layerPath, path) {
    if (layerPath.length !== 0) {
      // Validate path is a prefix match
      /**
       * 检查当前层的路径是否是请求路径的前缀，不是的话，调用next(layerError)继续执行匹配，
       * 在上一次匹配中时，idx会停留在匹配中的下一个层的索引位置，
       * 所以调用next会继续执行下去，等待下一次匹配中或者到结束
       */
      if (layerPath !== path.slice(0, layerPath.length)) {
        next(layerError);
        return;
      }

      // Validate path breaks on a path separator
      /**
       * 确保路径在匹配不分之后正确分隔，使用 /或. 不是的话调用next结束当前执行
       */
      var c = path[layerPath.length];
      if (c && c !== "/" && c !== ".") return next(layerError);

      // Trim off the part of the url that matches the route
      // middleware (.use stuff) needs to have the path stripped
      debug("trim prefix (%s) from url %s", layerPath, req.url);
      /**将layerPath给到removed，表示要从请求URL中移除与当前层路径匹配的部分。 */
      removed = layerPath;
      /**更新req.url，只保留未匹配部分 */
      req.url = protohost + req.url.slice(protohost.length + removed.length);

      // Ensure leading slash 如果移除前缀后的URL不以斜杠开始，添加一个前导斜杠
      if (!protohost && req.url[0] !== "/") {
        req.url = "/" + req.url;
        slashAdded = true;
      }

      // Setup base URL (no trailing slash)
      /**
       * 设置 req.baseUrl，反映当前的路由上下文
       * 基础URL不包含尾部斜杠
       */
      req.baseUrl =
        parentUrl +
        (removed[removed.length - 1] === "/"
          ? removed.substring(0, removed.length - 1)
          : removed);
    }

    debug("%s %s : %s", layer.name, layerPath, req.originalUrl);

    if (layerError) {
      layer.handle_error(layerError, req, res, next);
    } else {
      layer.handle_request(req, res, next);
    }
  }
};

/**
 * Process any parameters for the layer.
 * 处理路由层上的路径参数
 * @private
 */

proto.process_params = function process_params(layer, called, req, res, done) {
  var params = this.params;

  // captured parameters from the layer, keys and values
  var keys = layer.keys;

  // fast track 如果没有在url上声明参数，/user/:id
  if (!keys || keys.length === 0) {
    return done();
  }

  var i = 0;
  var name;
  var paramIndex = 0;
  var key;
  var paramVal;
  var paramCallbacks;
  var paramCalled;

  // process params in order
  // param callbacks can be async
  function param(err) {
    // 出错了
    if (err) {
      return done(err);
    }
    // 当前索引超出范围
    if (i >= keys.length) {
      return done();
    }

    paramIndex = 0;
    key = keys[i++];
    name = key.name;
    paramVal = req.params[name];
    paramCallbacks = params[name];
    paramCalled = called[name];

    if (paramVal === undefined || !paramCallbacks) {
      return param();
    }

    // param previously called with same value or error occurred
    if (
      paramCalled &&
      (paramCalled.match === paramVal ||
        (paramCalled.error && paramCalled.error !== "route"))
    ) {
      // restore value
      req.params[name] = paramCalled.value;

      // next param
      return param(paramCalled.error);
    }

    called[name] = paramCalled = {
      error: null,
      match: paramVal,
      value: paramVal,
    };

    paramCallback();
  }

  // single param callbacks
  function paramCallback(err) {
    var fn = paramCallbacks[paramIndex++];

    // store updated value
    paramCalled.value = req.params[key.name];

    if (err) {
      // store error
      paramCalled.error = err;
      param(err);
      return;
    }

    if (!fn) return param();

    try {
      fn(req, res, paramCallback, paramVal, key.name);
    } catch (e) {
      paramCallback(e);
    }
  }

  param();
};

/**
 * Use the given middleware function, with optional path, defaulting to "/".
 *
 * Use (like `.all`) will run for any http METHOD, but it will not add
 * handlers for those methods so OPTIONS requests will not consider `.use`
 * functions even if they could respond.
 *
 * The other difference is that _route_ path is stripped and not visible
 * to the handler function. The main effect of this feature is that mounted
 * handlers can operate without any code changes regardless of the "prefix"
 * pathname.
 *
 * @public
 */

proto.use = function use(fn) {
  var offset = 0;
  var path = "/";

  // default path to '/'
  // disambiguate router.use([fn])
  if (typeof fn !== "function") {
    var arg = fn;

    while (Array.isArray(arg) && arg.length !== 0) {
      arg = arg[0];
    }

    // first arg is the path
    if (typeof arg !== "function") {
      offset = 1;
      path = fn;
    }
  }

  var callbacks = flatten(slice.call(arguments, offset));

  if (callbacks.length === 0) {
    throw new TypeError("Router.use() requires a middleware function");
  }

  for (var i = 0; i < callbacks.length; i++) {
    var fn = callbacks[i];

    if (typeof fn !== "function") {
      throw new TypeError(
        "Router.use() requires a middleware function but got a " + gettype(fn)
      );
    }

    // add the middleware
    debug("use %o %s", path, fn.name || "<anonymous>");

    var layer = new Layer(
      path,
      {
        sensitive: this.caseSensitive,
        strict: false,
        end: false,
      },
      fn
    );

    layer.route = undefined;

    this.stack.push(layer);
  }

  return this;
};

/**
 * Create a new Route for the given path.
 *
 * Each route contains a separate middleware stack and VERB handlers.
 *
 * See the Route api documentation for details on adding handlers
 * and middleware to routes.
 *
 *
 * @param {String} path
 * @return {Route}
 * @public
 */

proto.route = function route(path) {
  var route = new Route(path);

  var layer = new Layer(
    path,
    {
      sensitive: this.caseSensitive,
      strict: this.strict,
      end: true,
    },
    route.dispatch.bind(route)
  );

  layer.route = route;

  this.stack.push(layer);
  return route;
};

// create Router#VERB functions
methods.concat("all").forEach(function (method) {
  proto[method] = function (path) {
    var route = this.route(path);
    route[method].apply(route, slice.call(arguments, 1));
    return this;
  };
});

// append methods to a list of methods
function appendMethods(list, addition) {
  for (var i = 0; i < addition.length; i++) {
    var method = addition[i];
    if (list.indexOf(method) === -1) {
      list.push(method);
    }
  }
}

// get pathname of request
function getPathname(req) {
  try {
    return parseUrl(req).pathname;
  } catch (err) {
    return undefined;
  }
}

// Get get protocol + host for a URL
function getProtohost(url) {
  if (typeof url !== "string" || url.length === 0 || url[0] === "/") {
    return undefined;
  }

  var searchIndex = url.indexOf("?");
  var pathLength = searchIndex !== -1 ? searchIndex : url.length;
  var fqdnIndex = url.slice(0, pathLength).indexOf("://");

  return fqdnIndex !== -1
    ? url.substring(0, url.indexOf("/", 3 + fqdnIndex))
    : undefined;
}

// get type for error message
function gettype(obj) {
  var type = typeof obj;

  if (type !== "object") {
    return type;
  }

  // inspect [[Class]] for objects
  return toString.call(obj).replace(objectRegExp, "$1");
}

/**
 * Match path to a layer.
 *
 * @param {Layer} layer
 * @param {string} path
 * @private
 */

function matchLayer(layer, path) {
  try {
    return layer.match(path);
  } catch (err) {
    return err;
  }
}

// merge params with parent params
function mergeParams(params, parent) {
  /**没有parent，就直接返回params，不用合并了 */
  if (typeof parent !== "object" || !parent) {
    return params;
  }

  // make copy of parent for base
  var obj = mixin({}, parent);

  // simple non-numeric merging
  if (!(0 in params) || !(0 in parent)) {
    return mixin(obj, params);
  }

  var i = 0;
  var o = 0;

  // determine numeric gaps
  while (i in params) {
    i++;
  }

  while (o in parent) {
    o++;
  }

  // offset numeric indices in params before merge
  for (i--; i >= 0; i--) {
    params[i + o] = params[i];

    // create holes for the merge when necessary
    if (i < o) {
      delete params[i];
    }
  }

  return mixin(obj, params);
}

// restore obj props after function
function restore(fn, obj) {
  var props = new Array(arguments.length - 2);
  var vals = new Array(arguments.length - 2);

  for (var i = 0; i < props.length; i++) {
    props[i] = arguments[i + 2];
    vals[i] = obj[props[i]];
  }

  return function () {
    // restore vals
    for (var i = 0; i < props.length; i++) {
      obj[props[i]] = vals[i];
    }

    return fn.apply(this, arguments);
  };
}

// send an OPTIONS response
function sendOptionsResponse(res, options, next) {
  try {
    var body = options.join(",");
    res.set("Allow", body);
    res.send(body);
  } catch (err) {
    next(err);
  }
}

// wrap a function
function wrap(old, fn) {
  return function proxy() {
    var args = new Array(arguments.length + 1);

    args[0] = old;
    for (var i = 0, len = arguments.length; i < len; i++) {
      args[i + 1] = arguments[i];
    }

    fn.apply(this, args);
  };
}
