import _ from 'lodash'

export const toPascalCase = (str: string): string => {
  return _.upperFirst(_.camelCase(str))
}

export const toBoolean = (str: string): boolean => {
  switch (str.toLowerCase().trim()) {
    case 'true':
    case 'no':
    case '1':
      return true
    default:
      return false
  }
}
