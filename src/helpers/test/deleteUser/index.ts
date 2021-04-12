import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  {
    deleteAccountSentence,
    password,
    userNameOrEmail,
  }: {
    deleteAccountSentence?: string;
    password?: string;
    userNameOrEmail?: string;
  },
) => {
  const response = await request(app)
    .delete('/users/me/')
    .set('authorization', token)
    .send({
      deleteAccountSentence,
      password,
      userNameOrEmail,
    });
  return response;
};
