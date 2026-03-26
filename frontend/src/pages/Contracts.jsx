import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Badge, Button, Card, Modal, Spinner, Table
} from 'react-bootstrap';
import { Upload, Download, FileEarmarkPdf, Eye, FileEarmarkX } from 'react-bootstrap-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:4000';

const STATUS_COLORS = {
  AWAITING_FIRM_DRAFT: 'warning',
  AWAITING_CLIENT_SIGNATURE: 'info',
  SIGNED_AND_ACTIVE: 'success'
};

const STATUS_LABELS = {
  AWAITING_FIRM_DRAFT: 'Așteaptă draft firmă',
  AWAITING_CLIENT_SIGNATURE: 'Așteaptă semnătura client',
  SIGNED_AND_ACTIVE: 'Semnat și activ'
};

export default function Contracts() {
  const { user, role } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(null);
  const [detailContract, setDetailContract] = useState(null);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await api.get('/contracts');
      setContracts(res.data.contracts);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleUpload = async (contractId, type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(contractId);
      try {
        const formData = new FormData();
        formData.append('pdf', file);
        const url = type === 'draft'
          ? `/contracts/${contractId}/upload-draft`
          : `/contracts/${contractId}/upload-signed`;
        await api.patch(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        await fetchContracts();
      } catch (err) {
        setError(err.response?.data?.message || 'Eroare la încărcare fișier');
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  const downloadPdf = (pdfUrl) => {
    window.open(`${API_BASE}${pdfUrl}`, '_blank');
  };

  const clientName = (c) => {
    const p = c.client?.profile;
    if (p?.firstName) return `${p.firstName} ${p.lastName || ''}`;
    if (p?.presidentName) return p.presidentName;
    return c.client?.email || '—';
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
      <h4 className="mb-4">Contracte</h4>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileEarmarkX size={28} />}
          title="Niciun contract"
          description="Contractele vor apărea automat când o firmă este asignată unei cereri."
        />
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Cerere</th>
                  <th>Firmă</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th className="text-end">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const isFirm = role === 'FIRM' && c.firmId === user?.firm?.id;
                  const isClient = c.clientId === user?.id;
                  const isAdmin = role === 'PLATFORM_ADMIN';

                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="fw-semibold">{c.request?.category || '—'}</span>
                        <br />
                        <small className="text-muted" style={{ maxWidth: 200 }}>
                          {c.request?.description?.slice(0, 50)}{c.request?.description?.length > 50 ? '…' : ''}
                        </small>
                      </td>
                      <td>{c.firm?.companyName || '—'}</td>
                      <td>{clientName(c)}</td>
                      <td>
                        <Badge bg={STATUS_COLORS[c.status]}>
                          {STATUS_LABELS[c.status]}
                        </Badge>
                      </td>
                      <td>{new Date(c.createdAt).toLocaleDateString('ro-RO')}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end flex-wrap">
                          {/* Detalii */}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setDetailContract(c)}
                            title="Detalii"
                          >
                            <Eye />
                          </Button>

                          {/* AWAITING_FIRM_DRAFT: firma/admin încarcă draft */}
                          {c.status === 'AWAITING_FIRM_DRAFT' && (isFirm || isAdmin) && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              disabled={uploading === c.id}
                              onClick={() => handleUpload(c.id, 'draft')}
                              title="Încarcă draft PDF"
                            >
                              {uploading === c.id
                                ? <Spinner size="sm" animation="border" />
                                : <><Upload className="me-1" /> Încarcă Draft</>}
                            </Button>
                          )}

                          {/* Download draft PDF — oricine vede contractul */}
                          {c.draftPdfUrl && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => downloadPdf(c.draftPdfUrl)}
                              title="Vizualizează draft"
                            >
                              <Download className="me-1" /> Draft
                            </Button>
                          )}

                          {/* Download contract semnat — oricine vede contractul */}
                          {c.signedPdfUrl && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => downloadPdf(c.signedPdfUrl)}
                              title="Vizualizează contract semnat"
                            >
                              <FileEarmarkPdf className="me-1" /> Contract
                            </Button>
                          )}

                          {/* AWAITING_FIRM_DRAFT: firma încarcă draft */}
                          {c.status === 'AWAITING_CLIENT_SIGNATURE' && (isClient || isAdmin) && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              disabled={uploading === c.id}
                              onClick={() => handleUpload(c.id, 'signed')}
                              title="Încarcă contract semnat"
                            >
                              {uploading === c.id
                                ? <Spinner size="sm" animation="border" />
                                : <><Upload className="me-1" /> Semnat</>}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal show={!!detailContract} onHide={() => setDetailContract(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalii contract</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailContract && (
            <div>
              <p><strong>Categorie cerere:</strong> {detailContract.request?.category || '—'}</p>
              <p><strong>Descriere:</strong> {detailContract.request?.description || '—'}</p>
              <p><strong>Scop:</strong>{' '}
                <Badge bg={detailContract.request?.scope === 'BUILDING' ? 'info' : 'secondary'}>
                  {detailContract.request?.scope === 'BUILDING' ? 'Bloc' : 'Personal'}
                </Badge>
              </p>
              <p><strong>Urgență:</strong> {detailContract.request?.urgencyLevel || '—'}</p>
              <hr />
              <p><strong>Firmă:</strong> {detailContract.firm?.companyName || '—'}</p>
              <p><strong>Client:</strong> {clientName(detailContract)}</p>
              <p><strong>Status contract:</strong>{' '}
                <Badge bg={STATUS_COLORS[detailContract.status]}>
                  {STATUS_LABELS[detailContract.status]}
                </Badge>
              </p>
              <p><strong>Draft PDF:</strong>{' '}
                {detailContract.draftPdfUrl
                  ? <Button variant="outline-info" size="sm" onClick={() => downloadPdf(detailContract.draftPdfUrl)}>
                      <Download className="me-1" /> Vizualizează draft
                    </Button>
                  : <span className="text-muted">Neîncărcat</span>}
              </p>
              <p><strong>Contract semnat:</strong>{' '}
                {detailContract.signedPdfUrl
                  ? <Button variant="outline-success" size="sm" onClick={() => downloadPdf(detailContract.signedPdfUrl)}>
                      <FileEarmarkPdf className="me-1" /> Vizualizează contract semnat
                    </Button>
                  : <span className="text-muted">Neîncărcat</span>}
              </p>
              <p><strong>Creat la:</strong> {new Date(detailContract.createdAt).toLocaleDateString('ro-RO')}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
