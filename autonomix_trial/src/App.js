import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CarDashboard from './pages/CarDashboard';
import AlertsFeed from './pages/AlertsFeed';
import MapView from './pages/MapView';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import Signup from './pages/Signup';
import BlockchainExplorer from './pages/BlockchainExplorer';
import Validators from './pages/Validators';
import Layout from './components/layout';

function App() {
  return (
    <Routes>
      {/* Pages with NavBar */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="car" element={<CarDashboard />} />
        <Route path="alerts" element={<AlertsFeed />} />
        <Route path="map" element={<MapView />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="about" element={<About />} />
        <Route path="explorer" element={<BlockchainExplorer />} />
        <Route path="validators" element={<Validators />} />
      </Route>

      {/* Page without NavBar */}
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;
