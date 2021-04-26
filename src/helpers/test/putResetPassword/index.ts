import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  confirmToken: string | undefined,
  body : {
    confirmPassword?: any;
    password?: any;
  },
) => {
  let response: request.Response;
  if (confirmToken) {
    response = await request(app)
      .put('/users/password/')
      .set('confirmation', confirmToken)
      .send(body);
  } else {
    response = await request(app)
      .put('/users/password/')
      .send(body);
  }
  return response;
};
