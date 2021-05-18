import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  body: {
    deleteAccountSentence?: any;
    password?: any;
    userNameOrEmail?: any;
  },
) => {
  const response = await request(app)
    .delete('/users/me/')
    .set('authorization', token)
    .send(body);
  return response;
};
