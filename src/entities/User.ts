import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity()
export class User {
  /**
   * ObjectID
   */
  @ObjectIdColumn()
  _id: ObjectID;

  /**
   * ID пользователя в VK
   */
  @Column()
  vkId: number;

  /**
   * Права пользователя
   */
  @Column()
  rights: number = 0;

  /**
   * Последняя отправка видео в любую беседу или лс
   */
  @Column()
  lastSend: number = 0;

  /**
   * Даты отправки TikTok'ов для выявления абьюзеров
   */
  @Column()
  timestamps: number[] = [];

  /**
   * Дата регистрации пользователя
   */
  @Column()
  timestamp: number = Date.now();

  constructor(options: Partial<User>) {
    Object.assign(this, options);
  }
}
