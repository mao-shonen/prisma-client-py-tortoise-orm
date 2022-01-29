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

- Since the prisma sdk only provides the information needed to build the client, Please don't use torroise orm to create table.

- not support composite key

## Not yet supported feature notes

1. [ ] unsupported type field
2. [ ] uuid
3. [ ] model default cuid()
4. [ ] model create/update helper
5. [ ] Implicit m2m relationship

## Generator options

- `modelsFile`
  - `type`: string
  - `default`: 'models.py'
  - `desc`: generated file name
- `appName`
  - `type`: string
  - `default`: 'models'
  - `desc`: tortoise orm app config
  - `example`:
    ```py
    # tortoise orm config
    config = {
      'apps': {
          'my_app': { # <- this name `my_app`
              'models': ['__main__'],
              'default_connection': 'default',
          }
      },
      ...other
    ```
- `classNamePascalCase`
  - `type`: boolean
  - `default`: true
  - `desc`: DB model name convert to PascalCase for python naming style
- `valueNameSnakeCase`
  - `type`: boolean
  - `default`: true
  - `desc`: DB field name convert to SnakeCase for python naming style
- `createPyPackageInitFile`
  - `type`: boolean
  - `default`: true
  - `desc`: Generate folder automatically create \_\_init\_\_.py if it does not exist

## Generate example

`schema.prisma`

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "node ./dist/index.mjs"
  output   = "./generated"
}

/// model comment
model User {
  /// field comment
  id          Int      @id @default(autoincrement())
  email       String   @unique
  weight      Float?
  is18        Boolean?
  name        String?
  wallet      Decimal
  successorId Int?     @unique
  successor   User?    @relation("BlogOwnerHistory", fields: [successorId], references: [id])
  predecessor User?    @relation("BlogOwnerHistory")
  role        Role     @default(USER)
  posts       Post[]
  biography   Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt @db.DateTime(0)
}

model Post {
  id     Int   @id @default(autoincrement())
  user   User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  userId Int?
}

enum Role {
  USER
  ADMIN
}
```

`models.py`

```py
import typing
from enum import Enum
from tortoise import fields
from tortoise.models import Model

class Role(str,Enum):
    '''
    - USER
    - ADMIN
    '''
    USER = 'USER'
    ADMIN = 'ADMIN'

class User(Model):
    '''
    model comment

    fields:
    - 🔟 id [Int] 🔑
      - default: auto_increment()
      - doc: field comment
    - 🆎 *email [String] 📌
    - 🔟 weight [Float?]
    - ✅ is18 [Boolean?]
    - 🆎 name [String?]
    - 🔟 *wallet [Decimal]
    - 🪢 successor [User?]
    - 🪢 predecessor [User?]
    - 🪢 role [Role]
      - default: Role.USER
    - 🪢 posts [Post]
    - 🪢 *biography [Json]
    - 🕑 createdAt [DateTime]
      - default: now()
    - 🕑 *updatedAt [DateTime]
    '''
    id = fields.IntField(pk=True, description='field comment')
    email = fields.CharField(max_length=255, unique=True)
    weight = fields.FloatField(null=True)
    is_18 = fields.BooleanField(null=True)
    name = fields.CharField(max_length=255, null=True)
    wallet = fields.DecimalField(max_digits=12, decimal_places=2)
    successor: fields.OneToOneRelation[typing.Union['User', typing.Any]] = fields.OneToOneField(source_field='successorId', model_name='models.User', to_field='id', related_name='user_successor', null=True)
    predecessor: fields.ReverseRelation['User']
    role = fields.CharEnumField(enum_type=Role, default=Role.USER)
    posts: fields.ReverseRelation['Post']
    biography = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = 'User'

    def __str__(self) -> str:
        return f'User<{self.id}>'

class Post(Model):
    '''
    fields:
    - 🔟 id [Int] 🔑
      - default: auto_increment()
    - 🪢 user [User?]
    '''
    id = fields.IntField(pk=True)
    user: fields.ForeignKeyRelation[typing.Union['User', typing.Any]] = fields.ForeignKeyField(source_field='userId', model_name='models.User', to_field='id', related_name='post_user', on_delete=fields.SET_NULL, null=True)

    class Meta:
        table = 'Post'

    def __str__(self) -> str:
        return f'Post<{self.id}>'

__all__ = ['Role', 'User', 'Post']
```
