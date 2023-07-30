import { green } from 'picocolors'
import { build } from 'esbuild'
import path from 'path'
import { scanPlugin } from './scanPlugin'
import { PRE_BUNDLE_DIR } from '../constants'
import { preBundlePlugin } from './preBundlePlugin'

export async function optimize(root: string) {
  // 1. 确定入口
  const entry = path.resolve(root, 'src/main.tsx')
  // 2. 从入口依赖扫描
  const deps = new Set<string>()
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)],
  })

  console.log(
    `${green('📦 需要预构建的依赖')}:\n${[...deps]
      .map(green)
      .map((item) => `  ${item}`)
      .join('\n')}
  
  `
  )
  // 3. 依赖预构建
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)],
  })
}
