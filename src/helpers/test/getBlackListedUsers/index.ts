import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  page = 1,
) => {
  const response = await request(app)
    .get(`/users/blackList?page=${page}`)
    .set('authorization', token);
  return response;
};
