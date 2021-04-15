import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userName: string,
  page = 1,
) => {
  const response = await request(app)
    .get(`/users/userName/${userName}?page=${page}`)
    .set('authorization', token);
  return response;
};
