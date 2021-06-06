import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    body?: {
      confirmPassword?: any;
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
      .put('/users/password/')
      .set('confirmation', option.confirmToken)
      .send(option.body ? option.body : {});
  } else {
    response = await request(app)
      .put('/users/password/')
      .send(option.body ? option.body : {});
  }
  return response;
};
