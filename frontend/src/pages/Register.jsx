import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert, Button, Card, Col, Container, Form, Row, Spinner, Tab, Tabs
} from 'react-bootstrap';
import { PlusCircle, Trash } from 'react-bootstrap-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

/* ── Validation schemas ─────────────────────────────── */

const tenantSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(8, 'Minim 8 caractere'),
  firstName: z.string().min(2, 'Minim 2 caractere'),
  lastName: z.string().min(2, 'Minim 2 caractere'),
  phone: z.string().min(7, 'Minim 7 caractere'),
  cnp: z.string().min(13, 'CNP-ul trebuie să aibă 13 caractere').max(20).optional().or(z.literal('')),
  hoaId: z.string().uuid('Selectează asociația'),
  staircaseId: z.string().uuid('Selectează scara'),
  apartmentNumber: z.string().min(1, 'Obligatoriu')
});

const hoaSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(8, 'Minim 8 caractere'),
  presidentName: z.string().min(2, 'Minim 2 caractere'),
  adminName: z.string().min(2, 'Minim 2 caractere'),
  buildingAddress: z.string().min(5, 'Minim 5 caractere'),
  staircases: z.array(z.object({
    name: z.string().min(1, 'Obligatoriu'),
    apartmentsCount: z.coerce.number().int().positive('Trebuie pozitiv')
  })).min(1, 'Adaugă cel puțin o scară'),
  documentsUrl: z.string().url('URL invalid').optional().or(z.literal(''))
});

const firmSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(8, 'Minim 8 caractere'),
  companyName: z.string().min(2, 'Minim 2 caractere'),
  cui: z.string().min(2, 'Minim 2 caractere'),
  caen: z.string().min(2, 'Minim 2 caractere'),
  adminName: z.string().min(2, 'Minim 2 caractere'),
  phone: z.string().min(7, 'Minim 7 caractere'),
  contactEmail: z.string().email('Email invalid'),
  hqAddress: z.string().min(5, 'Minim 5 caractere'),
  iban: z.string().min(8, 'Minim 8 caractere'),
  bankName: z.string().min(2, 'Minim 2 caractere')
});

/* ── Tenant form ────────────────────────────────────── */

function TenantForm() {
  const { registerTenant } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hoas, setHoas] = useState([]);
  const [hoasLoading, setHoasLoading] = useState(true);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(tenantSchema)
  });

  const selectedHoaId = watch('hoaId');
  const selectedHoa = hoas.find((h) => h.id === selectedHoaId);

  useEffect(() => {
    api.get('/hoa/public')
      .then((res) => setHoas(res.data.hoas))
      .catch(() => setHoas([]))
      .finally(() => setHoasLoading(false));
  }, []);

  // Reset staircase when HOA changes
  useEffect(() => {
    setValue('staircaseId', '');
  }, [selectedHoaId, setValue]);

  const onSubmit = async (data) => {
    setServerError('');
    setSuccessMsg('');
    try {
      const res = await registerTenant(data);
      setSuccessMsg(res.message);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Eroare la înregistrare');
    }
  };

  if (hoasLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" /> Se încarcă asociațiile...
      </div>
    );
  }

  if (hoas.length === 0) {
    return (
      <Alert variant="warning">
        Momentan nicio asociație nu este înscrisă în platformă. Înregistrarea ca locatar nu este posibilă.
      </Alert>
    );
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <Alert variant="danger">{serverError}</Alert>}
      {successMsg && (
        <Alert variant="warning">
          {successMsg}
          <br />
          <small>Contul necesită aprobarea președintelui de asociație pentru activare.</small>
        </Alert>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Prenume</Form.Label>
            <Form.Control isInvalid={!!errors.firstName} {...register('firstName')} />
            <Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nume</Form.Label>
            <Form.Control isInvalid={!!errors.lastName} {...register('lastName')} />
            <Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" isInvalid={!!errors.email} {...register('email')} />
        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Parolă</Form.Label>
        <Form.Control type="password" isInvalid={!!errors.password} {...register('password')} />
        <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Telefon</Form.Label>
            <Form.Control isInvalid={!!errors.phone} {...register('phone')} />
            <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>CNP <span className="text-muted">(opțional)</span></Form.Label>
            <Form.Control {...register('cnp')} />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Asociația / Adresa blocului</Form.Label>
        <Form.Select
          isInvalid={!!errors.hoaId}
          {...register('hoaId')}
        >
          <option value="">— Alege Asociația / Adresa —</option>
          {hoas.map((h) => (
            <option key={h.id} value={h.id}>{h.buildingAddress}</option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.hoaId?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Scara</Form.Label>
        <Form.Select
          isInvalid={!!errors.staircaseId}
          disabled={!selectedHoa}
          {...register('staircaseId')}
        >
          <option value="">— Alege Scara —</option>
          {selectedHoa?.staircases?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.staircaseId?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Număr apartament</Form.Label>
        <Form.Control isInvalid={!!errors.apartmentNumber} {...register('apartmentNumber')} />
        <Form.Control.Feedback type="invalid">{errors.apartmentNumber?.message}</Form.Control.Feedback>
      </Form.Group>

      <Button type="submit" variant="primary" className="w-100" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Crează cont locatar'}
      </Button>
    </Form>
  );
}

/* ── HOA form ───────────────────────────────────────── */

function HoaForm() {
  const { registerHoa } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(hoaSchema),
    defaultValues: { staircases: [{ name: '', apartmentsCount: '' }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'staircases' });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await registerHoa({
        ...data,
        documentsUrl: data.documentsUrl || undefined
      });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Eroare la înregistrare');
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" isInvalid={!!errors.email} {...register('email')} />
        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Parolă</Form.Label>
        <Form.Control type="password" isInvalid={!!errors.password} {...register('password')} />
        <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nume președinte</Form.Label>
            <Form.Control isInvalid={!!errors.presidentName} {...register('presidentName')} />
            <Form.Control.Feedback type="invalid">{errors.presidentName?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nume administrator</Form.Label>
            <Form.Control isInvalid={!!errors.adminName} {...register('adminName')} />
            <Form.Control.Feedback type="invalid">{errors.adminName?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Adresa bloc</Form.Label>
        <Form.Control isInvalid={!!errors.buildingAddress} {...register('buildingAddress')} />
        <Form.Control.Feedback type="invalid">{errors.buildingAddress?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>URL documente <span className="text-muted">(opțional)</span></Form.Label>
        <Form.Control type="url" {...register('documentsUrl')} />
      </Form.Group>

      {/* Staircases dynamic list */}
      <div className="mb-3">
        <Form.Label className="fw-semibold">Scări</Form.Label>
        {errors.staircases?.message && (
          <Alert variant="danger" className="py-1 px-2 small">{errors.staircases.message}</Alert>
        )}
        {fields.map((field, index) => (
          <Row key={field.id} className="mb-2 align-items-end">
            <Col>
              <Form.Control
                placeholder="Nume scară (ex: A)"
                isInvalid={!!errors.staircases?.[index]?.name}
                {...register(`staircases.${index}.name`)}
              />
            </Col>
            <Col>
              <Form.Control
                type="number"
                placeholder="Nr. apartamente"
                isInvalid={!!errors.staircases?.[index]?.apartmentsCount}
                {...register(`staircases.${index}.apartmentsCount`)}
              />
            </Col>
            <Col xs="auto">
              <Button
                variant="outline-danger"
                size="sm"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <Trash />
              </Button>
            </Col>
          </Row>
        ))}
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => append({ name: '', apartmentsCount: '' })}
        >
          <PlusCircle className="me-1" /> Adaugă scară
        </Button>
      </div>

      <Button type="submit" variant="primary" className="w-100" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Crează cont asociație'}
      </Button>
    </Form>
  );
}

/* ── Firm form ──────────────────────────────────────── */

function FirmForm() {
  const { registerFirm } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(firmSchema)
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await registerFirm(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Eroare la înregistrare');
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nume firmă</Form.Label>
            <Form.Control isInvalid={!!errors.companyName} {...register('companyName')} />
            <Form.Control.Feedback type="invalid">{errors.companyName?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>CUI</Form.Label>
            <Form.Control isInvalid={!!errors.cui} {...register('cui')} />
            <Form.Control.Feedback type="invalid">{errors.cui?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>CAEN</Form.Label>
            <Form.Control isInvalid={!!errors.caen} {...register('caen')} />
            <Form.Control.Feedback type="invalid">{errors.caen?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nume administrator</Form.Label>
            <Form.Control isInvalid={!!errors.adminName} {...register('adminName')} />
            <Form.Control.Feedback type="invalid">{errors.adminName?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Email cont</Form.Label>
        <Form.Control type="email" isInvalid={!!errors.email} {...register('email')} />
        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Parolă</Form.Label>
        <Form.Control type="password" isInvalid={!!errors.password} {...register('password')} />
        <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Telefon</Form.Label>
            <Form.Control isInvalid={!!errors.phone} {...register('phone')} />
            <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email contact</Form.Label>
            <Form.Control type="email" isInvalid={!!errors.contactEmail} {...register('contactEmail')} />
            <Form.Control.Feedback type="invalid">{errors.contactEmail?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Adresa sediu</Form.Label>
        <Form.Control isInvalid={!!errors.hqAddress} {...register('hqAddress')} />
        <Form.Control.Feedback type="invalid">{errors.hqAddress?.message}</Form.Control.Feedback>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>IBAN</Form.Label>
            <Form.Control isInvalid={!!errors.iban} {...register('iban')} />
            <Form.Control.Feedback type="invalid">{errors.iban?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Banca</Form.Label>
            <Form.Control isInvalid={!!errors.bankName} {...register('bankName')} />
            <Form.Control.Feedback type="invalid">{errors.bankName?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Button type="submit" variant="primary" className="w-100" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Crează cont firmă'}
      </Button>
    </Form>
  );
}

/* ── Register page with tabs ────────────────────────── */

export default function Register() {
  return (
    <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '100vh' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h3 className="text-center mb-4 fw-bold">BlocManage</h3>
              <h5 className="text-center mb-3">Înregistrare</h5>

              <Tabs defaultActiveKey="tenant" className="mb-4" justify>
                <Tab eventKey="tenant" title="Locatar">
                  <TenantForm />
                </Tab>
                <Tab eventKey="hoa" title="Asociație">
                  <HoaForm />
                </Tab>
                <Tab eventKey="firm" title="Firmă">
                  <FirmForm />
                </Tab>
              </Tabs>

              <p className="text-center mt-3 mb-0 small">
                Ai deja cont? <Link to="/login">Autentifică-te</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
