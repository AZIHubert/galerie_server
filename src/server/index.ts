import connectSessionSequelize from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import http from 'http';
import Sequelize from 'sequelize';

import accEnv from '#src/helpers/accEnv';
import passport from '#src/helpers/passport';
import initSequelize from '#src/helpers/initSequelize.js';

import betaKeysRouter from '#src/routes/betaKeys';
import blackListsRouter from '#src/routes/blackLists';
import framesRouter from '#src/routes/frames';
import galeriesRouter from '#src/routes/galeries';
import notificationsRouter from '#src/routes/notifications';
import profilePicturesRouter from '#src/routes/profilePictures';
import reports from '#src/routes/reports';
import ticketsRouter from '#src/routes/tickets';
import usersRouter from '#src/routes/users';

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

  app.use(express.urlencoded({ extended: true, limit: '5m' }));
  app.use(express.json({ limit: '4MB' }));

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

  app.use('/betaKeys', betaKeysRouter());
  app.use('/blackLists', blackListsRouter());
  app.use('/frames', framesRouter());
  app.use('/galeries', galeriesRouter());
  app.use('/notifications', notificationsRouter());
  app.use('/profilePictures', profilePicturesRouter());
  app.use('/reports', reports());
  app.use('/tickets', ticketsRouter());
  app.use('/users', usersRouter());

  return server;
};

export default initApp;
