import type { Plugin } from 'esbuild'
import { BARE_IMPORT_RE, EXTERNAL_TYPES } from '../constants'

export function scanPlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:scan-deps',
    setup(build) {
      // 忽略的文件类型
      build.onResolve(
        { filter: new RegExp(`\\.(${EXTERNAL_TYPES})`) },
        (resolveInfo) => {
          return {
            path: resolveInfo.path,
            external: true, // 标记为忽略文件
          }
        }
      )
      // 记录依赖
      build.onResolve({ filter: BARE_IMPORT_RE }, (resolveInfo) => {
        const { path: id } = resolveInfo

        // 记录在 deps 中
        deps.add(id)

        return {
          path: id,
          external: true,
        }
      })
    },
  }
}
