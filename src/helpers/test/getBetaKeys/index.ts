import { Server } from 'http';
import request, { Response } from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    page?: number;
    me?: 'true' | 'false';
    used?: 'true' | 'false';
  } = {
    page: 1,
  },
) => {
  let response: Response;
  if (option.me && option.used) {
    response = await request(app)
      .get(`/betaKeys?me=${option.me}&page=${option.page ? option.page : 1}&used=${option.used}`)
      .set('authorization', token);
  } else if (option.me) {
    response = await request(app)
      .get(`/betaKeys?page=${option.page ? option.page : 1}&me=${option.me}`)
      .set('authorization', token);
  } else if (option.used) {
    response = await request(app)
      .get(`/betaKeys?page=${option.page ? option.page : 1}&used=${option.used}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/betaKeys?page=${option.page ? option.page : 1}`)
      .set('authorization', token);
  }
  return response;
};
