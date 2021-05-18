import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
) => {
  const response = await request(app)
    .post('/ProfilePictures')
    .set('authorization', token)
    .attach('image', `${__dirname}/../ressources/image.jpg`);
  return response;
};
