import 'module-alias/register';

import './helpers/initEnv';
import initSequelize from './helpers/initSequelize.js';
import accessEnv from './helpers/accEnv';
import initApp from './server';

const PORT = accessEnv('PORT');

initSequelize(() => {
  console.log('DB connected...');
  initApp().listen(PORT, () => {
    console.log(`App starte on port ${PORT}`);
  });
});
