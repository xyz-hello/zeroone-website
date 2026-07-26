import { useEffect, useMemo, useState } from 'react';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function getRouteFromLocation() {
  const { hash, pathname } = window.location;
  const hasAdminToken = Boolean(window.localStorage.getItem('zerooneAdminToken'));

  if (pathname === '/about-us') {
    return {
      page: 'about',
      anchor: hash.replace('#', '')
    };
  }

  if (pathname === '/admin/login') {
    return {
      page: 'admin-login',
      anchor: ''
    };
  }

  if (pathname === '/admin/mail-config') {
    if (!hasAdminToken) {
      window.history.replaceState({}, '', '/admin/login');
      return {
        page: 'admin-login',
        anchor: ''
      };
    }

    return {
      page: 'admin-mail-config',
      anchor: ''
    };
  }

  if (pathname === '/admin/content') {
    if (!hasAdminToken) {
      window.history.replaceState({}, '', '/admin/login');
      return {
        page: 'admin-login',
        anchor: ''
      };
    }

    return {
      page: 'admin-content',
      anchor: ''
    };
  }

  if (hash === '#contact') {
    return {
      page: 'landing',
      anchor: 'contact'
    };
  }

  return {
    page: 'landing',
    anchor: ''
  };
}

function App() {
  const [route, setRoute] = useState(() => getRouteFromLocation());

  useEffect(() => {
    const onRouteChange = () => {
      setRoute(getRouteFromLocation());
    };

    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);

    return () => {
      window.removeEventListener('hashchange', onRouteChange);
      window.removeEventListener('popstate', onRouteChange);
    };
  }, []);

  useEffect(() => {
    if (!route.anchor) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    requestAnimationFrame(() => {
      document.getElementById(route.anchor)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }, [route]);

  const page = useMemo(() => {
    if (route.page === 'admin-login') {
      return <AdminLoginPage />;
    }

    if (route.page === 'admin-mail-config') {
      return <AdminDashboardPage page="mail-config" />;
    }

    if (route.page === 'admin-content') {
      return <AdminDashboardPage page="content" />;
    }

    if (route.page === 'about') {
      return <AboutPage />;
    }

    return <LandingPage />;
  }, [route.page]);

  return page;
}

export default App;
