import { registerPage } from '../utils/registry';
import HomePage from '@/modules/home/home/HomePage';
import LoginPage from '@/modules/home/login/LoginPage';
import AboutPage from '@/modules/home/about/AboutPage';
import ThemePage from '@/modules/home/theme/ThemePage';

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
