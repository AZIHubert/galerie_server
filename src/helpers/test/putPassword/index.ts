import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  body: {
    confirmNewPassword?: any;
    currentPassword?: any;
    newPassword?: any;
  },
) => {
  const response = await request(app)
    .put('/users/me/password/')
    .set('authorization', token)
    .send(body);
  return response;
};
