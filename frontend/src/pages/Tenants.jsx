import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Button, Card, Spinner, Table
} from 'react-bootstrap';
import { CheckCircle, XCircle, PeopleFill } from 'react-bootstrap-icons';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTenants = useCallback(async () => {
    try {
      const res = await api.get('/hoa/tenants');
      setTenants(res.data.tenants);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleApproval = async (tenantId, isApproved) => {
    try {
      await api.patch(`/hoa/tenants/${tenantId}/approval`, { isApproved });
      await fetchTenants();
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la actualizare');
    }
  };

  const handleReject = async (tenantId) => {
    try {
      await api.delete(`/hoa/tenants/${tenantId}`);
      await fetchTenants();
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

  return (
    <>
      <h4 className="mb-4">Locatari</h4>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {tenants.length === 0 ? (
        <EmptyState
          icon={<PeopleFill size={28} />}
          title="Niciun locatar"
          description="Locatarii vor apărea aici după ce se înregistrează."
        />
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nume</th>
                  <th>Scara</th>
                  <th>Apartament</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th className="text-end">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td>{t.firstName} {t.lastName}</td>
                    <td>{t.staircase?.name || '—'}</td>
                    <td>{t.apartmentNumber}</td>
                    <td>{t.phone}</td>
                    <td>
                      {t.isApproved
                        ? <span className="text-success fw-semibold">Aprobat</span>
                        : <span className="text-warning fw-semibold">În așteptare</span>}
                    </td>
                    <td className="text-end">
                      {!t.isApproved && (
                        <>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-1"
                            onClick={() => handleApproval(t.id, true)}
                          >
                            <CheckCircle className="me-1" /> Aprobă
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleReject(t.id)}
                          >
                            <XCircle className="me-1" /> Respinge
                          </Button>
                        </>
                      )}
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
