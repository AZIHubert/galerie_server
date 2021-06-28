import { Server } from 'http';
import request, { Response } from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    previousBetaKey?: string;
    me?: 'true' | 'false';
    used?: 'true' | 'false';
  } = {},
) => {
  let response: Response;
  if (option.previousBetaKey) {
    if (option.me && option.used) {
      response = await request(app)
        .get(`/betaKeys?me=${option.me}&previousBetaKey=${option.previousBetaKey}&used=${option.used}`)
        .set('authorization', token);
    } else if (option.me) {
      response = await request(app)
        .get(`/betaKeys?me=${option.me}&previousBetaKey=${option.previousBetaKey}`)
        .set('authorization', token);
    } else if (option.used) {
      response = await request(app)
        .get(`/betaKeys?previousBetaKey=${option.previousBetaKey}&used=${option.used}`)
        .set('authorization', token);
    } else {
      response = await request(app)
        .get(`/betaKeys?previousBetaKey=${option.previousBetaKey}`)
        .set('authorization', token);
    }
  } else if (option.me && option.used) {
    response = await request(app)
      .get(`/betaKeys?me=${option.me}&used=${option.used}`)
      .set('authorization', token);
  } else if (option.me) {
    response = await request(app)
      .get(`/betaKeys?me=${option.me}`)
      .set('authorization', token);
  } else if (option.used) {
    response = await request(app)
      .get(`/betaKeys?&used=${option.used}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get('/betaKeys')
      .set('authorization', token);
  }
  return response;
};
