import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';

interface TicketI {
  body: string;
  header: string;
  id: string;
  userId: string;
}

@Table({
  defaultScope: {
    attributes: { exclude: ['deletedAt'] },
  },
  paranoid: true,
  tableName: 'ticket',
})
export default class Ticket extends Model implements TicketI {
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  body!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  header!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;
}
