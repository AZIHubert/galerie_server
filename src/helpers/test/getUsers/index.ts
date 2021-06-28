import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    blackListed?: 'true' | 'false';
    previousUser?: string;
  } = {},
) => {
  const {
    blackListed,
    previousUser,
  } = option;
  let response: request.Response;
  if (blackListed) {
    if (previousUser) {
      response = await request(app)
        .get(`/users?previousUser=${previousUser}&blackListed=${blackListed}`)
        .set('authorization', token);
    } else {
      response = await request(app)
        .get(`/users?blackListed=${blackListed}`)
        .set('authorization', token);
    }
  } else if (previousUser) {
    response = await request(app)
      .get(`/users?previousUser=${previousUser}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get('/users/')
      .set('authorization', token);
  }
  return response;
};
