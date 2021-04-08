import {
  BelongsToMany,
  Column,
  ForeignKey,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import Galerie from '../galerie';
import NotificationUser from '../notificationUser';
import User from '../user';

interface NotificationI {
  frameId?: string;
  galerieId?: string;
  id: string;
  type: 'frame' | 'invitation';
  userId: string;
}

@Table({
  tableName: 'notification',
})
export default class Notification extends Model implements NotificationI {
  @ForeignKey(() => Frame)
  @Column({
    type: DataType.BIGINT,
  })
  frameId!: string;

  @ForeignKey(() => Galerie)
  @Column({
    type: DataType.BIGINT,
  })
  galerieId!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
  })
  type!: 'frame' | 'invitation';

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;

  @BelongsToMany(() => User, () => NotificationUser)
  users!: User[];
}
