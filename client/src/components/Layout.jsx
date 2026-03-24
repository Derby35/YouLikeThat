import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => (
  <div className="app-layout">
    <Navbar />
    <div className="page-content">
      <Outlet />
    </div>
  </div>
);

export default Layout;
