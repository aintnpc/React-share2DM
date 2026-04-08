import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandingLayout = () => (
  <div className="min-h-screen bg-white font-sans selection:bg-purple-500/30">
    <Navbar />
    <Outlet />
    <Footer />
  </div>
);

export default LandingLayout;
