import 'module-alias/register';

import './helpers/initEnv';

import accessEnv from './helpers/accEnv';
import initSequelize from './helpers/initSequelize.js';

import initApp from './server';

const PORT = accessEnv('PORT');

initSequelize(() => {
  console.log('DB connected...');

  initApp().listen(PORT, () => {
    console.log(`App start on port ${PORT}`);
  });
});

// TODO:
// create Report model

// TODO:
// galerie.allowNotification

// TODO:
// notification Many2Many

// TODO:
// notification.seen

// TODO:
// notification already send errorMessage

// TODO:
// user.numOfNotification

// Create a new notification
// Only if not find notification
// or if other notification (read or not read)
// .updatedAt < last week
// Exemple
// si une notification a été créer et lu il y a moins d'une semaine
// pas besoin de créer une nouvelle notification
// juste notification.read === false
// et incrémenter notification.
// si une notification a été créer il y a plus d'une semaine mais n'a pas été lu
// pas besoin d'en créer une nouvelle, juste increment num.
