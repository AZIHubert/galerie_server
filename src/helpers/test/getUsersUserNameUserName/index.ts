import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userName: string,
  option: {
    blackListed?: 'true' | 'false';
    page?: number;
  } = {},
) => {
  const {
    blackListed,
    page,
  } = option;
  let response: request.Response;
  if (blackListed) {
    response = await request(app)
      .get(`/users/userName/${userName}?page=${page || 1}&blackListed=${blackListed}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/users/userName/${userName}?page=${page || 1}`)
      .set('authorization', token);
  }
  return response;
};
