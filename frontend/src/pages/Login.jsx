import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(8, 'Minim 8 caractere')
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Eroare la autentificare');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h3 className="text-center mb-4 fw-bold">BlocManage</h3>
              <h5 className="text-center mb-3">Autentificare</h5>

              {serverError && <Alert variant="danger">{serverError}</Alert>}

              <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="email@exemplu.ro"
                    isInvalid={!!errors.email}
                    {...register('email')}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Parolă</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Minim 8 caractere"
                    isInvalid={!!errors.password}
                    {...register('password')}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Intră în cont'}
                </Button>
              </Form>

              <p className="text-center mt-3 mb-0 small">
                Nu ai cont? <Link to="/register">Înregistrează-te</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
