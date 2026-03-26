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
import AddressFormLogic from '../components/AddressFormLogic';
import { SERVICE_CATEGORIES } from '../constants/domains';

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

const addressFields = {
  postalCode: z.string().regex(/^\d{6}$/, 'Cod poștal invalid (6 cifre)'),
  county: z.string().min(2, 'Minim 2 caractere'),
  city: z.string().min(2, 'Minim 2 caractere'),
  street: z.string().min(2, 'Minim 2 caractere')
};

const buildAddress = ({ postalCode, county, city, street }) =>
  [street, city, county, postalCode].filter(Boolean).join(', ');

const hoaSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(8, 'Minim 8 caractere'),
  presidentName: z.string().min(2, 'Minim 2 caractere'),
  adminName: z.string().min(2, 'Minim 2 caractere'),
  ...addressFields,
  staircases: z.array(z.object({
    name: z.string().min(1, 'Obligatoriu'),
    apartmentsCount: z.coerce.number().int().positive('Trebuie pozitiv')
  })).min(1, 'Adaugă cel puțin o scară')
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
  ...addressFields,
  iban: z.string().min(8, 'Minim 8 caractere'),
  bankName: z.string().min(2, 'Minim 2 caractere'),
  domains: z.array(z.string()).min(1, 'Selectează cel puțin un domeniu')
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

  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(hoaSchema),
    defaultValues: { staircases: [{ name: '', apartmentsCount: '' }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'staircases' });

  const onSubmit = async (data) => {
    setServerError('');
    const { postalCode, county, city, street, ...rest } = data;
    try {
      await registerHoa({
        ...rest,
        buildingAddress: buildAddress({ postalCode, county, city, street })
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

      <h6 className="fw-semibold mt-3 mb-2">Adresa bloc</h6>
      <AddressFormLogic
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
      />

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

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(firmSchema),
    defaultValues: { domains: [] }
  });

  const selectedDomains = watch('domains') || [];

  const handleDomainToggle = (domain) => {
    const updated = selectedDomains.includes(domain)
      ? selectedDomains.filter((d) => d !== domain)
      : [...selectedDomains, domain];
    setValue('domains', updated, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setServerError('');
    const { postalCode, county, city, street, ...rest } = data;
    try {
      await registerFirm({
        ...rest,
        hqAddress: buildAddress({ postalCode, county, city, street })
      });
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

      <h6 className="fw-semibold mt-3 mb-2">Adresa sediu</h6>
      <AddressFormLogic
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
      />

      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Domenii de activitate</Form.Label>
        {SERVICE_CATEGORIES.map((cat) => (
          <Form.Check
            key={cat}
            type="checkbox"
            label={cat}
            checked={selectedDomains.includes(cat)}
            onChange={() => handleDomainToggle(cat)}
          />
        ))}
        {errors.domains && (
          <div className="text-danger small mt-1">{errors.domains.message}</div>
        )}
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
