from tortoise.contrib import test
from prisma.generated.models import *


class TestCrud(test.TestCase):
    async def test_create_user(self, email: str = 'user@example.com'):
        return await User.create(email=email, wallet=100, biography=[])

    async def test_create_post(self):
        return await Post.create()

    async def test_create_optional_params(self):
        return await User.create(
            email='user@example.com',
            wallet=100,
            biography=[],
            waight=50.0,
            is18=True,
            name='Peter',
        )

    async def test_enum(self):
        user = await self.test_create_user()
        await user.update_from_dict({'role': Role.USER})

    async def test_relation_o2o(self):
        user1 = await self.test_create_user(email='user1@example.com')
        user2 = await self.test_create_user(email='user2@example.com')
        await user1.update_from_dict({'successor_id': user2.id})

    async def test_relation_m2o(self):
        user = await self.test_create_user()
        post = await self.test_create_post()
        await post.update_from_dict({'user_id': user.id})
