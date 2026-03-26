import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  ListGroup,
  Modal,
  Row,
  Spinner
} from 'react-bootstrap';
import {
  PencilSquare,
  PlusCircle,
  Trash,
  CheckCircleFill,
  ShieldLock
} from 'react-bootstrap-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const ROLE_LABELS = { TENANT: 'Locatar', HOA: 'Asociație', FIRM: 'Firmă' };

// ── Field configs per role ──────────────────────────────

const TENANT_FIELDS = [
  { key: 'firstName', label: 'Prenume' },
  { key: 'lastName', label: 'Nume' },
  { key: 'phone', label: 'Telefon' },
  { key: 'addressText', label: 'Adresă', readOnly: true },
  { key: 'apartmentNumber', label: 'Nr. apartament' }
];

const HOA_FIELDS = [
  { key: 'presidentName', label: 'Președinte' },
  { key: 'adminName', label: 'Administrator' },
  { key: 'buildingAddress', label: 'Adresa clădirii', readOnly: true },
  { key: 'documentsUrl', label: 'URL documente' }
];

const FIRM_FIELDS = [
  { key: 'companyName', label: 'Denumire firmă' },
  { key: 'adminName', label: 'Persoană de contact' },
  { key: 'phone', label: 'Telefon' },
  { key: 'contactEmail', label: 'Email contact', srcKey: 'email' },
  { key: 'hqAddress', label: 'Adresa sediului' },
  { key: 'iban', label: 'IBAN' },
  { key: 'bankName', label: 'Banca' }
];

function getProfileData(user) {
  return user.profile || {};
}

function getFieldsForRole(role) {
  if (role === 'TENANT') return TENANT_FIELDS;
  if (role === 'HOA') return HOA_FIELDS;
  if (role === 'FIRM') return FIRM_FIELDS;
  return [];
}

// ── Profile Section ─────────────────────────────────────

function ProfileSection({ user, onProfileUpdated }) {
  const profile = getProfileData(user);
  const fields = getFieldsForRole(user.role);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const startEdit = () => {
    const initial = {};
    fields.forEach((f) => {
      const srcKey = f.srcKey || f.key;
      initial[f.key] = profile[srcKey] || '';
    });
    setFormData(initial);
    setEditing(true);
    setMsg({ type: '', text: '' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile', formData);
      onProfileUpdated(res.data.user);
      setMsg({ type: 'success', text: 'Profilul a fost actualizat cu succes!' });
      setEditing(false);
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Eroare la salvare' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Profil — {ROLE_LABELS[user.role]}</h5>
        {!editing && (
          <Button variant="outline-primary" size="sm" onClick={startEdit}>
            <PencilSquare className="me-1" /> Editează
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {msg.text && <Alert variant={msg.type} dismissible onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}

        <Row className="mb-3">
          <Col sm={4} className="text-muted">Email</Col>
          <Col sm={8}>{user.email}</Col>
        </Row>

        {user.role === 'FIRM' && (
          <>
            <Row className="mb-3">
              <Col sm={4} className="text-muted">CUI</Col>
              <Col sm={8}>{profile.cui}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4} className="text-muted">CAEN</Col>
              <Col sm={8}>{profile.caen}</Col>
            </Row>
          </>
        )}

        {fields.map((f) => {
          const srcKey = f.srcKey || f.key;
          return (
            <Row className="mb-3" key={f.key}>
              <Col sm={4} className="text-muted">{f.label}</Col>
              <Col sm={8}>
                {editing && !f.readOnly ? (
                  <Form.Control
                    size="sm"
                    value={formData[f.key] || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                ) : (
                  profile[srcKey] || <span className="text-muted fst-italic">—</span>
                )}
              </Col>
            </Row>
          );
        })}

        {editing && (
          <div className="d-flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : <CheckCircleFill className="me-1" />}
              Salvează
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Anulează
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// ── Portfolio Section (FIRM only) ───────────────────────

const API_BASE = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:4000';

function portfolioImgSrc(imageUrl) {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}

function PortfolioSection({ user }) {
  const [items, setItems] = useState(user.profile?.portfolios || []);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const refreshPortfolio = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setItems(res.data.user?.profile?.portfolios || []);
    } catch { /* ignore */ }
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setTitle('');
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
    setMsg({ type: '', text: '' });
  };

  const openEdit = (item) => {
    setEditItem(item);
    setTitle(item.title);
    setImageFile(null);
    setImagePreview(portfolioImgSrc(item.imageUrl));
    setShowModal(true);
    setMsg({ type: '', text: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editItem) {
        await api.put(`/firms/portfolio/${editItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/firms/portfolio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await refreshPortfolio();
      setShowModal(false);
      setMsg({ type: 'success', text: editItem ? 'Elementul a fost actualizat' : 'Element adăugat în portofoliu' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Eroare la salvare' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/firms/portfolio/${id}`);
      await refreshPortfolio();
      setMsg({ type: 'success', text: 'Elementul a fost șters din portofoliu' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Eroare la ștergere' });
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Portofoliu lucrări</h5>
        <Button variant="outline-success" size="sm" onClick={openAdd}>
          <PlusCircle className="me-1" /> Adaugă
        </Button>
      </Card.Header>
      <Card.Body>
        {msg.text && <Alert variant={msg.type} dismissible onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}

        {items.length === 0 ? (
          <Alert variant="info" className="mb-0">
            Nu ai elemente în portofoliu. Adaugă lucrări pentru a fi vizibile clienților.
          </Alert>
        ) : (
          <ListGroup variant="flush">
            {items.map((item) => (
              <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={portfolioImgSrc(item.imageUrl)}
                    alt={item.title}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <strong>{item.title}</strong>
                </div>
                <div className="d-flex gap-1">
                  <Button variant="outline-primary" size="sm" onClick={() => openEdit(item)}>
                    <PencilSquare />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>

      {/* Add / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Editează elementul' : 'Adaugă în portofoliu'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Titlu lucrare</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Renovare instalație termică"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{editItem ? 'Înlocuiește imaginea (opțional)' : 'Imagine lucrare'}</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
            />
            <Form.Text className="text-muted">
              Formate acceptate: JPG, PNG, WebP, GIF. Max 5 MB.
            </Form.Text>
          </Form.Group>
          {imagePreview && (
            <div className="text-center">
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Anulează</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !title || (!editItem && !imageFile)}
          >
            {saving ? <Spinner size="sm" animation="border" /> : (editItem ? 'Salvează' : 'Adaugă')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

// ── Password Change Section ─────────────────────────────

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleChangePassword = async () => {
    setMsg({ type: '', text: '' });

    if (newPassword.length < 8) {
      setMsg({ type: 'danger', text: 'Parola nouă trebuie să aibă minim 8 caractere' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'danger', text: 'Parolele noi nu coincid' });
      return;
    }

    setSaving(true);
    try {
      await api.put('/profile/password', { currentPassword, newPassword });
      setMsg({ type: 'success', text: 'Parola a fost schimbată cu succes!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Eroare la schimbarea parolei' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header>
        <h5 className="mb-0"><ShieldLock className="me-2" />Schimbă parola</h5>
      </Card.Header>
      <Card.Body>
        {msg.text && <Alert variant={msg.type} dismissible onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}

        <Row className="mb-3">
          <Col sm={4} className="text-muted d-flex align-items-center">Parola curentă</Col>
          <Col sm={8}>
            <Form.Control
              size="sm"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Introdu parola curentă"
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col sm={4} className="text-muted d-flex align-items-center">Parola nouă</Col>
          <Col sm={8}>
            <Form.Control
              size="sm"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minim 8 caractere"
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col sm={4} className="text-muted d-flex align-items-center">Confirmă parola nouă</Col>
          <Col sm={8}>
            <Form.Control
              size="sm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetă parola nouă"
            />
          </Col>
        </Row>

        <Button
          variant="primary"
          size="sm"
          onClick={handleChangePassword}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
        >
          {saving ? <Spinner size="sm" animation="border" /> : <CheckCircleFill className="me-1" />}
          Schimbă parola
        </Button>
      </Card.Body>
    </Card>
  );
}

// ── Main Settings Page ──────────────────────────────────

export default function Settings() {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setCurrentUser(res.data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
      <h4 className="mb-4">Setări</h4>

      <ProfileSection user={currentUser} onProfileUpdated={handleProfileUpdated} />

      <PasswordSection />

      {currentUser.role === 'FIRM' && (
        <PortfolioSection user={currentUser} />
      )}
    </>
  );
}
