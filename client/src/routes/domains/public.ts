import { registerPage } from '../registry';
import HomePage from '../../pages/HomePage';
import LoginPage from '../../pages/LoginPage';
import AboutPage from '../../pages/AboutPage';
import ThemePage from '../../pages/ThemePage';

// Register public pages
export const registerPublicDomain = () => {
  registerPage({
    path: '/',
    component: HomePage,
    title: 'Home',
    isPublic: true,
  });

  registerPage({
    path: '/login',
    component: LoginPage,
    title: 'Sign In',
    isPublic: true,
  });

  registerPage({
    path: '/about',
    component: AboutPage,
    title: 'About Us',
    isPublic: true,
  });

  registerPage({
    path: '/theme',
    component: ThemePage,
    title: 'Theme Settings',
    isPublic: true,
  });
};
