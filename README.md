# CacheDemo
browser cache demo

# 安装依赖
npm i nodemon -g
# 启动
nodemon index
# 路由
|模式|地址|
|-|-|
|不开启缓存|[localhost:7729/](localhost:7729/)|
|开启强缓存标识Expires|[localhost:7729/expires](localhost:7729/expires)|
|开启强缓存标识Cache-Control|[localhost:7729/cacheControl](localhost:7729/cacheControl)|
|开启协商缓存标识Last-Modified|[localhost:7729/lastModified](localhost:7729/lastModified)|
|开启协商缓存标识Etag|[localhost:7729/etag](localhost:7729/etag)|
