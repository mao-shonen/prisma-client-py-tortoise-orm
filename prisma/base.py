class User:
    class Meta:
        ordering = ['-id']

    class PydanticMeta:
        exclude = ['password']


class Post:
    pass


class Group:
    def ping(self) -> str:
        '''for test'''
        return 'pong'
