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
