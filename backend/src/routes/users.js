import { getAllUsers, getUserById, createUser, deleteUser } from '../controllers/usersController.js';

const userSchema = {
  body: {
    type: 'object',
    required: ['nick', 'avatar'],
    properties: {
      nick: { type: 'string', minLength: 1 },
      avatar: { type: 'string', minLength: 1 }
    }
  }
};

export default async function routes(fastify) {
  fastify.get('/', getAllUsers);
  fastify.get('/:id', getUserById);
  fastify.post('/', { schema: userSchema }, createUser);
  fastify.delete('/:id', deleteUser);
  fastify.options('*', async (_, reply) => reply.send());
}
