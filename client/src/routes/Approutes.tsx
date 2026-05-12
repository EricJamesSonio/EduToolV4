// Approutes - Main Route Orchestrator
// Central route management using registered pages

import { Routes, Route } from 'react-router-dom';
import { getRegisteredRoutes } from './registry';
import { registerPublicDomain } from './domains/public';
import NotFoundPage from '../pages/NotFoundPage';

// Register all domains
registerPublicDomain();

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
