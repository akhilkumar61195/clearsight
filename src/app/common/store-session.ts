import StorageService from '../services/storage.service';
import { cookieOption } from './constant';
import { AuthenticationSession } from './enum/common-enum';
import { AuthenticationData } from './types';

export const storeSession = ({ idToken, accessToken, userId, customToken, carrierDetails }: AuthenticationData) => {
  let current = new Date();
  let nextYear = new Date();

  nextYear.setFullYear(current.getFullYear() + 1);

  let cookiesOptions = cookieOption;
  cookiesOptions.expires = nextYear,

  StorageService.set(AuthenticationSession.USER_ID, userId, cookiesOptions);

  StorageService.set(AuthenticationSession.TOKEN, customToken, cookiesOptions);
};
