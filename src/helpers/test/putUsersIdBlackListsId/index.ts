import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
) => {
  const response = await request(app)
    .put(`/users/${userId}/blackLists/`)
    .set('authorization', token);
  return response;
};
