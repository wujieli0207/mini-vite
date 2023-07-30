import type { Plugin, Loader } from 'esbuild'
import createDebug from 'debug'
import resolve from 'resolve'
import { init, parse } from 'es-module-lexer'
import fs from 'fs-extra'
import path from 'path'

import { BARE_IMPORT_RE } from '../constants'
import { normalizePath } from '../utils'

const debug = createDebug('dev')

export function preBundlePlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:pre-bundle',
    setup(build) {
      build.onResolve({ filter: BARE_IMPORT_RE }, (resolveInfo) => {
        const { path: id, importer } = resolveInfo
        const isEntry = !importer
        // 命中需要预编译的依赖
        if (deps.has(id)) {
          return isEntry
            ? {
                path: id,
                namespace: 'dep',
              }
            : {
                // onResolve 钩子，此时是绝对路径
                path: resolve.sync(id, { basedir: process.cwd() }),
              }
        }
      })

      // 拿到标记后的依赖，构造代理模块，交给。esbuild 打包
      build.onLoad({ filter: /.*/, namespace: 'dep' }, async (loadInfo) => {
        await init
        const { path: id } = loadInfo
        const root = process.cwd()
        const entryPath = normalizePath(resolve.sync(id, { basedir: root }))
        const code = await fs.readFile(entryPath, 'utf-8')
        const [imports, exports] = parse(code)
        let proxyModule = []

        // CommonJS
        if (!imports.length && !exports.length) {
          // 构造代理模块
          // 通过 require 拿到模块到处对象
          const res = require(entryPath)
          // 通过 Object.keys 拿到所有具名导出
          const specifiers = Object.keys(res)
          // 构造 export 语句交给 Esbuild 打包
          proxyModule.push(
            `export { ${specifiers.join(',')} } from "${entryPath}"`,
            `export default require("${entryPath}")`
          )
        }
        // ESModule
        else {
          if (exports.some((e) => e.n === 'default')) {
            proxyModule.push(`import d from "${entryPath}"; export default d`)
          }
          proxyModule.push(`export * from "${entryPath}"`)
        }
        debug('代理模块内容：%o', proxyModule.join('\n'))

        const loader = path.extname(entryPath).slice(1)

        return {
          loader: loader as Loader,
          contents: proxyModule.join('\n'),
          resolveDir: root,
        }
      })
    },
  }
}
