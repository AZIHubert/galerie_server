import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    all?: 'true' | 'false'
    previousGalerie?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.all) {
    if (option.previousGalerie) {
      response = await request(app)
        .get(`/galeries?previousGalerie=${option.previousGalerie}&all=${option.all}`)
        .set('authorization', token);
    } else {
      response = await request(app)
        .get(`/galeries?all=${option.all}`)
        .set('authorization', token);
    }
  } else if (option.previousGalerie) {
    response = await request(app)
      .get(`/galeries?previousGalerie=${option.previousGalerie}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get('/galeries')
      .set('authorization', token);
  }
  return response;
};
