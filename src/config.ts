import dotenv from 'dotenv';
import { AxiosRequestConfig } from 'axios';

dotenv.config();

export const databaseURI: string = process.env.MONGO_URL || '';

export const token: string = process.env.TOKEN || '';
export const userToken: string = process.env.USER_TOKEN || '';
export const groupId: number = Number.parseInt(process.env.GROUP_ID || '0');

export const adminPeerId: number = Number.parseInt(
  process.env.ADMIN_PEER_ID || '0'
);
export const cookie: string = process.env.COOKIE || '';

export const axiosConfig: AxiosRequestConfig = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    Encoding: 'utf-8',
    Referer: 'https://www.tiktok.com/',
    Cookie: cookie
  }
};
