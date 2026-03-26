import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { StarFill, Star, GeoAlt, Telephone, EnvelopeAt, CollectionFill, ChatLeftTextFill, BuildingX } from 'react-bootstrap-icons';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:4000';

function portfolioImgSrc(imageUrl) {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}

export default function Firms() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [reviewFirm, setReviewFirm] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchFirms = async () => {
      try {
        const res = await api.get('/firms');
        setFirms(res.data.firms);
      } catch (err) {
        setError(err.response?.data?.message || 'Eroare la încărcarea firmelor');
      } finally {
        setLoading(false);
      }
    };

    fetchFirms();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const openReviews = async (firm) => {
    setReviewFirm(firm);
    setLoadingReviews(true);
    try {
      const res = await api.get(`/firms/${firm.id}`);
      setReviews(res.data.firm.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const reviewerName = (reviewer) => {
    if (!reviewer) return 'Anonim';
    if (reviewer.tenant) return `${reviewer.tenant.firstName} ${reviewer.tenant.lastName}`;
    if (reviewer.hoa) return reviewer.hoa.presidentName;
    return reviewer.email;
  };

  const avgRating = (ratings) => {
    if (!ratings.length) return null;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  };

  return (
    <>
      <h4 className="mb-4">Firme</h4>

      {error && <Alert variant="danger">{error}</Alert>}

      {firms.length === 0 ? (
        <EmptyState
          icon={<BuildingX size={28} />}
          title="Nicio firmă"
          description="Firmele partenere vor apărea aici după înregistrare."
        />
      ) : (
        <Row className="g-3">
          {firms.map((firm) => (
            <Col xs={12} md={6} lg={4} key={firm.id}>
              <Card className="h-100 card-hover-lift">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold mb-0">{firm.companyName}</h5>
                    {avgRating(firm.ratings) && (
                      <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1">
                        <StarFill size={12} /> {avgRating(firm.ratings)}
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted small mb-1">
                    <strong>CUI:</strong> {firm.cui} &middot; <strong>CAEN:</strong> {firm.caen}
                  </p>

                  <p className="small mb-1">
                    <GeoAlt className="me-1" /> {firm.hqAddress}
                  </p>
                  <p className="small mb-1">
                    <Telephone className="me-1" /> {firm.phone}
                  </p>
                  <p className="small mb-2">
                    <EnvelopeAt className="me-1" /> {firm.email}
                  </p>

                  {firm.domains?.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted fw-semibold">Domenii de activitate:</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {firm.domains.map((d) => (
                          <Badge key={d} bg="info" text="dark" className="fw-normal">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {firm.portfolios.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted fw-semibold">Portofoliu:</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {firm.portfolios.map((p) => (
                          <Badge key={p.id} bg="light" text="dark" className="border">
                            {p.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    {firm.portfolios.length > 0 && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                        onClick={() => setSelectedFirm(firm)}
                      >
                        <CollectionFill className="me-1" /> Portofoliu
                      </Button>
                    )}
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="flex-fill"
                      onClick={() => openReviews(firm)}
                    >
                      <ChatLeftTextFill className="me-1" /> Recenzii
                    </Button>
                  </div>
                </Card.Body>
                <Card.Footer className="text-muted small">
                  {firm.ratings.length > 0
                    ? `${firm.ratings.length} ${firm.ratings.length === 1 ? 'recenzie' : 'recenzii'}`
                    : 'Fără recenzii'}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Reviews Modal */}
      <Modal show={!!reviewFirm} onHide={() => setReviewFirm(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Recenzii — {reviewFirm?.companyName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingReviews ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : reviews.length === 0 ? (
            <Alert variant="info" className="mb-0">Firma nu are recenzii.</Alert>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reviews.map((r, i) => (
                <Card key={i} className="border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold">{reviewerName(r.reviewer)}</div>
                      <div className="d-flex align-items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) =>
                          s <= r.rating
                            ? <StarFill key={s} size={14} className="text-warning" />
                            : <Star key={s} size={14} className="text-muted" />
                        )}
                      </div>
                    </div>
                    {r.comment && <p className="mb-1">{r.comment}</p>}
                    <small className="text-muted">
                      {new Date(r.createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </small>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Portfolio Modal */}
      <Modal show={!!selectedFirm} onHide={() => setSelectedFirm(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Portofoliu — {selectedFirm?.companyName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFirm?.portfolios.length === 0 ? (
            <Alert variant="info" className="mb-0">Firma nu are lucrări în portofoliu.</Alert>
          ) : (
            <Row className="g-3">
              {selectedFirm?.portfolios.map((p) => (
                <Col xs={12} sm={6} md={4} key={p.id}>
                  <Card className="h-100">
                    <Card.Img
                      variant="top"
                      src={portfolioImgSrc(p.imageUrl)}
                      alt={p.title}
                      style={{ height: 180, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22180%22%3E%3Crect%20fill%3D%22%23dee2e6%22%20width%3D%22200%22%20height%3D%22180%22%2F%3E%3Ctext%20fill%3D%22%236c757d%22%20font-size%3D%2214%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EFără%20imagine%3C%2Ftext%3E%3C%2Fsvg%3E';
                      }}
                    />
                    <Card.Body className="py-2 px-3">
                      <Card.Text className="fw-semibold small mb-0">{p.title}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
