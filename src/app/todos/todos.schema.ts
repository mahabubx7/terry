import { z } from 'zod';

// Base schema with clean name
export const Todo = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Todo');

// Request schemas
export const CreateTodoRequest = Todo.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).openapi('CreateTodo');

export const UpdateTodoRequest = Todo.partial().omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).openapi('UpdateTodo');

// Response schemas
export const TodoResponse = Todo.openapi('Todo');
export const TodoListResponse = z.array(Todo).openapi('TodoList');

// Parameter schemas
export const TodoParams = z.object({
  id: z.string().uuid(),
}).openapi('TodoParams');

export const TodoQuery = z.object({
  completed: z.boolean().optional(),
  userId: z.string().uuid().optional(),
}).openapi('TodoQuery');

// Types
export type Todo = z.infer<typeof Todo>;
export type CreateTodoRequest = z.infer<typeof CreateTodoRequest>;
export type UpdateTodoRequest = z.infer<typeof UpdateTodoRequest>;
export type TodoParams = z.infer<typeof TodoParams>;
export type TodoQuery = z.infer<typeof TodoQuery>; 