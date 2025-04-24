import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FaSignOutAlt, FaInfoCircle, FaRegUserCircle } from 'react-icons/fa';
import { GrVmware } from "react-icons/gr";
import { MdSpaceDashboard } from "react-icons/md";
import brand from '../../res/brand.png';
import logo from '../../res/logo.png';
import pkgjson from "../../package.json";

import Dashboard from './Dashboard';
import VSphereRelease from './vSphereRelease';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function Homepage() {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="homepage-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <img src={brand} alt="VMware Tech Hub" className="sidebar-logo" />
        <nav className="sidebar-nav">
          <div className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <MdSpaceDashboard className="sidebar-icon" />
            <span>Dashboard</span>
          </div>
          <div className={`sidebar-item ${activeView === 'vsphererelease' ? 'active' : ''}`} onClick={() => setActiveView('vsphererelease')}>
            <GrVmware className="sidebar-icon" />
            <span>vSphere Release</span>
          </div>
        </nav>

        {/* Bottone info */}
        <div className="sidebar-info-button-wrapper">
          <button className="sidebar-info-button" onClick={() => setShowModal(true)}>
            <FaInfoCircle className="sidebar-icon" /> Info
          </button>
        </div>

        {/* Utente e logout */}
        <div className="sidebar-user">
          <FaRegUserCircle className="sidebar-icon" />
          <div className="sidebar-user-info">
            <span className="user-name">{user?.email || 'Utente'}</span>
            <button className="logout-button" onClick={handleLogout}>
              <FaSignOutAlt className="sidebar-icon" /> Logout
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          {pkgjson.author}
        </div>
      </aside>

      {/* Main content */}
      <main className="homepage-main">
        <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard />
        </div>
        <div style={{ display: activeView === 'vsphererelease' ? 'block' : 'none' }}>
          <VSphereRelease />
        </div>
      </main>

      {/* Modal popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <img src={logo} alt="VMware Tech Hub" />
            <p>versione: <strong>{pkgjson.version}</strong></p>
            <p>build: <strong>{pkgjson.build}</strong></p>
            <p>ultimo aggiornamento: <strong>{pkgjson.updated}</strong></p>
            <p className="modal-footer">{pkgjson.author}</p>
            <button onClick={() => setShowModal(false)}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}
