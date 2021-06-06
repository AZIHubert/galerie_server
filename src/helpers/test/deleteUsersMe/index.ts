import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    body: {
      deleteAccountSentence?: any;
      password?: any;
      userNameOrEmail?: any;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .delete('/users/me/')
    .set('authorization', token)
    .send(option.body);
  return response;
};
