import { Request, Response } from 'express';
import { ModuleRoutes } from '../../lib/openapi';
import { 
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoListResponse,
  TodoResponse,
  TodoParams,
  TodoQuery
} from './todos.schema';
import { randomUUID } from 'crypto';

// Mock data store
const todos: any[] = [];

const routes: ModuleRoutes = [
  {
    method: 'get',
    path: '/',
    schema: {
      query: TodoQuery,
      response: TodoListResponse
    },
    handler: async (req: Request, res: Response) => {
      let filteredTodos = [...todos];
      
      if (req.query.completed !== undefined) {
        filteredTodos = filteredTodos.filter(todo => todo.completed === req.query.completed);
      }
      
      if (req.query.userId) {
        filteredTodos = filteredTodos.filter(todo => todo.userId === req.query.userId);
      }
      
      return filteredTodos;
    },
    summary: 'List todos',
    description: 'Get a list of todos with optional filters',
    tags: ['Todos']
  },
  {
    method: 'post',
    path: '/',
    schema: {
      body: CreateTodoRequest,
      response: TodoResponse
    },
    handler: async (req: Request, res: Response) => {
      const todo = {
        id: randomUUID(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      todos.push(todo);
      return todo;
    },
    summary: 'Create todo',
    description: 'Create a new todo',
    tags: ['Todos']
  },
  {
    method: 'get',
    path: '/:id',
    schema: {
      params: TodoParams,
      response: TodoResponse
    },
    handler: async (req: Request, res: Response) => {
      const todo = todos.find(t => t.id === req.params.id);
      if (!todo) {
        res.status(404).json({ message: 'Todo not found' });
        return;
      }
      return todo;
    },
    summary: 'Get todo',
    description: 'Get a todo by ID',
    tags: ['Todos']
  },
  {
    method: 'put',
    path: '/:id',
    schema: {
      params: TodoParams,
      body: UpdateTodoRequest,
      response: TodoResponse
    },
    handler: async (req: Request, res: Response) => {
      const index = todos.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ message: 'Todo not found' });
        return;
      }
      todos[index] = {
        ...todos[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      return todos[index];
    },
    summary: 'Update todo',
    description: 'Update an existing todo',
    tags: ['Todos']
  },
  {
    method: 'delete',
    path: '/:id',
    schema: {
      params: TodoParams
    },
    handler: async (req: Request, res: Response) => {
      const index = todos.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ message: 'Todo not found' });
        return;
      }
      todos.splice(index, 1);
      res.status(204).send();
    },
    summary: 'Delete todo',
    description: 'Delete an existing todo',
    tags: ['Todos']
  }
];

module.exports = routes;
module.exports.default = routes; 