import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/node/cli.ts',
  },
  // 产物格式
  format: ['cjs', 'esm'],
  // 目标语法
  target: 'es2020',
  // 生成 source map
  sourcemap: true,
  // 关闭拆包能力
  splitting: false,
})
