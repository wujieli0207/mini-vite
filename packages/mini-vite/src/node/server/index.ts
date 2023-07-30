import connect from 'connect'
import { blue, green } from 'picocolors'
import { optimize } from '../optimizer'

export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = Date.now()

  app.listen(3000, () => {
    // 依赖预构建
    optimize(root)

    console.log(green('🚀 项目已启动'), `耗时：${Date.now() - startTime}ms`)

    console.log(`> 项目访问路径：${blue('http://localhost:3000')}`)
  })
}
