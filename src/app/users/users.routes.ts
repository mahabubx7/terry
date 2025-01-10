import { Request, Response } from 'express';
import { ModuleRoutes } from '../../lib/openapi';
import { CreateUserSchema, UpdateUserSchema, UserListResponseSchema, UserResponseSchema } from './users.schema';
import { randomUUID } from 'crypto';

// Mock data store
const users: any[] = [];

const routes: ModuleRoutes = [
  {
    method: 'get',
    path: '/',
    schema: {
      response: UserListResponseSchema,
    },
    handler: async (req: Request, res: Response) => {
      return users;
    },
    summary: 'List all users',
    description: 'Retrieve a list of all users',
  },
  {
    method: 'post',
    path: '/',
    schema: {
      body: CreateUserSchema,
      response: UserResponseSchema,
    },
    handler: async (req: Request, res: Response) => {
      const user = {
        id: randomUUID(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(user);
      return user;
    },
    summary: 'Create a new user',
    description: 'Create a new user with the provided data',
  },
  {
    method: 'get',
    path: '/:id',
    schema: {
      response: UserResponseSchema,
    },
    handler: async (req: Request, res: Response) => {
      const user = users.find(u => u.id === req.params.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      return user;
    },
    summary: 'Get a user by ID',
    description: 'Retrieve a specific user by their ID',
  },
  {
    method: 'put',
    path: '/:id',
    schema: {
      body: UpdateUserSchema,
      response: UserResponseSchema,
    },
    handler: async (req: Request, res: Response) => {
      const index = users.findIndex(u => u.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      users[index] = {
        ...users[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      return users[index];
    },
    summary: 'Update a user',
    description: 'Update an existing user with the provided data',
  },
  {
    method: 'delete',
    path: '/:id',
    handler: async (req: Request, res: Response) => {
      const index = users.findIndex(u => u.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      users.splice(index, 1);
      res.status(204).send();
    },
    summary: 'Delete a user',
    description: 'Delete an existing user',
  },
];

module.exports = routes;
module.exports.default = routes; 