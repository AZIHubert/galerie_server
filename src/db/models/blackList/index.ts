import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';

interface BlackListI {
  autoIncrementId: number;
  createdById: string | null;
  id: string;
  reason: string;
  time: Date | null;
  updatedById: string | null;
  userId: string;
}

@Table({
  tableName: 'blackList',
})
export default class BlackList extends Model implements BlackListI {
  // Required to order by created at without
  // having replicate Model.
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  // Id of the user who
  // created the black list.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  createdById!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  // The reason why the user has been baned.
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  reason!: string;

  // How many time the user is blackListed.
  // If null, the user is blackListed during
  // an illimited amount of time.
  @Column({
    type: DataType.DATE,
  })
  time!: Date;

  // Id of the blackListed user.

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  // Id of the admin who un blackListed
  // this user. updatedById is set only
  // if this blackList was the active one
  // when a user is unblacklisted.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  updatedById!: string;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @BelongsTo(() => User, 'updatedById')
  updatedBy!: User;

  @BelongsTo(() => User)
  user!: User;
}
