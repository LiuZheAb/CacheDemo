const Koa = require('koa')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const mimes = {
    css: 'text/css',
    less: 'text/css',
    gif: 'image/gif',
    html: 'text/html',
    ico: 'image/x-icon',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    js: 'text/javascript',
    json: 'application/json',
    pdf: 'application/pdf',
    png: 'image/png',
    svg: 'image/svg+xml',
    swf: 'application/x-shockwave-flash',
    tiff: 'image/tiff',
    txt: 'text/plain',
    wav: 'audio/x-wav',
    wma: 'audio/x-ms-wma',
    wmv: 'video/x-ms-wmv',
    xml: 'text/xml',
}

// 获取文件的类型
function parseMime(url) {
    // path.extname获取路径中文件的后缀名
    let extName = path.extname(url)
    extName = extName ? extName.slice(1) : 'unknown'
    return mimes[extName]
}

// 将文件转成传输所需格式
const parseStatic = (dir) => {
    return new Promise((resolve) => {
        resolve(fs.readFileSync(dir), 'binary')
    })
}

// 获取文件信息
const getFileStat = (path) => {
    return new Promise((resolve) => {
        fs.stat(path, (_, stat) => {
            resolve(stat)
        })
    })
}

let type = '';
const app = new Koa()
app.use(async (ctx) => {
    const url = ctx.request.url;
    const resetType = () => {
        setTimeout(() => {
            type = ''
        }, 100);
    }
    if (['/', '/expires', '/cacheControl', '/lastModified', '/etag'].includes(url)) {
        ctx.set('Content-Type', 'text/html')
        type = url.replace('/', '');
        resetType();
        ctx.body = await parseStatic('./index.html')
    } else if (url === '/favicon.ico') {
        ctx.body = ''
    } else {
        const filePath = path.resolve(__dirname, `.${url}`)
        // 设置类型
        ctx.set('Content-Type', parseMime(url))
        switch (type) {
            // 强缓存
            case 'expires':
                // 设置 Expires 响应头
                const time = new Date(Date.now() + 5000).toUTCString()
                ctx.set('Expires', time)
                ctx.body = await parseStatic(filePath)
                break;
            // 强缓存
            case 'cacheControl':
                // 设置 Cache-Control 响应头
                ctx.set('Cache-Control', 'max-age=5')
                ctx.body = await parseStatic(filePath)
                break;
            // 协商缓存
            case 'lastModified':
                const ifModifiedSince = ctx.request.header['if-modified-since']
                const fileStat = await getFileStat(filePath)
                ctx.set('Cache-Control', 'no-cache')
                ctx.set('Content-Type', parseMime(url))
                // 比对时间，mtime为文件最后修改时间
                if (ifModifiedSince === fileStat.mtime.toGMTString()) {
                    ctx.status = 304
                } else {
                    ctx.set('Last-Modified', fileStat.mtime.toGMTString())
                    ctx.body = await parseStatic(filePath)
                }
                break;
            // 协商缓存
            case 'etag':
                const fileBuffer = await parseStatic(filePath)
                const ifNoneMatch = ctx.request.header['if-none-match']
                // 生产内容hash值
                const hash = crypto.createHash('md5')
                hash.update(fileBuffer)
                const etag = `"${hash.digest('hex')}"`
                ctx.set('Cache-Control', 'no-cache')
                ctx.set('Content-Type', parseMime(url))
                // 对比hash值
                if (ifNoneMatch === etag) {
                    ctx.status = 304
                } else {
                    ctx.set('Etag', etag)
                    ctx.body = fileBuffer
                }
                break;
            default:
                ctx.body = await parseStatic(filePath)
                break;
        }
    }
})

app.listen(7729, () => {
    console.log('start at port 7729')
})