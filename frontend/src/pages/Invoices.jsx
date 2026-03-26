import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table
} from 'react-bootstrap';
import { PlusCircle, Download, Eye, StarFill, ReceiptCutoff, Upload } from 'react-bootstrap-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:4000';

const STATUS_COLORS = {
  UNPAID: 'danger',
  PAID: 'success',
  OVERDUE: 'warning'
};

const STATUS_LABELS = {
  UNPAID: 'Neplătită',
  PAID: 'Plătită',
  OVERDUE: 'Întârziată'
};

const createInvoiceSchema = z.object({
  requestId: z.string().uuid('Selectează o cerere'),
  amount: z.coerce.number().positive('Suma trebuie să fie pozitivă')
});

export default function Invoices() {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const createForm = useForm({
    resolver: zodResolver(createInvoiceSchema)
  });

  const onCreateSubmit = async (data) => {
    try {
      await api.post('/invoices', data);
      setShowCreate(false);
      createForm.reset();
      await fetchInvoices();
    } catch (err) {
      createForm.setError('root', { message: err.response?.data?.message || 'Eroare' });
    }
  };

  const handleStatusUpdate = async (invoiceId, status) => {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status });
      await fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la actualizare status');
    }
  };

  const handleDownload = (pdfUrl) => {
    const url = pdfUrl.startsWith('http') ? pdfUrl : `${API_BASE}${pdfUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const pdfInputRef = useRef(null);
  const pendingInvoiceIdRef = useRef(null);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState(null);

  const handleUploadPdf = async (invoiceId, file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      setUploadingInvoiceId(invoiceId);
      await api.patch(`/invoices/${invoiceId}/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea PDF-ului');
    } finally {
      setUploadingInvoiceId(null);
    }
  };

  const openDetail = async (requestId) => {
    try {
      const res = await api.get(`/requests/${requestId}`);
      setDetailRequest(res.data.request);
      setShowDetail(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea detaliilor');
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Facturi</h4>
        {role === 'PLATFORM_ADMIN' && (
          <Button variant="primary" onClick={async () => {
            try {
              const res = await api.get('/requests');
              setRequests(res.data.requests);
            } catch { /* ignore */ }
            createForm.reset();
            setShowCreate(true);
          }}>
            <PlusCircle className="me-1" /> Factură nouă
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptCutoff size={28} />}
          title="Nicio factură"
          description="Facturile vor apărea aici după ce sunt emise."
        />
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID cerere</th>
                  <th>Sumă (RON)</th>
                  <th>Status</th>
                  <th>Creat la</th>
                  <th className="text-end">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-monospace small">{inv.requestId?.slice(0, 8)}…</td>
                    <td className="fw-semibold">{parseFloat(inv.amount).toFixed(2)}</td>
                    <td>
                      <Badge bg={STATUS_COLORS[inv.status]}>
                        {STATUS_LABELS[inv.status]}
                      </Badge>
                    </td>
                    <td>{new Date(inv.createdAt).toLocaleDateString('ro-RO')}</td>
                    <td className="text-end">
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1"
                        onClick={() => openDetail(inv.requestId)}
                      >
                        <Eye className="me-1" /> Detalii
                      </Button>
                      {inv.status === 'UNPAID' && role === 'PLATFORM_ADMIN' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          onClick={() => handleStatusUpdate(inv.id, 'PAID')}
                        >
                          Marchează plătită
                        </Button>
                      )}
                      {role === 'PLATFORM_ADMIN' && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            disabled={!!uploadingInvoiceId}
                            onClick={() => {
                              pendingInvoiceIdRef.current = inv.id;
                              pdfInputRef.current?.click();
                            }}
                          >
                            {uploadingInvoiceId === inv.id
                              ? <Spinner size="sm" animation="border" />
                              : <><Upload className="me-1" /> {inv.pdfUrl ? 'Reîncarcă PDF' : 'Încarcă PDF'}</>}
                          </Button>
                      )}
                      {inv.pdfUrl && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleDownload(inv.pdfUrl)}
                        >
                          <Download className="me-1" /> PDF
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Hidden file input for PDF uploads */}
      <input
        type="file"
        accept="application/pdf"
        className="d-none"
        ref={pdfInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          const invoiceId = pendingInvoiceIdRef.current;
          if (file && invoiceId) {
            handleUploadPdf(invoiceId, file);
          }
          e.target.value = '';
          pendingInvoiceIdRef.current = null;
        }}
      />

      {/* ── Detail modal (request info) ───────────── */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalii cerere asociată</Modal.Title>
        </Modal.Header>
        {detailRequest && (
          <Modal.Body>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">ID cerere</Col>
              <Col sm={8}><code>{detailRequest.id}</code></Col>
            </Row>
            {detailRequest.scope && (
              <Row className="mb-3">
                <Col sm={4} className="fw-semibold">Tip intervenție</Col>
                <Col sm={8}>
                  <Badge bg="secondary">
                    {detailRequest.scope === 'PERSONAL' ? 'Personală (apartament)' : 'Bloc (spațiu comun)'}
                  </Badge>
                </Col>
              </Row>
            )}
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
                <Badge bg={detailRequest.urgencyLevel === 'CRITICAL' ? 'danger' : detailRequest.urgencyLevel === 'MEDIUM' ? 'warning' : 'secondary'}>
                  {detailRequest.urgencyLevel === 'CRITICAL' ? 'Critică' : detailRequest.urgencyLevel === 'MEDIUM' ? 'Medie' : 'Scăzută'}
                </Badge>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Status cerere</Col>
              <Col sm={8}><Badge bg="primary">{detailRequest.status}</Badge></Col>
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
                  <Col sm={4} className="fw-semibold">Nume</Col>
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
              </>
            )}

            {detailRequest.review && (
              <>
                <hr />
                <h6>Recenzie</h6>
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Rating</Col>
                  <Col sm={8}>
                    {detailRequest.review.rating} <StarFill className="text-warning" size={14} />
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
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>Închide</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Create invoice modal ───────────────────── */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Factură nouă</Modal.Title>
        </Modal.Header>
        <Form onSubmit={createForm.handleSubmit(onCreateSubmit)} noValidate>
          <Modal.Body>
            {createForm.formState.errors.root && (
              <Alert variant="danger">{createForm.formState.errors.root.message}</Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Cerere asociată</Form.Label>
              <Form.Select
                isInvalid={!!createForm.formState.errors.requestId}
                {...createForm.register('requestId')}
              >
                <option value="">— Selectează o cerere —</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.category} — {r.description?.slice(0, 50)}{r.description?.length > 50 ? '…' : ''} ({r.status})
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {createForm.formState.errors.requestId?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sumă (RON)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                isInvalid={!!createForm.formState.errors.amount}
                {...createForm.register('amount')}
              />
              <Form.Control.Feedback type="invalid">
                {createForm.formState.errors.amount?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Anulează</Button>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting ? <Spinner size="sm" animation="border" /> : 'Crează factură'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
