import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Download, Leaf, Globe } from 'lucide-react';
import apiService from '@/services/api';
import html2pdf from 'html2pdf.js';

interface BasicCertificateData {
  totalCarbon: number;
  clientName: string;
  certificateId: string;
  date: string;
}

const BasicCertificate: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificateData, setCertificateData] = useState<BasicCertificateData | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const generateCertificateId = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000);
    return `BAS-${year}-${month}-${day}-${randomNum}`;
  };

  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        setLoading(true);

        const analysesResponse = await apiService.getMyAnalyses();

        if (analysesResponse.success && Array.isArray(analysesResponse.data)) {
          const analyses = analysesResponse.data;

          const totalCarbon = analyses.reduce((sum, analysis) => {
            const carbonValue =
              typeof analysis.carbonTonnes === 'number'
                ? analysis.carbonTonnes
                : parseFloat(String(analysis.carbonTonnes || 0)) || 0;
            return sum + carbonValue;
          }, 0);

          const totalCarbonRounded = Math.round(totalCarbon * 100) / 100;

          setCertificateData({
            totalCarbon: totalCarbonRounded,
            clientName: user?.name || 'Client',
            certificateId: generateCertificateId(),
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          });
        } else {
          const statsResponse = await apiService.getDashboardStats(1, null);

          if (statsResponse.success && statsResponse.data) {
            const stats = statsResponse.data;
            const totalCarbon =
              typeof stats.carbonSequestered === 'number'
                ? stats.carbonSequestered
                : parseFloat(String(stats.carbonSequestered || 0)) || 0;

            setCertificateData({
              totalCarbon: Math.round(totalCarbon * 100) / 100,
              clientName: user?.name || 'Client',
              certificateId: generateCertificateId(),
              date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            });
          } else {
            setCertificateData({
              totalCarbon: 0,
              clientName: user?.name || 'Client',
              certificateId: generateCertificateId(),
              date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            });
          }
        }
      } catch (error) {
        console.error('Error fetching basic certificate data:', error);
        setCertificateData({
          totalCarbon: 0,
          clientName: user?.name || 'Client',
          certificateId: generateCertificateId(),
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCertificateData();
    }
  }, [user]);

  const handleDownloadPDF = () => {
    if (!certificateRef.current || !certificateData) return;

    const element = certificateRef.current;
    const opt = {
      margin: 0,
      filename: `basic-certificate-${certificateData.clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape' as const,
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate data...</p>
        </div>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load certificate data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Basic Certificate</h1>
          <p className="text-gray-600">
            Download your certificate recognizing your environmental contribution under the Saudi Green Initiative
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              <Download className="w-5 h-5" />
              Download Certificate
            </button>
          </div>

          <div
            ref={certificateRef}
            className="certificate-container"
            style={{
              width: '297mm',
              minHeight: '210mm',
              margin: '0 auto',
              background: '#ffffff',
              padding: '0',
              fontFamily: 'Arial, Helvetica, sans-serif',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(to right, #13c5bc, #059669)',
                padding: '50px 80px',
                textAlign: 'center',
                width: '100%',
              }}
            >
              <h1
                style={{
                  fontSize: '36pt',
                  fontWeight: 'bold',
                  margin: '0 0 15px 0',
                  color: '#ffffff',
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                }}
              >
                CERTIFICATE OF CONTRIBUTION
              </h1>
              <p
                style={{
                  fontSize: '18pt',
                  margin: '0',
                  color: '#ffffff',
                  lineHeight: '1.4',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                }}
              >
                Saudi Green Initiative
              </p>
            </div>

            <div
              style={{
                padding: '60px 80px',
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '60px',
                }}
              >
                <p
                  style={{
                    fontSize: '16pt',
                    lineHeight: '1.8',
                    color: '#000000',
                    margin: '0 auto',
                    maxWidth: '85%',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                  }}
                >
                  This certifies that{' '}
                  <strong style={{ color: '#13c5bc', fontWeight: 'bold' }}>{certificateData.clientName}</strong> has
                  made a valued contribution toward environmental sustainability in Saudi Arabia, supporting national
                  green goals and climate action.
                </p>
              </div>

              {/* Two columns: recipient + CO₂ only (no trees) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1px 1fr',
                  gap: '0',
                  marginTop: '40px',
                  marginBottom: '40px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  <Leaf
                    size={60}
                    strokeWidth={1.5}
                    style={{
                      margin: '0 auto 20px',
                      color: '#000000',
                      stroke: '#000000',
                      fill: 'none',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '24pt',
                      fontWeight: 'normal',
                      lineHeight: '1.4',
                      color: '#13c5bc',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      marginTop: '10px',
                    }}
                  >
                    {certificateData.clientName}
                  </div>
                  <div
                    style={{
                      fontSize: '14pt',
                      fontWeight: 'normal',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#000000',
                      marginTop: '16px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                    }}
                  >
                    RECIPIENT
                  </div>
                </div>

                <div
                  style={{
                    width: '1px',
                    height: '100%',
                    background: '#13c5bc',
                    margin: '0 20px',
                  }}
                />

                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  <Globe
                    size={60}
                    strokeWidth={1.5}
                    style={{
                      margin: '0 auto 20px',
                      color: '#000000',
                      stroke: '#000000',
                      fill: 'none',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '56pt',
                      fontWeight: 'bold',
                      lineHeight: '1',
                      marginBottom: '15px',
                      color: '#13c5bc',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                    }}
                  >
                    {certificateData.totalCarbon.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: '14pt',
                      fontWeight: 'normal',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#000000',
                      marginTop: '10px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                    }}
                  >
                    TONS CO₂ SEQUESTERED
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '30px 80px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <p
                  style={{
                    fontSize: '11pt',
                    margin: '3px 0',
                    color: '#000000',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                  }}
                >
                  Certificate ID: {certificateData.certificateId}
                </p>
                <p
                  style={{
                    fontSize: '11pt',
                    margin: '3px 0',
                    color: '#000000',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                  }}
                >
                  Verify at urimpact.com/verify
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '1',
                }}
              >
                <img
                  src="/assets/img/URIMPACT_LOGO.png"
                  alt="Logo"
                  style={{
                    height: '40px',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              <div
                style={{
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px',
                  background: '#ffffff',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ddd',
                    fontSize: '10px',
                    color: '#666',
                  }}
                >
                  QR Code
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">About This Certificate</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Recognition of your environmental contribution; no tree count is shown on this certificate</li>
            <li>CO₂ figures reflect aggregated impact from your assigned project analyses</li>
            <li>Use your certificate ID for verification</li>
            <li>You may download and share this document as needed</li>
          </ul>
        </div>
      </div>

      <style>{`
        @media print {
          .certificate-container {
            page-break-inside: avoid;
            width: 297mm !important;
            height: 210mm !important;
          }
        }
        .certificate-container * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          size: A4 landscape;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default BasicCertificate;
