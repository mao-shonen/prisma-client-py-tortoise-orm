class User:
    class Meta:
        exclude = ['password']


class Post:
    pass


class Group:
    def ping(self) -> str:
        '''for test'''
        return 'pong'
