import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import idCommon from './locales/id/common.json';
import idHome from './locales/id/home.json';
import idProfile from './locales/id/profile.json';
import idSettings from './locales/id/settings.json';
import idAuth from './locales/id/auth.json';
import idUser from './locales/id/user.json';
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enProfile from './locales/en/profile.json';
import enSettings from './locales/en/settings.json';
import enAuth from './locales/en/auth.json';
import enUser from './locales/en/user.json';

const resources = {
  id: {
    common: idCommon,
    home: idHome,
    profile: idProfile,
    settings: idSettings,
    auth: idAuth,
    user: idUser,
  },
  en: {
    common: enCommon,
    home: enHome,
    profile: enProfile,
    settings: enSettings,
    auth: enAuth,
    user: enUser,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      lookupCookie: 'locale',
      lookupLocalStorage: 'locale',
      caches: ['cookie', 'localStorage'],
    },
  });

export default i18n;
