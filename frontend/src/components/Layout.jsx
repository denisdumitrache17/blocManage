import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Offcanvas, Button } from 'react-bootstrap';
import {
  HouseDoorFill,
  ClipboardCheck,
  Building,
  Receipt,
  FileEarmarkText,
  BoxArrowRight,
  List as ListIcon,
  PersonCircle,
  People,
  GearFill,
  ShieldLockFill
} from 'react-bootstrap-icons';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = { TENANT: 'Locatar', HOA: 'Asociație', FIRM: 'Firmă', PLATFORM_ADMIN: 'Admin' };

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Panou principal', icon: HouseDoorFill, roles: null },
  { to: '/admin', label: 'Admin Platformă', icon: ShieldLockFill, roles: ['PLATFORM_ADMIN'] },
  { to: '/requests', label: 'Cereri', icon: ClipboardCheck, roles: null },
  { to: '/firms', label: 'Firme', icon: Building, roles: ['HOA', 'TENANT', 'FIRM', 'PLATFORM_ADMIN'] },
  { to: '/invoices', label: 'Facturi', icon: Receipt, roles: null },
  { to: '/contracts', label: 'Contracte', icon: FileEarmarkText, roles: ['HOA', 'TENANT', 'FIRM', 'PLATFORM_ADMIN'] },
  { to: '/tenants', label: 'Locatari', icon: People, roles: ['HOA'] },
  { to: '/settings', label: 'Setări', icon: GearFill, roles: null }
];

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  const navLinks = visibleItems.map((item) => (
    <Nav.Link
      as={Link}
      to={item.to}
      key={item.to}
      active={location.pathname === item.to}
      className="d-flex align-items-center gap-2 py-2"
      onClick={() => setShowSidebar(false)}
    >
      <item.icon size={18} />
      {item.label}
    </Nav.Link>
  ));

  return (
    <>
      {/* Top navbar */}
      <Navbar variant="dark" expand={false} className="px-3 top-navbar">
        <Button
          variant="outline-light"
          size="sm"
          className="d-lg-none me-2"
          onClick={() => setShowSidebar(true)}
        >
          <ListIcon size={20} />
        </Button>
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold" style={{ letterSpacing: '-.02em' }}>
          BlocManage
        </Navbar.Brand>
        <div className="ms-auto d-flex align-items-center gap-3 text-white">
          <span className="d-none d-sm-inline small">
            <PersonCircle size={16} className="me-1" />
            {user?.email} ({ROLE_LABELS[role] || role})
          </span>
          <Button variant="outline-light" size="sm" onClick={handleLogout}>
            <BoxArrowRight size={16} className="me-1" />
            Ieșire
          </Button>
        </div>
      </Navbar>

      <div className="d-flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* Sidebar – desktop */}
        <div
          className="d-none d-lg-flex flex-column sidebar p-3"
          style={{ width: 240 }}
        >
          <Nav className="flex-column">{navLinks}</Nav>
        </div>

        {/* Sidebar – mobile offcanvas */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Meniu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column">{navLinks}</Nav>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main content */}
        <Container fluid className="p-4" style={{ flex: 1 }}>
          <Outlet />
        </Container>
      </div>
    </>
  );
}
