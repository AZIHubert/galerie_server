import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    body: {
      confirmNewPassword?: any;
      currentPassword?: any;
      newPassword?: any;
    },
  },
) => {
  const response = await request(app)
    .put('/users/me/password/')
    .set('authorization', token)
    .send(option.body);
  return response;
};
