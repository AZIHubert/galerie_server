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

interface BetaKeyI {
  autoIncrementId: number;
  code: string;
  createdById: string | null;
  email: string | null;
  id: string;
  notificationHasBeenSend: boolean;
  userId: string;
}

@Table({
  tableName: 'betaKey',
})
export default class BetaKey extends Model implements BetaKeyI {
  // Required to order by created at without
  // having replicate Model.
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  // Unique code to register
  // to the app.
  @Column({
    allowNull: false,
    type: DataType.STRING,
    unique: true,
  })
  code!: string;

  // The admin who create the betaKey.
  // If null, the admin has deleted his account.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  createdById!: string;

  // Email which this betaKey has been send.
  @Column({
    type: DataType.STRING,
  })
  email!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  // If true, the admin
  // has receive a notification when
  // a user subscribe with this beta key.
  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  notificationHasBeenSend!: boolean;

  // The id of the user who use
  // this beta key.
  @ForeignKey(() => User)
  @Column({
    unique: true,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => User, {
    foreignKey: 'createdById',
    hooks: true,
    onDelete: 'CASCADE',
  })
  createdBy!: User;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  user!: User;
}
