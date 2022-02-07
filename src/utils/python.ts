export const getPyIndent = (level: number) => '    '.repeat(level)

export type PyType = number | boolean | string | null | undefined

/** convert to python value */
export const toPyValue = (value: PyType): string => {
  switch (typeof value) {
    case 'number':
      return String(value)
    case 'boolean':
      return value ? 'True' : 'False'
    case 'string':
      return `'${value.replaceAll(`'`, `\\'`)}'`
    case 'undefined':
      return 'None'
    default:
      if (value === null) {
        return 'None'
      } else {
        throw new TypeError(value)
      }
  }
}

export interface PyArg {
  name?: string
  value: PyType | PyCallFunc
  valueIsObject?: boolean
}

export interface PyCallFunc {
  name: string
  args: PyArg[]
}

export interface PyVarDeclare {
  name: string
  type?: string
  value?: string | PyCallFunc
}

export interface PyFuncDeclare {
  name: string
  args: PyVarDeclare[]
  doc?: string
  content?: string[]
  async?: boolean
  returnType?: string
}

const genCallFunc = (func: PyCallFunc): string => {
  const args: string = func.args
    .map((arg) => {
      const text = []

      if (arg.name) {
        text.push(`${arg.name}=`)
      }

      if (arg.value && typeof arg.value === 'object') {
        text.push(genCallFunc(arg.value))
      } else if (arg.valueIsObject) {
        text.push(String(arg.value))
      } else {
        text.push(toPyValue(arg.value))
      }

      return text.join('')
    })
    .join(', ')

  return `${func.name}(${args})`
}

const genValue = (value: PyVarDeclare): string => {
  const text = [value.name]

  if (value.type) {
    text.push(`: ${value.type}`)
  }

  if (value.value) {
    if (typeof value.value === 'string') {
      text.push(` = ${toPyValue(value.value)}`)
    } else {
      text.push(` = ${genCallFunc(value.value)}`)
    }
  }

  return text.join('')
}

export class PyClass {
  name: string
  extends?: string[]
  doc?: string | string[]
  fields: PyVarDeclare[] = []
  methods: PyFuncDeclare[] = []
  subClasses: PyClass[] = []

  constructor(name: string, _extends?: string[]) {
    this.name = name
    this.extends = _extends
  }

  generate(): string {
    const content: string[] = []

    // declare
    content.push(
      [
        `class ${this.name}`,
        this.extends ? `(${this.extends.join(',')})` : ``,
        ':',
      ].join(''),
    )

    // doc
    if (this.doc) {
      content.push(`'''`)

      let docs: string
      if (typeof this.doc === 'string') {
        docs = this.doc
      } else if (Array.isArray(this.doc)) {
        docs = this.doc.join('\n')
      } else {
        throw new TypeError()
      }
      content.push(
        docs
          .split('\n')
          .map((text, index) => (index === 0 ? text : getPyIndent(1) + text))
          .join('\n'),
      )

      content.push(`'''`)
    }

    // pass
    if (this.fields.length === 0 && this.methods.length === 0) {
      content.push('pass')
    }

    // fields
    this.fields.forEach((field) => {
      content.push(genValue(field))
    })

    // subClasses
    this.subClasses.forEach((subClass) => {
      content.push('') // \n
      content.push(
        subClass
          .generate()
          .split('\n')
          .map((val, index) => (index === 0 ? val : getPyIndent(1) + val))
          .join('\n'),
      )
    })

    // mathods
    this.methods.forEach((method) => {
      content.push('') // \n
      const methodName = [
        method.async ? 'async' : '',
        `def ${method.name}`,
        `(${method.args.map((arg) => genValue(arg))})`,
        method.returnType ? ` -> ${method.returnType}` : '',
        ':',
      ].join('')
      content.push(methodName)

      if (method.content === undefined) {
        content.push(getPyIndent(1) + 'pass')
        return
      }

      method.content.forEach((len) => {
        content.push(getPyIndent(1) + len)
      })
    })

    return content
      .map((len, index) => (index === 0 ? len : getPyIndent(1) + len))
      .join('\n')
  }
}
