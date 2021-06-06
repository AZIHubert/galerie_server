import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    body?: {
      email?: any;
      password?: any;
    },
    confirmToken?: string,
  } = {
    body: {},
  },
) => {
  let response: request.Response;
  if (option.confirmToken) {
    response = await request(app)
      .post('/users/me/email/confirm')
      .set('authorization', token)
      .set('confirmation', option.confirmToken)
      .send(option.body ? option.body : {});
  } else {
    response = await request(app)
      .post('/users/me/email/confirm')
      .set('authorization', token)
      .send(option.body ? option.body : {});
  }
  return response;
};
