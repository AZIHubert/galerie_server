import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import GaleriePicture from '../galeriePicture';
import GalerieUser from '../galerieUser';
import Invitation from '../invitation';
import User from '../user';

interface GalerieI {
  coverPictureId?: string;
  id: string;
  name: string;
  defaultCoverPicture?: string
  GalerieUser?: GalerieUser;
  archived?: boolean;
}

@Table({
  tableName: 'galerie',
})
export default class Galerie extends Model implements GalerieI {
  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  archived!: boolean

  @ForeignKey(() => GaleriePicture)
  @Column({
    type: DataType.BIGINT,
  })
  coverPictureId!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  name!: string;

  @Column({
    allowNull: true,
    type: DataType.STRING,
  })
  defaultCoverPicture!: string;

  @BelongsToMany(() => User, () => GalerieUser)
  users!: User[];

  @BelongsTo(() => GaleriePicture)
  coverPicture!: GaleriePicture;

  @HasMany(() => Frame)
  frames!: Frame[];

  @HasMany(() => Invitation)
  invitations!: Invitation[];

  GalerieUser!: GalerieUser;
}
