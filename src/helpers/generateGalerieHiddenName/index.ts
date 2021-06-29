import {
  Galerie,
} from '#src/db/models';

export default async (name: string) => {
  let hiddenName: string;
  const galerieWithSameName = await Galerie.findAll({
    limit: 1,
    order: [['hiddenName', 'DESC']],
    where: {
      name,
    },
  });

  if (galerieWithSameName[0]) {
    const increment = galerieWithSameName[0].hiddenName.replace(`${name}-`, '');
    hiddenName = `${name}-${+increment + 1}`;
  } else {
    hiddenName = `${name}-0`;
  }

  return hiddenName;
};
