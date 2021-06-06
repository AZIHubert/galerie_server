import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    confirmToken?: string,
  } = {},
) => {
  let response: request.Response;
  if (option.confirmToken) {
    response = await request(app)
      .put('/users/confirmation')
      .set('confirmation', option.confirmToken);
  } else {
    response = await request(app)
      .put('/users/confirmation');
  }
  return response;
};
