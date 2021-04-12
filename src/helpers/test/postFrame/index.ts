import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
) => {
  const response = await request(app)
    .post(`/galeries/${galerieId}/frames`)
    .set('authorization', token)
    .attach('images', `${__dirname}/../ressources/image.jpg`);
  return response;
};
