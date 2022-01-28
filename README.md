# prisma-client-py-tortoise-orm

this [prisma](https://github.com/prisma/prisma) client generator for Python [Tortoise ORM](https://github.com/tortoise/tortoise-orm)

## Getting Started

1. Setup prisma

[Prisma Doc](https://www.prisma.io/docs/getting-started)

2. Install

```bash
// use npm
npm install --save-dev prisma-client-py-tortoise-orm
// or yarn
yarn add -D prisma-client-py-tortoise-orm
```

3. Add the generator to the schema

```prisma
generator graphql {
  provider = "prisma-client-py-tortoise-orm"
  classNamePascalCase = true
  valueNameSnakeCase = true
}
```

4. Run generation

```bash
npx prisma generate
```

5. check generated

## Limitations

1. > Since the prisma sdk only provides the information needed to build the client,
   > Please don't use torroise orm to create table.

2. > not support composite key

## Not yet supported feature notes

1. [ ] unsupported type field
2. [ ] uuid
3. [ ] model default cuid()
4. [ ] model create/update helper
5. [ ] Implicit m2m relationship
