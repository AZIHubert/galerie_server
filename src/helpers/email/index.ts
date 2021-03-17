import nodemailer from 'nodemailer';

import accEnv from '@src/helpers/accEnv';

const MAIL_USERNAME = accEnv('MAIL_USERNAME');
const MAIL_PASSWORD = accEnv('MAIL_PASSWORD');

const mailConfig = {
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
};
const transporter = nodemailer.createTransport(mailConfig);

const confirmAccountMessage = (email: string, token: string) => ({
  from: 'Galeries <sender@mail.com>',
  to: email,
  subject: 'validate your account',
  text: 'Hello',
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>thank you for using galeries</p>
      <p>Please click this link to confirm your email:</p>
      <a target='_blank' href='https://www.localhost:1234/confirmation/${token}'>
        https://www.localhost:1234/confirmation/${token}
      </a>
    </body>
  </html>`,
});

const resetPasswordMessage = (email: string, token: string) => ({
  from: 'Galeries <sender@mail.com>',
  to: email,
  subject: 'reset your password',
  text: 'Hello',
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to reset your password:</p>
      <a target="_blank" href='https://www.localhost:1234/resetPassword/${token}'>
        https://www.localhost:1234/resetPassword/${token}
      </a>
    </body>
  </html>`,
});

const updateEmailMessage = (email: string, token: string) => ({
  from: 'Galeries <sender@mail.com>',
  to: email,
  subject: 'update your email',
  text: 'Hello',
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to update your email:</p>
      <a target="_blank" href='https://www.localhost:1234/updateEmail/${token}'>
        https://www.localhost:1234/updateEmail/${token}
      </a>
    </body>
  </html>`,
});

const validateEmailMessage = (email: string, token: string) => ({
  from: 'Galeries <sender@mail.com>',
  to: email,
  subject: 'validate your email',
  text: 'Hello',
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to validate your email:</p>
      <a target="_blank" href='https://www.localhost:1234/validateEmail/${token}'>
        https://www.localhost:1234/updateEmail/${token}
      </a>
    </body>
  </html>`,
});

export const sendConfirmAccount = (email: string, token: string) => transporter.sendMail(
  confirmAccountMessage(email, token),
  (err) => {
    if (err) transporter.close();
  },
);
export const sendResetPassword = (email: string, token: string) => transporter.sendMail(
  resetPasswordMessage(email, token),
  (err) => {
    if (err) transporter.close();
  },
);
export const sendUpdateEmailMessage = (email: string, token: string) => transporter.sendMail(
  updateEmailMessage(email, token),
  (err) => {
    if (err) transporter.close();
  },
);

export const sendValidateEmailMessage = (email: string, token: string) => transporter.sendMail(
  validateEmailMessage(email, token),
  (err) => {
    if (err) transporter.close();
  },
);
