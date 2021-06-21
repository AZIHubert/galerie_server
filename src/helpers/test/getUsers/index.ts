import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    direction?: 'ASC' | 'DESC';
    blackListed?: 'true' | 'false';
    order?: 'createdAt' | 'pseudonym' | 'userName';
    page?: number;
  } = {},
) => {
  const {
    direction,
    blackListed,
    order,
    page,
  } = option;
  let response: request.Response;
  if (option.direction && option.order) {
    response = await request(app)
      .get(`/users?page=${page || 1}&direction=${direction}&order=${order}`)
      .set('authorization', token);
  } else if (option.direction) {
    response = await request(app)
      .get(`/users?page=${page || 1}&direction=${direction}`)
      .set('authorization', token);
  } else if (option.order) {
    response = await request(app)
      .get(`/users?page=${page || 1}&order=${order}`)
      .set('authorization', token);
  } else if (blackListed) {
    response = await request(app)
      .get(`/users?page=${page || 1}&blackListed=${blackListed}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/users?page=${page || 1}`)
      .set('authorization', token);
  }
  return response;
};
