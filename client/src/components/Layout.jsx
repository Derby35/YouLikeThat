import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ParticleNet from './ParticleNet';

const Layout = () => (
  <div className="app-layout">
    {/* Particle network — fixed behind all page content, mouse-responsive */}
    <ParticleNet
      color="249,115,22"
      dotAlpha={0.62}
      lineAlpha={0.20}
      count={58}
      connect={140}
      repelR={100}
      repelF={2.4}
      zIndex={0}
    />
    <Navbar />
    <div className="page-content">
      <Outlet />
    </div>
  </div>
);

export default Layout;
