import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity()
export class TikTokVideo {
  /**
   * ObjectID
   */
  @ObjectIdColumn()
  _id: ObjectID;

  /**
   * Автор видео
   */
  @Column()
  author: string;

  /**
   * ID Видео
   */
  @Column()
  videoId: string;

  /**
   * Короткая ссылка на видео
   */
  @Column()
  link: string;

  /**
   * Таймстампы отправки этого тиктока
   */
  @Column()
  timestamps: number[] = [];

  constructor(options: Partial<TikTokVideo>) {
    Object.assign(this, options);
  }
}
