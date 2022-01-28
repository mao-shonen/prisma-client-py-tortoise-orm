import type { DMMF } from '@prisma/generator-helper'
import { PyClass } from '../utils'

export const genEnum = (modelEenum: DMMF.DatamodelEnum): PyClass => {
  const pyClass = new PyClass(modelEenum.name, ['str', 'Enum'])

  const pyClassDoc: string[] = modelEenum.documentation
    ? [`${modelEenum.documentation}\n`]
    : []

  modelEenum.values.forEach((value) => {
    pyClassDoc.push(`- ${value.name}`)

    pyClass.fields.push({
      name: value.name,
      value: value.name,
    })
  })

  pyClass.doc = pyClassDoc

  return pyClass
}
