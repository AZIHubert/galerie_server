import crypto from 'crypto';
import fs from 'fs';

const genKeyPair = () => {
  const keyPairAuthToken = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
  });

  const keyPairInvitationToken = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
  });

  const keyPairNotificationToken = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
  });

  const keyPairRefreshToken = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
  });

  fs.writeFileSync(`${__dirname}/id_rsa_pub.authToken.pem`, keyPairAuthToken.publicKey);
  fs.writeFileSync(`${__dirname}/id_rsa_priv.authToken.pem`, keyPairAuthToken.privateKey);

  fs.writeFileSync(`${__dirname}/id_rsa_pub.invitationToken.pem`, keyPairInvitationToken.publicKey);
  fs.writeFileSync(`${__dirname}/id_rsa_priv.invitationToken.pem`, keyPairInvitationToken.privateKey);

  fs.writeFileSync(`${__dirname}/id_rsa_pub.notificationToken.pem`, keyPairNotificationToken.publicKey);
  fs.writeFileSync(`${__dirname}/id_rsa_priv.notificationToken.pem`, keyPairNotificationToken.privateKey);

  fs.writeFileSync(`${__dirname}/id_rsa_pub.refreshToken.pem`, keyPairRefreshToken.publicKey);
  fs.writeFileSync(`${__dirname}/id_rsa_priv.refreshToken.pem`, keyPairRefreshToken.privateKey);
};

genKeyPair();
