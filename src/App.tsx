
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import { useTrackingAnalytics } from './hooks/useTrackingAnalytics'
import { useGTMTracking } from './hooks/useGTMTracking'

export default function App() {
  useTrackingAnalytics();
  useGTMTracking();
  
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppRoutes />
    </BrowserRouter>
  );
}
