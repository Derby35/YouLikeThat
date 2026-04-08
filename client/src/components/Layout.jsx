import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ParticleNet from './ParticleNet';

const Layout = () => (
  <div className="app-layout">
    {/* Particle network — fixed behind all page content, mouse-responsive */}
    <ParticleNet
      color="59,130,246"
      dotAlpha={0.38}
      lineAlpha={0.13}
      count={50}
      connect={160}
      repelR={110}
      repelF={2.2}
      zIndex={0}
    />
    <Navbar />
    <div className="page-content">
      <Outlet />
    </div>
  </div>
);

export default Layout;
