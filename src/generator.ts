import fs from 'fs'
import path from 'path'
import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import { logger } from '@prisma/sdk'
import { genEnum } from './helpers/genEnum'
import { genModel } from './helpers/genModel'
import { writeFileSafely, toPyValue } from './utils'
import { name, version } from '../package.json'
import { config, updateConfig } from './config'
import { template } from './template'

generatorHandler({
  onManifest() {
    logger.info(`${name}:Registered`)
    return {
      version,
      defaultOutput: './generated',
      prettyName: name,
    }
  },
  onGenerate: async (options: GeneratorOptions) => {
    updateConfig(options.generator.config)

    const lens: string[] = [template]

    const pyImportAll: string[] = []

    // DB enum
    options.dmmf.datamodel.enums.forEach(async (enumInfo) => {
      const enumPyModel = genEnum(enumInfo)
      pyImportAll.push(enumPyModel.name)
      lens.push(genEnum(enumInfo).generate() + '\n')
    })

    // DB model
    options.dmmf.datamodel.models.forEach(async (model) => {
      const pyModel = genModel(model, { models: options.dmmf.datamodel.models })
      pyImportAll.push(pyModel.name)
      lens.push(pyModel.generate() + '\n')
    })

    // __all__
    const pyImportAllNames = pyImportAll
      .map((objName) => toPyValue(objName))
      .join(', ')
    lens.push(`__all__ = [${pyImportAllNames}]`)

    // write models.py
    await writeFileSafely(
      path.join(options.generator.output?.value as string, config.modelsFile),
      lens.join('\n'),
    )

    // write __init__.py
    if (config.createPyPackageInitFile) {
      const initPath = path.join(
        options.generator.output?.value as string,
        '__init__.py',
      )
      if (!fs.existsSync(initPath)) {
        await writeFileSafely(initPath, '')
      }
    }
  },
})
