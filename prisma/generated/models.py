__doc__ = '''
This file is generated by the `prisma-client-py-tortoise-orm (0.1.0)`,
Please do not modify directly.

repository: https://github.com/mao-shonen/prisma-client-py-tortoise-orm
'''

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