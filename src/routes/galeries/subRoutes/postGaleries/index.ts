import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';

import {
  galerieExcluder,
} from '@src/helpers/excluders';
import {
  normalizeJoiErrors,
  validatePostGaleriesBody,
} from '@src/helpers/schemas';

const colors = [
  [
    '#C10500',
    '#E03B3B',
    '#D3431C',
    '#DB3D12',
    '#F78989',
    '#FCA590',
    '#F2CBAF',
    '#F4A667',
    '#D88145',
    '#F46C0F',
  ],
  [
    '#8200BF',
    '#6B199B',
    '#59247F',
    '#2C247C',
    '#252299',
    '#2323AF',
    '#2323C1',
    '#3B25BF',
    '#2F1FCC',
    '#4A21CC',
    '#6923CC',
  ],
  [
    '#FF00ED',
    '#DD1FD9',
    '#C125C1',
    '#BD3AC1',
    '#C656CC',
    '#CE72D6',
    '#C583CC',
    '#C899CE',
  ],
];

const map = (
  value: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => ((value - x1) * (y2 - x2)) / ((y1 - x1) + x2);

export default async (req: Request, res: Response) => {
  const objectGalerieExcluder: { [key: string]: undefined } = {};
  const currentUser = req.user as User;
  let galerie: Galerie;

  const {
    error,
    value,
  } = validatePostGaleriesBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Create delete defaultCoverPicture
  // has a CSS linear gradient property.
  const shade = colors[Math.floor(Math.random() * colors.length)];
  const numOfColor = Math.floor((Math.random() * 2)) + 3;
  const angle = Math.floor(Math.random() * 180);
  const randomColors = shade
    .sort(() => (Math.random() > 0.5 ? -1 : 1))
    .slice(0, numOfColor);
  const defaultCoverPicture = `linear-gradient(${angle}deg, ${randomColors
    .map((randomColor, index) => `${randomColor} ${map(index, 0, numOfColor - 1, 0, 100)}%`)
    .join(', ')})`;

  // Create galerie and GalerieUser.
  try {
    galerie = await Galerie.create({
      description: value.description || '',
      name: value.name,
      defaultCoverPicture,
    });
    await GalerieUser.create({
      userId: currentUser.id,
      galerieId: galerie.id,
      role: 'creator',
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  galerieExcluder.forEach((e) => {
    objectGalerieExcluder[e] = undefined;
  });

  const returnedGalerie = {
    ...galerie.toJSON(),
    ...objectGalerieExcluder,
    currentCoverPicture: null,
    frames: [],
    hasNewFrames: false,
    role: 'creator',
    users: [],
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      galerie: returnedGalerie,
    },
  });
};
