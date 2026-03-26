import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table
} from 'react-bootstrap';
import { ClipboardCheck, Receipt, Building, Eye, StarFill } from 'react-bootstrap-icons';
import api from '../api/axios';

const STATUS_COLORS = {
  PENDING: 'warning',
  PENDING_HOA_APPROVAL: 'info',
  VALIDATED: 'info',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  REJECTED: 'danger'
};

const STATUS_LABELS = {
  PENDING: 'În așteptare',
  PENDING_HOA_APPROVAL: 'Aprobare HOA',
  VALIDATED: 'Validată',
  IN_PROGRESS: 'În lucru',
  COMPLETED: 'Finalizată',
  REJECTED: 'Respinsă'
};

const INVOICE_STATUS_COLORS = { UNPAID: 'danger', PAID: 'success', OVERDUE: 'warning' };
const INVOICE_STATUS_LABELS = { UNPAID: 'Neplătită', PAID: 'Plătită', OVERDUE: 'Întârziată' };

const SCOPE_LABELS = { PERSONAL: 'Personală', BUILDING: 'Bloc' };

const URGENCY_LABELS = { LOW: 'Scăzută', MEDIUM: 'Medie', CRITICAL: 'Critică' };
const URGENCY_COLORS = { LOW: 'secondary', MEDIUM: 'warning', CRITICAL: 'danger' };

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAssign, setShowAssign] = useState(false);
  const [assignRequestId, setAssignRequestId] = useState(null);
  const [selectedFirmId, setSelectedFirmId] = useState('');

  const [showDetail, setShowDetail] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [reqRes, invRes, firmRes] = await Promise.all([
        api.get('/requests'),
        api.get('/invoices'),
        api.get('/firms')
      ]);
      setRequests(reqRes.data.requests);
      setInvoices(invRes.data.invoices);
      setFirms(firmRes.data.firms);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  const openDetail = async (requestId) => {
    try {
      const res = await api.get(`/requests/${requestId}`);
      setDetailRequest(res.data.request);
      setShowDetail(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea detaliilor');
    }
  };

  const openAssignModal = (requestId) => {
    setAssignRequestId(requestId);
    setSelectedFirmId('');
    setShowAssign(true);
  };

  const handleAssignFirm = async () => {
    if (!selectedFirmId) return;
    try {
      await api.patch(`/requests/${assignRequestId}/assign-firm`, { firmId: selectedFirmId });
      setShowAssign(false);
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la asignare');
    }
  };

  const handleStatusAdvance = async (requestId, currentStatus) => {
    const transitions = { PENDING: 'VALIDATED', VALIDATED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED' };
    const next = transitions[currentStatus];
    if (!next) return;
    try {
      await api.patch(`/requests/${requestId}/status`, { status: next });
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la actualizare status');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <h4 className="mb-4">Panou Administrator Platformă</h4>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Stat cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <ClipboardCheck size={28} className="text-primary mb-2" />
              <h3 className="fw-bold mb-0">{requests.length}</h3>
              <small className="text-muted">Total cereri</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <Receipt size={28} className="text-warning mb-2" />
              <h3 className="fw-bold mb-0">{invoices.length}</h3>
              <small className="text-muted">Total facturi</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <Building size={28} className="text-success mb-2" />
              <h3 className="fw-bold mb-0">{firms.length}</h3>
              <small className="text-muted">Firme partenere</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pending requests */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-warning bg-opacity-10 fw-semibold">
          <ClipboardCheck className="me-2" />
          Cereri în așteptare ({pendingRequests.length})
        </Card.Header>
        <Card.Body className="p-0">
          {pendingRequests.length === 0 ? (
            <Alert variant="info" className="m-3 mb-0">Nu există cereri în așteptare.</Alert>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Categorie</th>
                  <th>Tip</th>
                  <th>Descriere</th>
                  <th>Urgență</th>
                  <th>Firmă</th>
                  <th className="text-end">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="fw-semibold">{req.category}</td>
                    <td><Badge bg="secondary">{SCOPE_LABELS[req.scope] || req.scope}</Badge></td>
                    <td style={{ maxWidth: 250 }} className="text-truncate">{req.description}</td>
                    <td>
                      <Badge bg={req.urgencyLevel === 'CRITICAL' ? 'danger' : req.urgencyLevel === 'MEDIUM' ? 'warning' : 'secondary'}>
                        {req.urgencyLevel === 'CRITICAL' ? 'Critică' : req.urgencyLevel === 'MEDIUM' ? 'Medie' : 'Scăzută'}
                      </Badge>
                    </td>
                    <td>{req.firm?.companyName || '—'}</td>
                    <td className="text-end">
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1"
                        onClick={() => openDetail(req.id)}
                      >
                        <Eye className="me-1" /> Detalii
                      </Button>
                      {!req.firmId && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-1"
                          onClick={() => openAssignModal(req.id)}
                        >
                          Asignează firmă
                        </Button>
                      )}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleStatusAdvance(req.id, req.status)}
                      >
                        → {STATUS_LABELS.VALIDATED}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* All invoices */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-info bg-opacity-10 fw-semibold">
          <Receipt className="me-2" />
          Toate facturile ({invoices.length})
        </Card.Header>
        <Card.Body className="p-0">
          {invoices.length === 0 ? (
            <Alert variant="info" className="m-3 mb-0">Nu există facturi.</Alert>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID cerere</th>
                  <th>Sumă (RON)</th>
                  <th>Status</th>
                  <th>Creat la</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-monospace small">{inv.requestId?.slice(0, 8)}…</td>
                    <td className="fw-semibold">{parseFloat(inv.amount).toFixed(2)}</td>
                    <td>
                      <Badge bg={INVOICE_STATUS_COLORS[inv.status]}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    </td>
                    <td>{new Date(inv.createdAt).toLocaleDateString('ro-RO')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Detail modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalii cerere</Modal.Title>
        </Modal.Header>
        {detailRequest && (
          <Modal.Body>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">ID cerere</Col>
              <Col sm={8}><code>{detailRequest.id}</code></Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Tip intervenție</Col>
              <Col sm={8}><Badge bg="secondary">{SCOPE_LABELS[detailRequest.scope] || detailRequest.scope}</Badge></Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Categorie</Col>
              <Col sm={8}>{detailRequest.category}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Descriere completă</Col>
              <Col sm={8} style={{ whiteSpace: 'pre-wrap' }}>{detailRequest.description}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Nivel urgență</Col>
              <Col sm={8}>
                <Badge bg={URGENCY_COLORS[detailRequest.urgencyLevel]}>
                  {URGENCY_LABELS[detailRequest.urgencyLevel]}
                </Badge>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Status</Col>
              <Col sm={8}>
                <Badge bg={STATUS_COLORS[detailRequest.status]}>
                  {STATUS_LABELS[detailRequest.status]}
                </Badge>
              </Col>
            </Row>

            <hr />
            <h6>Solicitant</h6>
            <Row className="mb-2">
              <Col sm={4} className="fw-semibold">Email</Col>
              <Col sm={8}>{detailRequest.requester?.email}</Col>
            </Row>
            {detailRequest.requester?.tenant && (
              <>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Nume locatar</Col>
                  <Col sm={8}>
                    {detailRequest.requester.tenant.firstName}{' '}
                    {detailRequest.requester.tenant.lastName}
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Adresă</Col>
                  <Col sm={8}>{detailRequest.requester.tenant.addressText}</Col>
                </Row>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Apartament</Col>
                  <Col sm={8}>{detailRequest.requester.tenant.apartmentNumber}</Col>
                </Row>
                {detailRequest.requester.tenant.hoa && (
                  <Row className="mb-2">
                    <Col sm={4} className="fw-semibold">Bloc / Asociație</Col>
                    <Col sm={8}>{detailRequest.requester.tenant.hoa.buildingAddress}</Col>
                  </Row>
                )}
              </>
            )}
            {detailRequest.requester?.hoa && (
              <Row className="mb-2">
                <Col sm={4} className="fw-semibold">Adresă bloc (HOA)</Col>
                <Col sm={8}>{detailRequest.requester.hoa.buildingAddress}</Col>
              </Row>
            )}

            {detailRequest.firm && (
              <>
                <hr />
                <h6>Firmă asignată</h6>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Companie</Col>
                  <Col sm={8}>{detailRequest.firm.companyName}</Col>
                </Row>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">CUI</Col>
                  <Col sm={8}>{detailRequest.firm.cui}</Col>
                </Row>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Telefon</Col>
                  <Col sm={8}>{detailRequest.firm.phone}</Col>
                </Row>
              </>
            )}

            {detailRequest.review && (
              <>
                <hr />
                <h6>Recenzie</h6>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Rating</Col>
                  <Col sm={8}>
                    {detailRequest.review.rating}{' '}
                    <StarFill className="text-warning" size={14} />
                  </Col>
                </Row>
                {detailRequest.review.comment && (
                  <Row className="mb-2">
                    <Col sm={4} className="fw-semibold">Comentariu</Col>
                    <Col sm={8}>{detailRequest.review.comment}</Col>
                  </Row>
                )}
              </>
            )}

            <hr />
            <Row className="mb-2">
              <Col sm={4} className="text-muted">Creat la</Col>
              <Col sm={8}>{new Date(detailRequest.createdAt).toLocaleString('ro-RO')}</Col>
            </Row>
            <Row>
              <Col sm={4} className="text-muted">Actualizat la</Col>
              <Col sm={8}>{new Date(detailRequest.updatedAt).toLocaleString('ro-RO')}</Col>
            </Row>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>Închide</Button>
        </Modal.Footer>
      </Modal>

      {/* Assign firm modal */}
      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Asignează firmă</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Selectează firma</Form.Label>
            <Form.Select
              value={selectedFirmId}
              onChange={(e) => setSelectedFirmId(e.target.value)}
            >
              <option value="">— Alege o firmă —</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.companyName} (CUI: {f.cui})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)}>Anulează</Button>
          <Button onClick={handleAssignFirm} disabled={!selectedFirmId}>Asignează</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
