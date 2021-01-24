import {
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';

interface SessionI {
  sid: String;
}

@Table({
  tableName: 'Sessions',
})
export default class Session extends Model implements SessionI {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  sid!: string;
}
