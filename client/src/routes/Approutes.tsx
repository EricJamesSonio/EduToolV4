import { Routes, Route } from 'react-router-dom';
import { getRegisteredRoutes } from './utils/registry';
import { registerPublicDomain } from './domains/public';
import { registerAdminDomain } from './domains/admin';
import NotFoundPage from '../components/default/NotFoundPage';

// Register all domains
registerPublicDomain();
registerAdminDomain();

// Approutes Component
const Approutes = () => {
  const registeredRoutes = getRegisteredRoutes();

  return (
    <Routes>
      {registeredRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<route.component />}
        />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Approutes;
