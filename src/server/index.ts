import bodyParser from 'body-parser';
import connectSessionSequelize from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import http from 'http';
import Sequelize from 'sequelize';

import accEnv from '@src/helpers/accEnv';
import passport from '@src/helpers/passport';
import initSequelize from '@src/helpers/initSequelize.js';

import userRouter from '@src/routes/user';
import notificationRouter from '@src/routes/notification';
import profilePictureRouter from '@src/routes/profilePicture';
import ticketRouter from '@src/routes/ticket';
// import galerieRouter from '@src/routes/galerie';

const SESSION_SECRET = accEnv('SESSION_SECRET');

const sequelize = initSequelize();

const SequelizeStore = connectSessionSequelize(session.Store);

sequelize.define('Sessions', {
  expires: Sequelize.DATE,
  data: Sequelize.TEXT,
  sid: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
});

const sequelizeStore = new SequelizeStore({
  db: sequelize,
  table: 'Sessions',
  tableName: 'Sessions',
});

const initApp: () => http.Server = () => {
  const app: express.Application = express();
  const server = new http.Server(app);

  app.use(bodyParser.json({ limit: '4MB' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '5m' }));

  app.use(cookieParser());
  app.use(session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: false,
    },
    resave: true,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    store: sequelizeStore,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(
    cors({
      credentials: true,
      exposedHeaders: ['set-cookie'],
      origin: [
        'http://www.localhost:1234',
        'http://localhost:1234',
        'https://www.localhost:1234',
      ],
    }),
  );
  app.use('/users', userRouter());
  app.use('/notifications', notificationRouter());
  app.use('/profilePictures', profilePictureRouter());
  app.use('/tickets', ticketRouter());
  // app.use('/galeries', galerieRouter());
  return server;
};

export default initApp;
