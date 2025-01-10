import { z } from 'zod';

// Base user schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('User');

// Create user request
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).openapi('CreateUserRequest');

// Update user request
export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).openapi('UpdateUserRequest');

// User response
export const UserResponseSchema = UserSchema.openapi('UserResponse');

// User list response
export const UserListResponseSchema = z.array(UserSchema).openapi('UserListResponse');

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>; 