import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  blackListId: string,
) => {
  const response = await request(app)
    .get(`/users/${userId}/blackLists/${blackListId}`)
    .set('authorization', token);
  return response;
};
