import 'module-alias/register';

import './helpers/initEnv';
import initSequelize from './helpers/initSequelize.js';
import accessEnv from './helpers/accEnv';
import initApp from './server';

const PORT = accessEnv('PORT');

initSequelize(() => {
  console.log('DB connected...');

  initApp().listen(PORT, () => {
    console.log(`App start on port ${PORT}`);
  });
});

// TODO:
// db:migration:undo, add deletedAt to PP, db:migation
// create galerie and be an admin
// delete galerie if current user is admin
// update galerie if current user is admin (name and picture)
// get all galeries
// get a single galerie
// invite people to a galerie if current user is admin
// delete user to a galerie if current user is admin
// find galerie by name
// send an invite to a galerie to all admin user
// accept user to a galerie if current user is admin
// add picture to a galerie
// add pictures to a galere
// remove picture(s) to a galeries if belong to current user

// Image.galerie, belong to many Galerie
// @BelongsToMany(() => Galerie, () => ImageGalerie)
// galeries: Galerie[];
//
// @BelongsTo(() => ProfilePictures)
// profilePicture: ProfilePicture;
//
// @ForeignKey(() => User)
// @Column
// userId: String;
// @BelongsTo(() => User)
// user: User;
//
// @HasOne(() => Image, 'croppedImageId')
// croppedImage
// @HasOne(() => Image, 'originalImageId')
// originalImage
// @HasOne(() => Image, 'pendingImageId')
// pendingImage
//
//
// Galeries.images, belong to many images
// @BelongsToMany(() => Image, () => ImageGalerie)
// images: Image[];
//
//
// ProfilePicture
// @BelongsTo(() => User)
// user: User;
//
// current: Boolean;
//
//
// User
// @HasMany(() => ProfilePictures)
