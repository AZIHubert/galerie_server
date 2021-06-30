import {
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import GalerieBlackList from '../galerieBlackLists';
import GalerieUser from '../galerieUser';
import Invitation from '../invitation';
import Notification from '../notification';
import User from '../user';

interface GalerieI {
  archived: boolean;
  defaultCoverPicture: string;
  description: string | null;
  hiddenName: string;
  id: string;
  name: string;
}

@Table({
  tableName: 'galerie',
})
export default class Galerie extends Model implements GalerieI {
  // If the admin of this galerie has delete his account,
  // and there are still subscriber users remaining,
  // this galerie become archived.
  // No frames/invitations can be created,
  // all users's become 'user'
  // and his name/cover picture can't be changed.
  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  archived!: boolean;

  // A CSS gradiant background
  // randomly generated when the galerie is create.
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  defaultCoverPicture!: string;

  // The description of the galerie.
  @Column({
    type: DataType.STRING,
  })
  description!: string;

  // ${name}-${increment}
  // HiddenName is used to order galeries
  // by name without having replicant.
  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
  hiddenName!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  // Name of the galerie.
  // Only the admin or the moderator
  // of the galerie can changed it.
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  name!: string;

  @BelongsToMany(() => User, () => GalerieUser)
  users!: Array<User & {GalerieUser: GalerieUser}>;

  @HasMany(() => Frame, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  frames!: Frame[];

  @HasMany(() => GalerieBlackList)
  galerieBlackLists!: GalerieBlackList[];

  @HasMany(() => Invitation)
  invitations!: Invitation[];

  @HasMany(() => Notification)
  notifications!: Notification[];
}
