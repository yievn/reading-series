---
theme: condensed-night-purple
highlight: default
---

## 前言

之前看过一遍`express`源码，也基本读懂了`express`的实现原理，但是一直想不出来怎么更加通俗的表达，所以一直不敢下手。直到最近在看`Nestjs`源码时，再次翻了一遍`express`源码，在脑子里更清晰地构建了`express`原理结构图之后，我感觉我是时候下手做记录了，不然过段时间又要忘了。

首先说明，为了方便理解，本文源码都是经过简化的，去除了大部分与主要流程的逻辑无关的代码，有什么错误的地方欢迎在评论区指出，感蟹。

## express是什么？

按传统，简单概括一下`express`。

> `express`是基于nodejs进一步扩展封装的服务端框架，提供了简洁的API、中间件支持、灵活的路由管理以及静态文件服务，具备强大的扩展性和庞大的生态系统，适用于各种规模的项目。

简单理解，express从前端角度上看就是jQuery、Vue等框架，也都同样基于JavaScript的扩展封装，只不过express执行于服务端而已。

## express由什么构成？

`express`可以说由四个主要元素构成，它们是`application`、`Router`、`Route`、`Layer`，应用程序的中间件机制由它们构建起来，这里先看看它们的源码实现，简单介绍一下。

### application

当我们调用`express()`时
```js
const app = express();
```

实际是执行`createApplication()`工厂函数，它返回一个app对象。

```js
function createApplication() {
  var app = function(req, res, next) {
    app.handle(req, res, next);
  };
  ...
  mixin(app, app_proto, false);
  ...
  return app;
}
```

app对象可以说是express的躯干，`「它本身就是一个中间件函数」`，所有方法和属性都是定义在`app_proto`对象上的，然后通过`mixin`方法将`app_proto`对象上的自有属性和方法复制到app对象上，这里不对每个方法的源码逐一展开，后面在使用场景涉及到时再讲。

```js
var app_proto = {
    _router: null,
    use(){},
    get(){},
    post(){},
    put(){},
    delete(){},
    ...
    lazyrouter(){},
    route(){},
    handle(){},
    listen(){}
    ...
}
```
我们一旦在app上注册中间件或者定义路由（调用app.use和app.get、app.post等请求方法），就会先调用`app.lazyrouter`创建一个Router实例（`app._router`）。如果一个app对象没有注册任何中间件或者路由，那么`app._router`始终为`undefined`，Router实例不会被创建，它只有在用到时才会创建，这也是为啥叫做`lazyrouter`。
```js
app_proto.lazyrouter = function() {
    if(!this._router) {
        this._router = new Router()
    }
}
```
> 所有通过app对象进行中间件注册和路由定义的实际上都是发生在app._router上面，app对象就相当于在一个Router实例上包一个壳。

### Router
`Router`是express应用程序中最核心的元素，它负责组织和管理路由。每一个Router实例都是一个迷你的应用程序，它们可以独自注册中间件和定义路由。

```js
function Router() {
    var router =function (req, res, next) {
        router.handle(req, res, next);
    }
    router.stack = [];
    mixin(router, router_proto, false);
    ...
    return router;
}
```

可以看到，和调用createApplication创建的app对象一样，其返回的router对象，`本身也是一个中间件函数`，它的大部分方法和属性也是定义在`router_proto`对象上的。

```js
var router_proto = {
    use(){},
    get(){},
    post(){},
    put(){},
    delete(){},
    route(){},
    ...
    handle(){}
}
```

通过Router，我们可以将应用程序的路由逻辑分解成多个独立的模块，每个模块负责处理特定的路径，然后通过匹配不同的路径，将请求分发到对应的Router。

```js
const Router = express.Router;
const router1 = new Router();
const router2 = new Router();

app.use('/user', router1);
app.use('/permission', router2);
```

### Route

Route用于定义和处理特定路径的HTTP请求。它允许为不同的HTTP方法（如GET、POST、PUT等）添加中间件处理程序（handler）。

```js
function Route(path) {
  this.path = path;
  this.stack = [];

  this.methods = {};
}
// 匹配请求方法
Route.prototype.match_method = function(method) {
  return Boolean(this.method[method])
}
// 本身是一个中间件函数，用于执行stack里面的中间件函数
Route.prototype.dispatch = function(req, res, done) {
  var index = 0;
  var stack = this.stack;
  var method = req.method.toLowerCase();

  if(!this.stack.length) {
    return done();
  }

  (function next() {
    var layer = stack[index++];
    if(layer.method && layer.method !==method) {
      // 方法不匹配，下一个
      next();
    }  else {
      // 匹配上了，执行layer中的中间件函数
      layer.handle_request(req, res, next);
    }
  })()
}
// 暂定这四个请求方法
['post', 'delete', 'get', 'put'].forEach((method) => {
  Route.prototype[method] = function(...fns) {
    fns.forEach(fn => {
      var layer = new Layer('/', fn);
      layer.method = method;
      this.methods[method] = true;
      this.stack.push(layer)
    })
    return this
  }
})
```
源码很好理解，就是用于为特定路径注册一系列与HTTP请求方法相关的中间件处理函数。它和Router都是将中间件函数以layer的形式存放到stack中。

有时会疑惑，有Router就行了，还要Route做什么？通过Router实例注册的所有中间件函数，最后都会以layer的形式按注册顺序存放在stack中，stack就是一个大杂烩，对Router来讲，它只针对单个layer进行匹配，无法对某一类的中间件集合进行颗粒度管理。而Route可以为特定路径管理一个HTTP方法的中间件集合，同时Route这个设计也非常满足实际的业务需求，在业务中的增删查改都可以通过Route来定义。

### Layer
在express应用程序中，每注册一个中间件，都会以中间件函数为参数创建一个Layer实例，然后Layer实例再被推到Router或Route的stack中等待请求到来时被处理。如果express中间件的执行过程是一条流水线，那么Layer就是流水线上的工人，每个Layer都有不同的作用。

```js
function Layer(path, fn) {
    // 将Layer当普通函数调用时，创建一个Layer实例并返回
    if(!(this instanceof Layer)) {
        return new Layer
    }
    this.path = path
    this.handle = fn
}
// 用于匹配请求url
Layer.prototype.match_path = function (url){
  var match = url.startsWith(this.path)
  return match
}
// 执行中间件函数
Layer.prototype.handle_request = function(req, res, next) {
  try {
    this.handle(req, res, next);
  } catch (err) {
    next(err);
  }
}
```
在express源码中，传入Layer的path会被转换为正则表达式，转换的同时也在收集path中定义的参数键（例如`/user/:id`中的id会被收集到keys中）。在请求来到时，会拿正则表达式与请求url（同时也会从url获得参数值）进行匹配，匹配中会调用`handle_request`函数来执行存放在Layer实例中的中间件函数，否则通过next匹配下一个Layer实例。

但是呢，为了便于理解，我这里进行了简化，我们假设路径的匹配是这样的，如果req.url为/api/user/info，而当前layer的path为/api/user，那么当前的Layer会被匹配中。

## 从运用中看源码

### 使用app.use注册中间件

通常我们在创建app对象后，会调用`app.use()`来注册中间件。
```js
app.use(function fn1(req, res, next) {});
app.use('/api', function fn2(req, res, next) {}, function fn3(req, res, next){});
```
那将中间件函数传入`app.use`方法后，在里面是怎么被处理的呢？

```js
app_proto.use = function(path, ...fns) {
    if(typeof path === 'function') {
        fns.unshift(path)
        path = '/'
    }

    this.lazyrouter()
    fns.forEach(fn => {
        this._router.use(path, fn)
    })

    return this
}
```
可以看到实际是调用`app._router.use`来进一步处理中间件。`app._router`是`Router`的实例，它通过调用`app.lazyrouter()`来创建，这个上面有讲。我们看看router.use的实现

```js
router_proto.use = function(path, ...fns) {
    if(typeof path === 'function') {
        fns.unshift(path)
        path = '/'
    }

    fns.forEach(fn => {
        var layer = new Layer(path, fn)
        layer.route = undefined
        this.stack.push(layer)
    })

    return this
}

```
源码中为每个中间件函数都创建一个Layer实例，然后将layer实例推到Router的stack栈数组中。可以知道，中间件最后都是以layer实例存在于栈数组中的。

到这一步，我们总结一下中间件注册流程👇️

> 调用express()创建app对象，当调用app.use注册中间件时实际上是调用app._router.use方法，然后为中间件创建Layer实例，并将其推到app._router.stack栈数组中。

画个图看示例代码在执行完后的样子

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/f7c4e3153455406799222408bac82265~tplv-73owjymdk6-jj-mark:0:0:0:0:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzk4NDI4NTg3MDU4ODA5MyJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1723259476&x-orig-sign=3NgB8tL4uu4jQKPD3eSFcWro0Co%3D)


### 使用app[http_method]定义路由

`注：http_method指请求方法，例如get、post、delete、put等，下面假定HTTP方法只有上面列举的这四个。`

当使用以下方式定义路由时
```js
app.get('/user', fn4(req, res, next){}, fn5(req, res, next){})
app.post('/user', fn6(req, res, next){})
```
看看app[http_method]的源码实现
```js
['post', 'delete', 'get', 'put'].forEach(function(method) {
  app_proto[method] = function (path, ...fns) {
    this.lazyrouter();
    var route = this._router.route(path);
    route[method].apply(route, fns);
    return this
  }
})
```
很明显，app[http_method]每一次的调用，都会通过`app._router.route`创建一个Route实例，之后route[http_method]将中间件函数转化为Layer实例后推到route.stack中。

我们继续往下看Router的route函数源码实现
```js
router_proto.route = function(path) {
  var route = new Route(path);
  var layer = new Layer(path, route.dispatch.bind(route));
  layer.route = route;
  this.stack.push(layer);
  return route;
}
```
这个实现非常有意思，我把在这里创建的Layer实例叫做`分发层`，此时layer.handle为route.dispatch函数，它用于依次执行与请求路径和方法匹配的中间件和处理程序。最后，`分发层`被推到当前Router实例（在这里是app._router.stack）的stack中。

到这里总结一下👇️

> 以app.get为例，当调用app.get()时，会调用app._router.route，创建一个route实例，然后以route.dispatch作为中间件函数创建一个Layer实例，该Layer实例会被推到app._router.stack里面。之后，传入app.get的所有中间件函数会转发给route.get进一步处理，在里面会为每个中间件函数创建一个Layer实例，并将Layer实例推到route.stack栈中。当请求的url和`分发层`的path匹配并且`route.methods[req.method]`为true时，`分发层`的handle（route.dispatch）会被执行，在dispatch中用req.method依次匹配stack中的layer.method，匹配中了的话执行layer.handle

我们在上面注册中间件的图后面继续画上定义路由后的东西，箭头表示执行路径

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/c6e28141c41249e68c83c056091c43f0~tplv-73owjymdk6-jj-mark:0:0:0:0:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzk4NDI4NTg3MDU4ODA5MyJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1723259809&x-orig-sign=wRvDBxYeTUCDJ8hcTw5aIXI5%2FjU%3D)


### 使用Router划分功能模块

随着我们的业务越来越复杂，如果将所有中间件都堆在app对象上，那会让项目代码变得强耦合和无法维护。这个时候Router就派上用场了，我们可以给不同功能都创建一个Router实例，用Router实例去注册各自功能的中间件。用模块系统来理解就是，app对象是入口文件，每个Router实例都是子模块，它们起到一个隔离的作用，并且能将不同功能划分到不同的模块，降低耦合，便于维护。

假如我们现在想新增一个新闻模块，可以这样

```js
// news.router.js => 新闻模块
const newsRouter = new Router()
newsRouter.use(function fn7(req, res, next) {})
newsRouter.get('/:id', function fn8(req, res, next) {})
newsRouter.post('/add', function fn9(req, res, next) {})

modules.exporst = newsRouter

// index.js => 入口文件
var newsRouter = require('./news.router');
// 注册路由
app.use('/news', newsRouter)
```
首先是`newsRouter.use`，这是直接调用`router_proto.use`，本质上和app.use没什么不同，因为app.use背后也是调用`router_proto.use`。之后用中间件fn7创建一个Layer实例，并推到`newsRouter.stack`中。

不管是`newsRouter.get`还是`newsRouter.post`或者其他HTTP方法，本质上实现流程和`app.get`一样（可以看上面）只不过最后创建的`分发层`是被推到`newsRouter.stack`中。

在这最需要重点讲的是使用app.use注册newsRouter。上面在讲Router时，我们说过使用Router创建的router对象本身是一个中间件函数，而当使用app.use注册newsRouter中间件时，创建的Layer实例的handle就是newsRouter函数，这个Layer实例和上面app.get中创建的Layer实例一样，也把它称作`分发层`，将请求分发到路由的堆栈中执行。然后将`分发层`推到app._router.stack中。

在newsRouter函数内部中调用了`router_proto.handle`方法，它就是实现分发的关键，当前路由所在`分发层`被匹配中时，会间接执行`router_proto.handle`方法，从而将请求分发到newsRouter内部执行栈数组的匹配

```js
// 调用out相当于跳出当前router，回到上一级执行下一个layer
router_proto.handle = function(req, res, out) {
  var index = 0;
  var stack = this.stack;
  var removed = "";
  // 执行trim_prefix的目的是保证下一级拿到的req.url是在截掉当前layer.path的
  function  trim_prefix(layer, layerPath, path) {
    if(!path.startsWith(layerPath)) {
      next()
      return
    }
    // 将layerPath给到removed，表示要从请求URL中移除与当前层路径匹配的部分。
    removed = layerPath;
    // 更新req.url，只保留未匹配部分
    req.url = req.url.slice(removed.length);
    // 执行layer的handle
    layer.handle_request(req, res, next);
  }

  (function next() {
    // 恢复更改后的req.url，不然这一次匹配的req.url不完整
    if(removed.length !== 0) {
      req.url = removed + req.url;
      removed = "";
    }

    // 栈中没有layer可以匹配了，结束当前Router栈的匹配，返回上一级
    if(index >= stack.length) {
      done()
      return
    }
    // 从req.url中获取，路径path，例如，/user/info/123，不包含查询部分
    var path = req.url;
    var layer;
    var match;
    var route;

    while(match !== true && index < stack.length) {
      layer = stack[index++];
      match = layer.match_path(path);
      route = layer.route;
      // 没匹配中，下一个
      if(!match) continue;
      // 该层不是分发层
      if(!route) continue;
    }

    var layerPath = layer.path;

    if(route) {
      layer.handle_request(req, res, next);
    } else {
      trim_prefix(layer, layerPath, path);
    }
  })()
}
```

依次对router_proto.stack中的layer实例进行路径匹配，当匹配中的Layer实例的route存在（当前Layer是route的分发层），则调用，layer.handle_request执行handle函数，分发请求到route.dispatch中执行下一级的匹配。如果当前route不存在，则使用trim_prefix对请求路径进行截取，然后执行layer.handle_request。

到这里再总结一下Router划分功能的实现流程：

> 当创建一个Router实例router后，相当于创建一个app实例，只不过app实例多包了一层壳，能独立启动服务。然后使用app.use注册router中间件时，这时会用router中间件函数创建一个layer分发层，并将分发层推到app._router.stack栈顶，当应用启动并且请求来到时，会依次对app._router.stack执行匹配，当分发层的path与请求url匹配中时，会执行router中间件函数，而在router中间件函数中又执行了router_proto.handle函数，将请求下一步分发到router_proto.handle中执行router_proto.stack栈数组。

我在上面定义路由的基础上画上我们Router划分模块后的图，箭头表示执行路径


![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/8dd21d53862742339eeef9616c788829~tplv-73owjymdk6-jj-mark:0:0:0:0:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzk4NDI4NTg3MDU4ODA5MyJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1723261139&x-orig-sign=FahJdhAik8g81Ys%2F7ROItEewuUI%3D)


### 创建并应用一个route实例

这个场景其实也比较常见，有时在业务中，可能需要在一个请求路径上同时拥有针对增删改查的处理函数，那我们可以创建一个Route实例，简单方便。

```js
var route = new Route('/user')
route.post(fn10(req, res, next){}).delete(fn11(req, res, next){}).put(fn12(req, res, next){}).get(fn13(req, res, next){})
```
不过呢，单独这么使用，它并不会被执行，因为他不会被任何Router注册，所以，要让他生效还得这样。
```js

const layer = new Layer('/user', route.dispatch.bind(route));
layer.route = route;
// 注册到新的router实例中
const router = new Router();
router.stack.push(layer);
// 注册到app._router实例中
app._router.stack.push(layer);
```
额，这么搞看着都麻烦，所以一般都不直接用`Route`创建实例，而是会调用app.route或者router.route来创建

```js
var route = app.route('/api')
route.get(fn1).post(fn2).delete(fn3).put(fn4)

// 或者
var router = new Router()
var route = router.route('/userinfo')
route.get(fn1).post(fn2).delete(fn3).put(fn4)

app.use('/user', router) // router本身为中间件
```
这么做的好处是，在app.route和router.route中就实现了Route实例的自动注册。当调用app.route时，Route实例会被注册到app._router上，而使用router.route时，Route实例就被注册到对应的Router实例上。

```js
app_proto.route = function(path) {
  this.lazyrouter();
  return this._router.route(path);
}
```

```js
router_proto.route = function(path) {
  var route = new Route(path);
  var layer = new Layer(path, route.dispatch.bind(route));
  layer.route = route;
  this.stack.push(layer);
  return route;
}
```
和其他注册中间件和路由定义的方式一样，app.route内部调的还是router.route实例进行的，但是通过app来操作的话创建的layer是存放在app._router（主路由）实例的stack中，而使用其余Router实例来调用route()的话，则存放在各自Router实例的stack里面。


### 启动express应用

终于到这一步了，也是最关键的一步，只有启动应用，才能让服务跑起来，不然都白瞎。
```js
app.listen(3000)
```
平平无奇的一行代码，却是整个应用程序的关键
```js
app_proto.listen = function listen() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
}
```
在调用`http.createServer`时，本应该传请求处理函数的，结果传了个`this`，也就是传了app对象，最开始讲application时就说过，app本身也是一个中间件函数
```js
var app = function(req, res, next) {
  app.handle(req, res, next);
};
```
app.handle就是执行主路由（app._router）中stack数组的入口
```js
app.handle = function handle(req, res, callback) {
  var router = this._router;
  // 结束主路由执行的方法，也可能是因为报错
  var done =
    callback ||
    finalhandler(req, res, {
      env: this.get("env"),
      onerror: logerror.bind(this),
    });
  if (!router) {
    debug("no routes defined on app");
    done();
    return;
  }
  router.handle(req, res, done);
};
```
看到上面对router做了一下判断，没有的话直接调用了`done`，那什么时候没有app._stack呢？就是没有任何的中间件注册和路由定义，lazyRouter没有被调用过，这个在上面有仔细看的话就能明白为啥。然后调用了`router.handle`,这就打开了整个中间件执行流程的大门。


## 总结一下

整个express源码其实很简单易懂，全称围绕一个核心：Router，而app就是用Router包一个壳，具备启动服务的能力。

如果将expres应用程序看成一棵树，那说的上面app._router是一个树的主干，而其余根据功能模块创建的Router实例，可以看成是树的枝干，Route实例可以看成是树的枝丫（叶子节点所在的树枝），而每一个Layer则是树上的节点。整个express的执行流程有点类似树的深度优先遍历，匹配到谁执行对应中间件。



