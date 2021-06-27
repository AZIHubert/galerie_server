import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  notificationId: string,
) => {
  const response = await request(app)
    .get(`/notifications/${notificationId}`)
    .set('authorization', token);
  return response;
};
