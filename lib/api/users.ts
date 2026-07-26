import { API_BASE_URL } from '@/lib/config';
import { readErrorMessage } from '@/lib/api/http';
import type { CreateUserRequest, UserResponse } from '@/lib/api/types';

export async function createUser(request: CreateUserRequest): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserResponse;
}
