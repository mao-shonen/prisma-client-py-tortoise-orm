import _ from 'lodash'

interface GeneratorConfig {
  modelsFile: string
  appName: string
  classNamePascalCase: boolean
  valueNameSnakeCase: boolean
  createPyPackageInitFile: boolean
}

export const config: GeneratorConfig = {
  modelsFile: 'models.py',
  appName: 'models',
  classNamePascalCase: true,
  valueNameSnakeCase: true,
  createPyPackageInitFile: true,
}

export const updateConfig = (configOverlay: { [key: string]: any }): void => {
  Object.assign(
    config,
    Object.entries(configOverlay).forEach(([key, value]) => {
      switch (typeof config[key as keyof GeneratorConfig]) {
        case 'string':
          Object.assign(config, { [key]: value })
          break
        case 'boolean':
          Object.assign(config, { [key]: _.isBoolean(value) })
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
