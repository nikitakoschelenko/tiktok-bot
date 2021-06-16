import dotenv from 'dotenv';
import { AxiosRequestConfig } from 'axios';

dotenv.config();

export const token: string = process.env.TOKEN || '';
export const userToken: string = process.env.USER_TOKEN || '';
export const groupId: number = Number.parseInt(process.env.GROUP_ID || '0');

export const axiosConfig: AxiosRequestConfig = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    Encoding: 'utf-8',
    Referer: 'https://www.tiktok.com/',
    Cookie:
      'tt_webid_v2=6974298973474932230; tt_webid=6974298973474932230; tt_csrf_token=birajCbOcuPxypdyxb9CH126; ak_bmsc=39EDD00A4AAE71A4AFA5916C125BDCA18B2DDB3C262E0000FDAFC960FE0C2B42~plih3tHceSxo4xbVvglYkYjqKLjvIyDR6w7fUS20dN1QopGZH9vt1qCTra3UPTvKWvQM1o8AY7/rIF2fCoCUZtbIP6MU6Yj8YHEX3638vtoc0cSuOq6BjDzYdopZkGwOM+XNM6s2nQSyVd0xka9U9XsKGS9b11iXAXuiQ3THPe5/c2yxCUcCJgNHQvmQ6TmX/xoZvkWCq25AKkDBeXWuIwFThQkUuupd46248cm0dGDvk=; bm_sz=B6A7CA746C4ABF9C87484B89C30A727F~YAAQPNsti2suD8t5AQAAzHfXEwzBybTNKEkZzcUkDUhwmaE/eEcmrzwvm1qcycvP2417vVr2JfcMGuWHNbABWOnF7H4L9ZK017r6SCPtU1KUITxlGDS1GT2qDEUJt/7kctJJMSjbx9YojyfVFLCHNX2Ax1i0gNoN9KcxVTqxqIxsffS37L0kBzRPxJTrcAlv; _abck=08D8B199E4069EAD6699C0D2A202F98C~-1~YAAQPNsti2wuD8t5AQAAzHfXEwbULW71bJm1d+Q5aKt2tIL9OTJ27OKbhCqcWmIMfjoJUIKHI6O/6Nt0kiRiFlWd8uAU/A+hZLxh6q4NSu5CCF76wnFB6p8aexs2Wh0Ot4BGLr8xG6qtyVxaAk2fVPHw+V/S2gPWKgKNW/2xasM96l5brL1lS58cjR/Zcz3CChw3JlFqs1Sw0p95A7VS170ureTM7VTrWQwFWbOK22Gb+qR0AMmcughUnFByutMnX/1eWBe6MwlBqdaCG5zaVvdtbLZmBwX+S9nYpT/2ZFNkyGY+PN4ycIHgMDmpNIhAOHGZJ6CAzFbQ+x5M98U/+58e/mluLBfYJH9ZpJFYqbmQwlXirEzRtHFjWPs=~-1~-1~-1; MONITOR_WEB_ID=6974298973474932230; R6kq3TV7=AOx-1xN6AQAAYN6HFus5EHgaIIZobVXMvR4m7QUc8lcMUf_BKT8uiei9yfNS|1|0|bf9f8ac8d44d2efe135a26299d933379ad580d9d; csrf_session_id=78913bceea65490996e740a7368bf84b; s_v_web_id=verify_kpz6rr9n_0cOvFXqS_w4yV_4bif_AWmE_EVd5L40ZXL2R; ttwid=1%7CX2l2qrQEMkdxsVaiXOgpURi_AMVEV15GpgXJcn7b_s4%7C1623834177%7C03e1e99f807151c0c7c77db3c1037303ea1bc8cfe4c32744c0a0e8b6b9aedac4; bm_sv=92AE02C33FECD13C6F1CF215DF298BCE~0zLQ9ZG2agk3obvzNFszrHM2LPAeAv8965s4+Gwdd2OrGwFXW8FvcAOb/KXx5g1PGpZgsXpex1PMEq5h+ahVYq1rcuIQCssokmIX6JXeVLYu+ODFivr9M4fWc292oSk8bAdGxXkvd4O5+3y2JXH5bTtVF4ls9rGYEM4Ny6mdH7w='
  }
};
