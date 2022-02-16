import { DMMF } from '@prisma/generator-helper'
import { logger } from '@prisma/sdk'
import _ from 'lodash'
import { getLastItem, PyClass, PyType, toPascalCase, toPyValue } from '../utils'
import { config } from '../config'

enum FieldBaseType {
  String = 'String',
  Boolean = 'Boolean',
  Int = 'Int',
  BigInt = 'BigInt',
  Float = 'Float',
  Decimal = 'Decimal',
  DateTime = 'DateTime',
  Json = 'Json',
  Bytes = 'Bytes',
}

const getFieldType = (field: DMMF.Field): string => {
  if (field.kind === 'unsupported') {
    throw new Error(`not support unsupported field: ${field.kind}`)
  } else if (field.kind === 'enum') {
    return 'fields.CharEnumField'
  } else if (field.kind === 'object') {
    return 'fields.ForeignKeyField'
  } else if (field.kind === 'scalar') {
    switch (field.type) {
      case FieldBaseType.String:
        return 'fields.CharField'
      case FieldBaseType.Boolean:
        return 'fields.BooleanField'
      case FieldBaseType.Int:
        return 'fields.IntField'
      case FieldBaseType.BigInt:
        return 'fields.BigIntField'
      case FieldBaseType.Float:
        return 'fields.FloatField'
      case FieldBaseType.Decimal:
        return 'fields.DecimalField'
      case FieldBaseType.DateTime:
        return 'fields.DatetimeField'
      case FieldBaseType.Json:
        return 'fields.JSONField'
      case FieldBaseType.Bytes:
        return 'fields.BinaryField'
      default:
        throw new TypeError(`unknown field type: ${field.type}`)
    }
  } else {
    throw new TypeError(`unknown field type (kind): ${field.kind}`)
  }
}

const getPyClassName = (name: string): string => {
  return config.classNamePascalCase ? toPascalCase(name) : name
}

const getPyValueName = (name: string): string => {
  return config.valueNameSnakeCase ? _.snakeCase(name) : name
}

const getFieldEmoji = (field: DMMF.Field) => {
  switch (field.type) {
    case FieldBaseType.Int:
      return '🔟'
    case FieldBaseType.BigInt:
      return '🔟'
    case FieldBaseType.Float:
      return '🔟'
    case FieldBaseType.Decimal:
      return '🔟'
    case FieldBaseType.Boolean:
      return '✅'
    case FieldBaseType.String:
      return '🆎'
    case FieldBaseType.DateTime:
      return '🕑'
    case FieldBaseType.Bytes:
      return '💾'
    default:
      return '🪢'
  }
}

export const genModel = (
  model: DMMF.Model,
  ctx: { models: DMMF.Model[] },
): PyClass => {
  logger.info(`create model: ${model.name}`)

  const pyClassName = getPyClassName(model.name)

  const pyClass = new PyClass(pyClassName, ['Model'])
  let pyClassPKFieldName: string | undefined

  const pyClassDoc: string[] = model.documentation
    ? [`${model.documentation}\n`]
    : []

  pyClassDoc.push(`fields:`)

  /** 模型的關係字段列表
   *
   * tortoise orm 會自動關聯, 導致重複定義報錯
   * */
  const modelRelationFields: string[] = []
  model.fields.forEach((field) => {
    if (field.relationFromFields && field.relationFromFields.length > 0) {
      modelRelationFields.push(field.relationFromFields[0])
    }
  })

  model.fields.forEach((field) => {
    if (modelRelationFields.includes(field.name)) {
      return
    }

    logger.info(`create field: ${model.name}.${field.name}`)

    pyClass.fields.push({
      name: getPyValueName(field.dbNames ? field.dbNames[0] : field.name),
    })
    const pyField = pyClass.fields.slice(-1)[0] // get last item

    pyClassDoc.push(
      [
        `- ${getFieldEmoji(field)}`,
        field.isRequired && !field.isList && !field.hasDefaultValue
          ? ` *`
          : ` `,
        field.name,
        ` [${field.type}${field.isRequired ? '' : '?'}]`,
        field.isId ? ` 🔑` : ``,
        field.isUnique ? ` 📌` : ``,
      ].join(''),
    )

    let fieldDefault: PyType

    field.relationFromFields ??= []
    field.relationToFields ??= []

    // 不支援關係多目標字段
    if (
      field.relationFromFields.length > 1 ||
      field.relationToFields.length > 1
    ) {
      return logger.error('Multiple fields of relationships are not supported')
    }

    const isVirtualRelation =
      field.relationFromFields.length === 0 &&
      field.relationToFields.length === 0

    if (field.kind === 'object' && isVirtualRelation) {
      const relationClassName = getPyClassName(field.type as string)

      pyField.type = `fields.ReverseRelation[${toPyValue(relationClassName)}]`
    } else if (field.isList) {
      throw new Error('tortoise orm does not support field arrays')
    } else {
      pyField.value = {
        name: getFieldType(field),
        args: [],
      }

      if (field.isId) {
        pyClassPKFieldName = getPyValueName(field.name)

        pyField.value.args.push({
          name: 'pk',
          value: true,
        })

        // 如果不是自增, 顯式定義 generated=False
        const fieldIsNum =
          field.type === FieldBaseType.Int ||
          field.type === FieldBaseType.BigInt

        if (fieldIsNum) {
          const fieldIsAutoIncrement =
            typeof field.default === 'object' &&
            field.default.name === 'autoincrement'

          if (fieldIsAutoIncrement) {
            fieldDefault = 'auto_increment()'
          } else {
            pyField.value.args.push({
              name: 'generated',
              value: false,
            })
          }
        }
      }

      // enum
      if (field.kind === 'enum') {
        pyField.value.args.push({
          name: 'enum_type',
          value: field.type as string,
          valueIsObject: true,
        })
      }

      // relation
      else if (field.kind === 'object') {
        const relationName = getPyClassName(field.type as string)

        // To know the relationship type, look for the reverse definition of the relationship model
        const toModel = ctx.models.find((model) => model.name === field.type)
        if (!toModel) {
          return logger.error(`Relational model not found: ${field.type}`)
        }
        const toField = toModel.fields.find(
          (_field) =>
            _field.type === model.name &&
            _field.relationFromFields?.length === 0 &&
            _field.relationToFields?.length === 0,
        )
        if (!toField) {
          return logger.error(
            `Relational field not found: ${field.relationToFields?.[0]}`,
          )
        }

        if (toField?.isList) {
          pyField.value.name = 'fields.ForeignKeyField'
        } else {
          pyField.value.name = 'fields.OneToOneField'
        }

        // fix python type check
        const relationNameType = `typing.Union[${toPyValue(
          relationName,
        )}, typing.Any]`

        if (toField?.isList) {
          pyField.type = `fields.ForeignKeyRelation[${relationNameType}]`
        } else {
          pyField.type = `fields.OneToOneRelation[${relationNameType}]`
        }

        // find relationFromField, Because maybe it used an alias
        //? This is meaningless for the time being, the map flag of the source field is invalid, maybe this is a bug?
        const relationFromField = model.fields.find(
          (_field) => _field.name === field.relationFromFields?.[0],
        )
        if (!relationFromField) {
          throw new Error(
            `model relation field [${field.name}] not found source field [${field.relationFromFields[0]}]`,
          )
        }

        const relationFromFieldName = relationFromField.dbNames
          ? relationFromField.dbNames[0]
          : relationFromField.name
        // tortoise orm 默認會使用 _id 的字段
        if (relationFromFieldName !== `${pyField.name}_id`) {
          pyField.value.args.push({
            name: 'source_field',
            value: relationFromFieldName,
          })
        }

        pyField.value.args.push({
          name: 'model_name',
          value: `${config.appName}.${relationName}`,
        })

        pyField.value.args.push({
          name: 'to_field',
          value: field.relationToFields[0],
        })

        pyField.value.args.push({
          name: 'related_name',
          // value: field.relationName,
          value: _.snakeCase(`${model.name}_${pyField.name}`),
        })

        enum relationOnDelete {
          NoAction = 'NoAction',
          Cascade = 'Cascade',
          Restrict = 'Restrict',
          SetNull = 'SetNull',
          SetDefault = 'SetDefault',
        }

        if (
          field.relationOnDelete &&
          field.relationOnDelete !== relationOnDelete.NoAction
        ) {
          pyField.value.args.push({
            name: 'on_delete',
            // fields.CASCADE | fields.RESTRICT | fields.SET_NULL | fields.SET_DEFAULT
            value: `fields.${_.snakeCase(
              field.relationOnDelete,
            ).toUpperCase()}`,
            valueIsObject: true,
          })
        }
      }

      // base type
      else if (field.kind === 'scalar') {
        if (field.type === FieldBaseType.String) {
          pyField.value.args.push({
            name: 'max_length',
            value: 255,
          })
        }

        if (field.type === FieldBaseType.Decimal) {
          pyField.value.args.push({
            name: 'max_digits',
            value: 12,
          })
          pyField.value.args.push({
            name: 'decimal_places',
            value: 2,
          })
        }
      }

      // unsupported
      else if (field.kind === 'unsupported') {
        return logger.error(`not support kind: unsupported`)
      }

      // unknown kind
      else {
        return logger.error(`unknown field kind: ${field.kind}`)
      }

      // default value
      if (field.hasDefaultValue) {
        if (typeof field.default === 'object') {
          if (field.default.name === 'autoincrement') {
            if (field.isId) {
              //! tortoise-orm default behavior
            } else if (
              field.type === FieldBaseType.Int ||
              field.type === FieldBaseType.BigInt
            ) {
              pyField.value.args.push({
                name: 'auto_increment()',
                value: true,
              })
              pyField.value.args.push({
                name: 'generated',
                value: true,
              })
            }
          } else if (field.default.name === 'now') {
            if (field.type === FieldBaseType.DateTime) {
              fieldDefault = 'now()'
              pyField.value.args.push({
                name: 'auto_now_add',
                value: true,
              })
            }
          } else if (field.default.name === 'dbgenerated') {
            pyField.value.args.push({
              name: 'generated',
              value: true,
            })
          } else if (field.default.name === 'cuid') {
            fieldDefault = 'cuid()'
            // 還沒寫
          } else if (field.default.name === 'uuid') {
            fieldDefault = 'uuid()'
            // 還沒寫
          } else {
            logger.warn(
              `not support prisma default option: ${field.default.name}`,
            )
          }
        } else if (field.kind === 'enum') {
          fieldDefault = `${field.type}.${field.default}`
          pyField.value.args.push({
            name: 'default',
            value: fieldDefault,
            valueIsObject: true,
          })
        } else {
          if (field.type === FieldBaseType.BigInt) {
            // fix bigint default "0"
            fieldDefault = parseFloat(field.default as string)
          } else {
            fieldDefault = field.default
          }

          pyField.value.args.push({
            name: 'default',
            value: toPyValue(fieldDefault),
            valueIsObject: true,
          })
        }
      }

      // updatedAt
      if (field.isUpdatedAt) {
        fieldDefault ? `${fieldDefault} @update` : '@update'
        if (field.type === FieldBaseType.DateTime) {
          pyField.value.args.push({
            name: 'auto_now',
            value: true,
          })
        }
      }

      // other args
      if (field.isUnique) {
        pyField.value.args.push({
          name: 'unique',
          value: true,
        })
      }

      if (!field.isRequired) {
        pyField.value.args.push({
          name: 'null',
          value: true,
        })
      }

      // doc post-processing
      if (fieldDefault) {
        pyClassDoc.push(`  - default: ${fieldDefault}`)
      }

      if (field.documentation) {
        pyClassDoc.push(`  - doc: ${field.documentation}`)

        pyField.value.args.push({
          name: 'description',
          value: field.documentation,
        })
      }
    }
  })

  // meta
  pyClass.subClasses.push(new PyClass('Meta'))
  const meta = getLastItem(pyClass.subClasses)

  meta.fields.push({
    name: 'table',
    value: model.dbName ?? model.name,
  })

  // __str__
  pyClass.methods.push({
    name: '__str__',
    args: [{ name: 'self' }],
    returnType: 'str',
  })
  const pyClassMethodStr = pyClass.methods.slice(-1)[0]
  pyClassMethodStr.content = []
  pyClassMethodStr.content.push(
    [
      `return f'${pyClassName}`,
      pyClassPKFieldName ? `<{self.${pyClassPKFieldName}}>` : '',
      `'`,
    ].join(''),
  )

  pyClass.doc = pyClassDoc
  return pyClass
}
