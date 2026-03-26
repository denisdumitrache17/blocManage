import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap';
import { ClipboardCheck, Building, Receipt, People, CheckCircle, XCircle, ExclamationTriangleFill, BellFill, FileEarmarkText } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import {
  IconTotalCereri, IconInAsteptare, IconInLucru, IconFinalizate,
  IconContracte, IconFirme, IconFacturi, IconFacturiNeplatite
} from '../components/DashboardIcons';

const STAT_ICONS = {
  requests: ClipboardCheck,
  firms: Building,
  invoices: Receipt,
  tenants: People
};

const STATUS_LABELS = {
  PENDING: 'În așteptare',
  PENDING_HOA_APPROVAL: 'Aprobare HOA',
  VALIDATED: 'Validată',
  IN_PROGRESS: 'În lucru',
  COMPLETED: 'Finalizată',
  REJECTED: 'Respinsă'
};

const INVOICE_STATUS_LABELS = { UNPAID: 'Neplătită', PAID: 'Plătită', OVERDUE: 'Întârziată' };

export default function Dashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [buildingRequests, setBuildingRequests] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [updatedRequests, setUpdatedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const promises = [api.get('/requests'), api.get('/invoices'), api.get('/firms'), api.get('/contracts')];

        if (role === 'HOA') {
          promises.push(api.get('/hoa/tenants'));
        }

        const results = await Promise.all(promises);
        const requests = results[0].data.requests;
        const invoices = results[1].data.invoices;
        const firmsData = results[2].data.firms;
        const contractsData = results[3].data.contracts;

        const tenantsResult = role === 'HOA' ? results[4] : null;

        const s = {
          requests: requests.length,
          pending: requests.filter((r) => r.status === 'PENDING').length,
          inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
          completed: requests.filter((r) => r.status === 'COMPLETED').length,
          firms: firmsData?.length ?? 0,
          invoices: invoices.length,
          unpaidCount: invoices.filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE').length,
          contracts: contractsData?.length ?? 0
        };

        setStats(s);

        // Facturi neplătite
        const unpaid = invoices.filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE');
        if (role === 'HOA') {
          setUnpaidInvoices(unpaid.filter((inv) =>
            inv.clientId === user.id || inv.request?.scope === 'BUILDING'
          ));
        } else if (role === 'TENANT') {
          setUnpaidInvoices(unpaid.filter((inv) => inv.request?.scope !== 'BUILDING'));
        } else {
          // PLATFORM_ADMIN & FIRM — vede toate facturile neplătite
          setUnpaidInvoices(unpaid);
        }

        // Cereri acceptate (VALIDATED) sau cu firmă asignată (IN_PROGRESS)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const acceptedOrAssigned = requests.filter((r) => {
          const updated = new Date(r.updatedAt);
          if (updated < sevenDaysAgo) return false;
          if (role === 'HOA') {
            if (r.requesterId !== user.id && r.scope !== 'BUILDING') return false;
          }
          return r.status === 'VALIDATED' || r.status === 'IN_PROGRESS';
        });
        setUpdatedRequests(acceptedOrAssigned);

        if (role === 'HOA' && tenantsResult) {
          const tenants = tenantsResult.data.tenants;
          setPendingTenants(tenants.filter((t) => !t.isApproved));
          setBuildingRequests(
            requests.filter((r) => r.scope === 'BUILDING' && r.status === 'PENDING_HOA_APPROVAL')
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Eroare la încărcarea datelor');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [role, user?.id]);

  const handleApproval = async (tenantId, isApproved) => {
    try {
      await api.patch(`/hoa/tenants/${tenantId}/approval`, { isApproved });
      setPendingTenants((prev) => prev.filter((t) => t.id !== tenantId));
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la actualizare');
    }
  };

  const handleRejectTenant = async (tenantId) => {
    try {
      await api.delete(`/hoa/tenants/${tenantId}`);
      setPendingTenants((prev) => prev.filter((t) => t.id !== tenantId));
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la respingere');
    }
  };

  const handleHoaApprove = async (requestId) => {
    try {
      await api.patch(`/requests/${requestId}/hoa-approve`);
      setBuildingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la aprobare');
    }
  };

  const handleHoaReject = async (requestId) => {
    try {
      await api.patch(`/requests/${requestId}/hoa-reject`);
      setBuildingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la respingere');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const profileName = user?.profile?.firstName
    || user?.profile?.presidentName
    || user?.profile?.companyName
    || user?.email;

  return (
    <>
      <h4 className="mb-4">Bun venit, {profileName}!</h4>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stat cards */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Total cereri', value: stats?.requests, Illustration: IconTotalCereri, to: '/requests' },
          { label: 'În așteptare', value: stats?.pending, Illustration: IconInAsteptare, to: '/requests' },
          { label: 'În lucru', value: stats?.inProgress, Illustration: IconInLucru, to: '/requests' },
          { label: 'Finalizate', value: stats?.completed, Illustration: IconFinalizate, to: '/requests' }
        ].map((card) => (
          <Col xs={6} md={3} key={card.label}>
            <Card
              className="text-center h-100 card-hover-lift"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(card.to)}
            >
              <Card.Body className="py-3">
                <card.Illustration size={56} />
                <h3 className="fw-bold mb-0 mt-2">{card.value ?? 0}</h3>
                <small className="text-muted">{card.label}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Shortcut cards - Firme, Facturi, Contracte */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card
            className="text-center h-100 card-hover-lift"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/firms')}
          >
            <Card.Body className="py-3">
              <IconFirme size={56} />
              <h3 className="fw-bold mb-0 mt-2">{stats?.firms ?? 0}</h3>
              <small className="text-muted">Firme partenere</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="text-center h-100 card-hover-lift"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/invoices')}
          >
            <Card.Body className="py-3">
              <IconFacturi size={56} />
              <h3 className="fw-bold mb-0 mt-2">{stats?.invoices ?? 0}</h3>
              <small className="text-muted">Total facturi</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card
            className="text-center h-100 card-hover-lift"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/contracts')}
          >
            <Card.Body className="py-3">
              <IconContracte size={56} />
              <h3 className="fw-bold mb-0 mt-2">{stats?.contracts ?? 0}</h3>
              <small className="text-muted">Contracte</small>
            </Card.Body>
          </Card>
        </Col>
        {stats?.unpaidCount > 0 && (
          <Col xs={6} md={3}>
            <Card
              className="text-center h-100 card-hover-lift border-danger border-opacity-25"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/invoices')}
            >
              <Card.Body className="py-3">
                <IconFacturiNeplatite size={56} />
                <h3 className="fw-bold mb-0 mt-2 text-danger">{stats.unpaidCount}</h3>
                <small className="text-muted">Facturi neplătite</small>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Notificări facturi neplătite */}
      {unpaidInvoices.length > 0 && (
        <Card className="shadow-sm mb-4 border-danger border-opacity-25">
          <Card.Header className="bg-danger bg-opacity-10 fw-semibold d-flex align-items-center">
            <BellFill className="me-2 text-danger" />
            Facturi neplătite ({unpaidInvoices.length})
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Sumă</th>
                  <th>Status</th>
                  <th>Categorie cerere</th>
                  <th>Scop</th>
                  <th>Firmă</th>
                  <th>Data emitere</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unpaidInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="fw-bold">{Number(inv.amount).toFixed(2)} RON</td>
                    <td>
                      <Badge bg={inv.status === 'OVERDUE' ? 'danger' : 'warning'}>
                        {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </td>
                    <td>{inv.request?.category || '—'}</td>
                    <td>
                      <Badge bg={inv.request?.scope === 'BUILDING' ? 'info' : 'secondary'}>
                        {inv.request?.scope === 'BUILDING' ? 'Bloc' : 'Personal'}
                      </Badge>
                    </td>
                    <td>{inv.firm?.companyName || '—'}</td>
                    <td>{new Date(inv.createdAt).toLocaleDateString('ro-RO')}</td>
                    <td className="text-end">
                      <Button variant="outline-primary" size="sm" onClick={() => navigate('/invoices')}>
                        Vezi facturi
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Notificări cereri acceptate / firmă asignată */}
      {updatedRequests.length > 0 && (
        <Card className="shadow-sm mb-4 border-success border-opacity-25">
          <Card.Header className="bg-success bg-opacity-10 fw-semibold d-flex align-items-center">
            <BellFill className="me-2 text-success" />
            Cereri acceptate / cu firmă asignată ({updatedRequests.length})
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Categorie</th>
                  <th>Descriere</th>
                  <th>Scop</th>
                  <th>Status</th>
                  <th>Firmă asignată</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {updatedRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-semibold">{r.category}</td>
                    <td style={{ maxWidth: 200 }} className="text-truncate">{r.description}</td>
                    <td>
                      <Badge bg={r.scope === 'BUILDING' ? 'info' : 'secondary'}>
                        {r.scope === 'BUILDING' ? 'Bloc' : 'Personal'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={r.status === 'IN_PROGRESS' ? 'info' : 'primary'}>
                        {r.status === 'IN_PROGRESS' ? 'Firmă asignată' : 'Validată'}
                      </Badge>
                    </td>
                    <td>{r.firm?.companyName || '—'}</td>
                    <td>{new Date(r.updatedAt).toLocaleDateString('ro-RO')}</td>
                    <td className="text-end">
                      <Button variant="outline-primary" size="sm" onClick={() => navigate('/requests')}>
                        Vezi cereri
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Pending tenants – HOA only */}
      {role === 'HOA' && pendingTenants.length > 0 && (
        <Card className="shadow-sm border-danger border-opacity-25">
          <Card.Header className="bg-danger bg-opacity-10 fw-semibold d-flex align-items-center">
            <People className="me-2 text-danger" />
            Locatari în așteptarea aprobării
            <Badge bg="danger" className="ms-2">{pendingTenants.length}</Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Scara</th>
                  <th>Apartament</th>
                  <th>Telefon</th>
                  <th className="text-end">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {pendingTenants.map((t) => (
                  <tr key={t.id}>
                    <td>{t.firstName} {t.lastName}</td>
                    <td>{t.staircase?.name || '—'}</td>
                    <td>{t.apartmentNumber}</td>
                    <td>{t.phone}</td>
                    <td className="text-end">
                      <Button
                        variant="success"
                        size="sm"
                        className="me-1"
                        onClick={() => handleApproval(t.id, true)}
                      >
                        <CheckCircle className="me-1" /> Aprobă
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectTenant(t.id)}
                      >
                        <XCircle className="me-1" /> Respinge
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {role === 'TENANT' && !user?.profile?.isApproved && (
        <Alert variant="warning">
          Contul tău nu a fost încă aprobat de asociație. Nu poți crea cereri până la aprobare.
        </Alert>
      )}

      {/* Building requests pending HOA approval */}
      {role === 'HOA' && buildingRequests.length > 0 && (
        <Card className="shadow-sm mt-4">
          <Card.Header className="bg-info bg-opacity-10 fw-semibold">
            <ExclamationTriangleFill className="me-2" />
            Sesizări bloc în așteptarea aprobării tale ({buildingRequests.length})
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Categorie</th>
                  <th>Descriere</th>
                  <th>Urgență</th>
                  <th>Solicitant</th>
                  <th className="text-end">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {buildingRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-semibold">{r.category}</td>
                    <td style={{ maxWidth: 250 }} className="text-truncate">{r.description}</td>
                    <td>
                      <Badge bg={r.urgencyLevel === 'CRITICAL' ? 'danger' : r.urgencyLevel === 'MEDIUM' ? 'warning' : 'secondary'}>
                        {r.urgencyLevel === 'CRITICAL' ? 'Critică' : r.urgencyLevel === 'MEDIUM' ? 'Medie' : 'Scăzută'}
                      </Badge>
                    </td>
                    <td>{r.requester?.email || '—'}</td>
                    <td className="text-end">
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="me-1"
                        onClick={() => handleHoaApprove(r.id)}
                      >
                        <CheckCircle className="me-1" /> Aprobă
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleHoaReject(r.id)}
                      >
                        <XCircle className="me-1" /> Respinge
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </>
  );
}
