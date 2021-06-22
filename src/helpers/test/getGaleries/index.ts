import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    all?: 'true' | 'false'
    page?: number;
  } = {},
) => {
  let response: request.Response;
  if (option.all) {
    response = await request(app)
      .get(`/galeries?page=${option.page || 1}&all=${option.all}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/galeries?page=${option.page || 1}`)
      .set('authorization', token);
  }
  return response;
};
