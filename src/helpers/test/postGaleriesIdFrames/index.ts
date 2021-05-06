import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  numOfGaleriePictures = 1,
  notAnImage = false,
) => {
  let response: request.Response;
  if (notAnImage) {
    response = await request(app)
      .post(`/galeries/${galerieId}/frames`)
      .set('authorization', token)
      .attach('image', `${__dirname}/../ressources/text.txt`);
  } else {
    switch (numOfGaleriePictures) {
      case 0:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token);
        break;
      case 1:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      case 2:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      case 3:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      case 4:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      case 5:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      case 6:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      case 7:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
        break;
      default:
        response = await request(app)
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../ressources/image.jpg`);
    }
  }
  return response;
};
