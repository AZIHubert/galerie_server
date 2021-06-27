import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
) => {
  const response = await request(app)
    .put('/users/me/hasNewNotifications/')
    .set('authorization', token);
  return response;
};
