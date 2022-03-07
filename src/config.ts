import _ from 'lodash'
import { toBoolean } from './utils'

interface GeneratorConfig {
  modelsFile: string
  appName: string
  classNamePascalCase: boolean
  valueNameSnakeCase: boolean
  createPyPackageInitFile: boolean
  sourceClassFile: string
}

export const config: GeneratorConfig = {
  modelsFile: 'models.py',
  appName: 'models',
  classNamePascalCase: true,
  valueNameSnakeCase: true,
  createPyPackageInitFile: true,
  sourceClassFile: './prisma/base.py',
}

export const updateConfig = (configOverlay: { [key: string]: any }): void => {
  return Object.assign(
    config,
    Object.entries(configOverlay).forEach(([key, value]) => {
      switch (typeof config[key as keyof GeneratorConfig]) {
        case 'string':
          Object.assign(config, { [key]: value })
          break
        case 'boolean':
          Object.assign(config, { [key]: toBoolean(value) })
          break
        case 'number':
          Object.assign(config, { [key]: _.toNumber(value) })
          break
        default:
          throw new Error('no such option type')
      }
    }),
  )
}
