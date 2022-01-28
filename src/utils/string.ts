import _ from 'lodash'

export const toPascalCase = (str: string) => {
  return _.upperFirst(_.camelCase(str))
}
