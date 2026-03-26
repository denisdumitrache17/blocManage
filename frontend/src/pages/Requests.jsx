import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Badge, Button, Card, Col, Form, ListGroup, Modal, Row, Spinner, Table
} from 'react-bootstrap';
import { Eye, PlusCircle, StarFill, ClipboardX } from 'react-bootstrap-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

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

const SCOPE_LABELS = {
  PERSONAL: 'Personală (apartament)',
  BUILDING: 'Bloc (spațiu comun)'
};

const URGENCY_COLORS = {
  LOW: 'secondary',
  MEDIUM: 'warning',
  CRITICAL: 'danger'
};

const URGENCY_LABELS = {
  LOW: 'Scăzută',
  MEDIUM: 'Medie',
  CRITICAL: 'Critică'
};

const ALLOWED_TRANSITIONS = {
  PENDING: 'VALIDATED',
  VALIDATED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED'
};

const CATEGORY_OPTIONS = [
  'Instalații Sanitare (apă, canalizare)',
  'Instalații Electrice',
  'Curățenie și Igienizare',
  'Reparații Acoperiș / Hidroizolații',
  'Lifturi și Ascensoare',
  'Lăcătușerie și Interfoane',
  'Amenajări Spații Verzi / Exterioare'
];

const WORK_TYPE_OPTIONS = [
  'Reparație (Defecțiune/Avarie)',
  'Întreținere periodică / Mentenanță',
  'Instalare / Montaj echipament nou',
  'Remodernizare / Înlocuire totală',
  'Inspecție / Verificare tehnică'
];

const OTHER_VALUE = '__other__';

const createRequestSchema = z.object({
  categorySelect: z.string().min(1, 'Selectează o categorie'),
  categoryCustom: z.string().trim().max(100).optional(),
  workTypeSelect: z.string().min(1, 'Selectează un tip de lucrare'),
  workTypeCustom: z.string().trim().max(100).optional(),
  description: z.string().min(10, 'Minim 10 caractere'),
  urgencyLevel: z.enum(['LOW', 'MEDIUM', 'CRITICAL']),
  scope: z.enum(['PERSONAL', 'BUILDING'])
}).superRefine((data, ctx) => {
  if (data.categorySelect === OTHER_VALUE && (!data.categoryCustom || data.categoryCustom.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Introdu categoria (minim 2 caractere)', path: ['categoryCustom'] });
  }
  if (data.workTypeSelect === OTHER_VALUE && (!data.workTypeCustom || data.workTypeCustom.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Introdu tipul lucrării (minim 2 caractere)', path: ['workTypeCustom'] });
  }
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(3000).optional()
});

export default function Requests() {
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignRequestId, setAssignRequestId] = useState(null);
  const [firms, setFirms] = useState([]);
  const [selectedFirmId, setSelectedFirmId] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data.requests);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  /* ── Create request ──────────────────────────────── */
  const createForm = useForm({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { urgencyLevel: 'LOW', scope: 'PERSONAL' }
  });

  const onCreateSubmit = async (data) => {
    const payload = {
      category: data.categorySelect === OTHER_VALUE ? data.categoryCustom : data.categorySelect,
      workType: data.workTypeSelect === OTHER_VALUE ? data.workTypeCustom : data.workTypeSelect,
      description: data.description,
      urgencyLevel: data.urgencyLevel,
      scope: data.scope
    };
    try {
      await api.post('/requests', payload);
      setShowCreate(false);
      createForm.reset();
      await fetchRequests();
    } catch (err) {
      createForm.setError('root', { message: err.response?.data?.message || 'Eroare' });
    }
  };

  /* ── HOA approve / reject (BUILDING scope) ──────── */
  const handleHoaApprove = async (requestId) => {
    try {
      await api.patch(`/requests/${requestId}/hoa-approve`);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la aprobare');
    }
  };

  const handleHoaReject = async (requestId) => {
    try {
      await api.patch(`/requests/${requestId}/hoa-reject`);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la respingere');
    }
  };

  /* ── Update status ───────────────────────────────── */
  const handleStatusAdvance = async (requestId, currentStatus) => {
    const nextStatus = ALLOWED_TRANSITIONS[currentStatus];
    if (!nextStatus) return;
    try {
      await api.patch(`/requests/${requestId}/status`, { status: nextStatus });
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la actualizare status');
    }
  };

  /* ── Assign firm ─────────────────────────────────── */
  const openAssignModal = async (requestId) => {
    setAssignRequestId(requestId);
    try {
      const res = await api.get('/firms');
      setFirms(res.data.firms);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea firmelor');
    }
    setSelectedFirmId('');
    setShowAssign(true);
  };

  const handleAssignFirm = async () => {
    if (!selectedFirmId) return;
    try {
      await api.patch(`/requests/${assignRequestId}/assign-firm`, { firmId: selectedFirmId });
      setShowAssign(false);
      setSelectedFirmId('');
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la asignare firmă');
    }
  };

  /* ── Review ──────────────────────────────────────── */
  const reviewForm = useForm({ resolver: zodResolver(reviewSchema) });

  /* ── Detail view ─────────────────────────────────── */
  const openDetail = async (requestId) => {
    try {
      const res = await api.get(`/requests/${requestId}`);
      setDetailRequest(res.data.request);
      setShowDetail(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcarea detaliilor');
    }
  };

  const openReviewModal = (requestId) => {
    setReviewRequestId(requestId);
    reviewForm.reset();
    setShowReview(true);
  };

  const onReviewSubmit = async (data) => {
    try {
      await api.post('/reviews', { ...data, requestId: reviewRequestId });
      setShowReview(false);
      await fetchRequests();
    } catch (err) {
      reviewForm.setError('root', { message: err.response?.data?.message || 'Eroare' });
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const canCreate = role === 'TENANT' || role === 'HOA';
  const canAdvanceStatus = role === 'PLATFORM_ADMIN' || role === 'FIRM';

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Cereri</h4>
        {canCreate && (
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <PlusCircle className="me-1" /> Cerere nouă
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {requests.length === 0 ? (
        <EmptyState
          icon={<ClipboardX size={28} />}
          title="Nicio cerere"
          description="Nu ai cereri momentan. Creează una nouă pentru a începe."
        />
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Categorie</th>
                  <th>Tip lucrare</th>
                  <th>Tip</th>
                  <th>Descriere</th>
                  <th>Urgență</th>
                  <th>Status</th>
                  <th>Firmă</th>
                  <th>Recenzie</th>
                  <th className="text-end">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="fw-semibold">{req.category}</td>
                    <td>{req.workType || '—'}</td>
                    <td><Badge bg="secondary">{SCOPE_LABELS[req.scope] || req.scope}</Badge></td>
                    <td style={{ maxWidth: 300 }} className="text-truncate">{req.description}</td>
                    <td>
                      <Badge bg={URGENCY_COLORS[req.urgencyLevel]}>
                        {URGENCY_LABELS[req.urgencyLevel]}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={STATUS_COLORS[req.status]}>
                        {STATUS_LABELS[req.status]}
                      </Badge>
                    </td>
                    <td>{req.firm?.companyName || '—'}</td>
                    <td>
                      {req.review
                        ? <span>{req.review.rating} <StarFill className="text-warning" size={14} /></span>
                        : '—'}
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1"
                        onClick={() => openDetail(req.id)}
                      >
                        <Eye className="me-1" /> Detalii
                      </Button>
                      {canAdvanceStatus && ALLOWED_TRANSITIONS[req.status] && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleStatusAdvance(req.id, req.status)}
                        >
                          → {STATUS_LABELS[ALLOWED_TRANSITIONS[req.status]]}
                        </Button>
                      )}
                      {role === 'HOA' && req.status === 'PENDING_HOA_APPROVAL' && (
                        <>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-1"
                            onClick={() => handleHoaApprove(req.id)}
                          >
                            Aprobă
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="me-1"
                            onClick={() => handleHoaReject(req.id)}
                          >
                            Respinge
                          </Button>
                        </>
                      )}
                      {role === 'PLATFORM_ADMIN' && !req.firmId && req.status === 'PENDING' && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-1"
                          onClick={() => openAssignModal(req.id)}
                        >
                          Asignează firmă
                        </Button>
                      )}
                      {req.status === 'COMPLETED' && !req.review && (role === 'TENANT' || role === 'HOA') && (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => openReviewModal(req.id)}
                        >
                          <StarFill className="me-1" /> Recenzie
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

      {/* ── Create request modal ───────────────────── */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cerere nouă</Modal.Title>
        </Modal.Header>
        <Form onSubmit={createForm.handleSubmit(onCreateSubmit)} noValidate>
          <Modal.Body>
            {createForm.formState.errors.root && (
              <Alert variant="danger">{createForm.formState.errors.root.message}</Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Categoria Serviciului</Form.Label>
              <Form.Select
                isInvalid={!!createForm.formState.errors.categorySelect}
                {...createForm.register('categorySelect')}
              >
                <option value="">— Selectează categoria —</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value={OTHER_VALUE}>Altă variantă</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {createForm.formState.errors.categorySelect?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {createForm.watch('categorySelect') === OTHER_VALUE && (
              <Form.Group className="mb-3">
                <Form.Label>Specifică categoria</Form.Label>
                <Form.Control
                  isInvalid={!!createForm.formState.errors.categoryCustom}
                  {...createForm.register('categoryCustom')}
                  placeholder="Introdu categoria dorită"
                />
                <Form.Control.Feedback type="invalid">
                  {createForm.formState.errors.categoryCustom?.message}
                </Form.Control.Feedback>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Tipul Lucrării</Form.Label>
              <Form.Select
                isInvalid={!!createForm.formState.errors.workTypeSelect}
                {...createForm.register('workTypeSelect')}
              >
                <option value="">— Selectează tipul lucrării —</option>
                {WORK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value={OTHER_VALUE}>Altă variantă</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {createForm.formState.errors.workTypeSelect?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {createForm.watch('workTypeSelect') === OTHER_VALUE && (
              <Form.Group className="mb-3">
                <Form.Label>Specifică tipul lucrării</Form.Label>
                <Form.Control
                  isInvalid={!!createForm.formState.errors.workTypeCustom}
                  {...createForm.register('workTypeCustom')}
                  placeholder="Introdu tipul lucrării dorit"
                />
                <Form.Control.Feedback type="invalid">
                  {createForm.formState.errors.workTypeCustom?.message}
                </Form.Control.Feedback>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Descriere</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                isInvalid={!!createForm.formState.errors.description}
                {...createForm.register('description')}
              />
              <Form.Control.Feedback type="invalid">
                {createForm.formState.errors.description?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nivel urgență</Form.Label>
              <Form.Select {...createForm.register('urgencyLevel')}>
                <option value="LOW">Scăzută</option>
                <option value="MEDIUM">Medie</option>
                <option value="CRITICAL">Critică</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tipul intervenției:</Form.Label>
              <Form.Select
                isInvalid={!!createForm.formState.errors.scope}
                {...createForm.register('scope')}
              >
                <option value="PERSONAL">Intervenție personală (în apartament)</option>
                <option value="BUILDING">Intervenție pentru bloc (spațiu comun)</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {createForm.formState.errors.scope?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Anulează</Button>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting ? <Spinner size="sm" animation="border" /> : 'Trimite'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Review modal ───────────────────────────── */}
      <Modal show={showReview} onHide={() => setShowReview(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Adaugă recenzie</Modal.Title>
        </Modal.Header>
        <Form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} noValidate>
          <Modal.Body>
            {reviewForm.formState.errors.root && (
              <Alert variant="danger">{reviewForm.formState.errors.root.message}</Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Rating (1–5)</Form.Label>
              <Form.Select {...reviewForm.register('rating')}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v} {v === 1 ? 'stea' : 'stele'}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Comentariu <span className="text-muted">(opțional)</span></Form.Label>
              <Form.Control as="textarea" rows={3} {...reviewForm.register('comment')} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReview(false)}>Anulează</Button>
            <Button type="submit" variant="warning" disabled={reviewForm.formState.isSubmitting}>
              {reviewForm.formState.isSubmitting ? <Spinner size="sm" animation="border" /> : 'Trimite recenzie'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Assign firm modal ──────────────────────── */}
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

      {/* ── Detail modal ───────────────────────────── */}
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
              <Col sm={8}>
                <Badge bg="secondary">{SCOPE_LABELS[detailRequest.scope] || detailRequest.scope}</Badge>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Categorie</Col>
              <Col sm={8}>{detailRequest.category}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="fw-semibold">Tip lucrare</Col>
              <Col sm={8}>{detailRequest.workType || '—'}</Col>
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
                  <Col sm={4} className="fw-semibold">Adresă locatar</Col>
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
                <Row className="mb-2">
                  <Col sm={4} className="fw-semibold">Email firmă</Col>
                  <Col sm={8}>{detailRequest.firm.email}</Col>
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

            {detailRequest.invoices?.length > 0 && (
              <>
                <hr />
                <h6>Facturi</h6>
                <ListGroup variant="flush">
                  {detailRequest.invoices.map((inv) => (
                    <ListGroup.Item key={inv.id} className="d-flex justify-content-between">
                      <span>{inv.description || inv.id}</span>
                      <Badge bg={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'danger' : 'secondary'}>
                        {inv.status}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
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
    </>
  );
}
