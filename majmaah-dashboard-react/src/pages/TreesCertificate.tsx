import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Download, TreePine, Leaf, Globe } from 'lucide-react';
import apiService from '@/services/api';
import html2pdf from 'html2pdf.js';

interface CertificateData {
  totalTrees: number;
  totalCarbon: number;
  clientName: string;
  certificateId: string;
  date: string;
}

const TreesCertificate: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Generate certificate ID (format: URI-YYYY-MM-DD-XXX)
  const generateCertificateId = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000);
    return `URI-${year}-${month}-${day}-${randomNum}`;
  };

  // Fetch user's total trees and carbon data
  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        setLoading(true);
        
        // Get all analyses assigned to the user and sum their CO2 values
        // This ensures we get ALL assigned analyses, not just visible ones
        const analysesResponse = await apiService.getMyAnalyses();
        
        if (analysesResponse.success && Array.isArray(analysesResponse.data)) {
          const analyses = analysesResponse.data;
          
          // Calculate totals by summing all assigned analyses
          // This gives us the true total across ALL areas assigned to the client
          const totalTrees = analyses.reduce((sum, analysis) => {
            const treeCount = typeof analysis.treeCount === 'number' 
              ? analysis.treeCount 
              : parseInt(String(analysis.treeCount || 0), 10) || 0;
            return sum + treeCount;
          }, 0);
          
          const totalCarbon = analyses.reduce((sum, analysis) => {
            // Ensure we parse the carbon value correctly (it might be a number or string)
            const carbonValue = typeof analysis.carbonTonnes === 'number' 
              ? analysis.carbonTonnes 
              : parseFloat(analysis.carbonTonnes) || 0;
            return sum + carbonValue;
          }, 0);
          
          // Fix floating point precision issues by rounding to 2 decimal places
          const totalCarbonRounded = Math.round(totalCarbon * 100) / 100;
          
          console.log('📊 Certificate calculation:', {
            analysesCount: analyses.length,
            totalTrees,
            totalCarbon: totalCarbon,
            totalCarbonRounded: totalCarbonRounded,
            analyses: analyses.map(a => {
              const carbonValue = typeof a.carbonTonnes === 'number' 
                ? a.carbonTonnes 
                : parseFloat(a.carbonTonnes) || 0;
              return {
                name: a.displayName,
                id: a.analysisId,
                trees: a.treeCount,
                carbon: carbonValue,
                carbonRaw: a.carbonTonnes
              };
            }),
            calculation: analyses.map(a => {
              const carbonValue = typeof a.carbonTonnes === 'number' 
                ? a.carbonTonnes 
                : parseFloat(a.carbonTonnes) || 0;
              return `${a.displayName}: ${carbonValue} tonnes`;
            }).join(' + ') + ` = ${totalCarbonRounded} tonnes`
          });
          
          setCertificateData({
            totalTrees,
            totalCarbon: totalCarbonRounded, // Use rounded value to avoid floating point issues
            clientName: user?.name || 'Client',
            certificateId: generateCertificateId(),
            date: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
          });
        } else {
          // Fallback: Try dashboard stats if my-analyses fails
          const statsResponse = await apiService.getDashboardStats(1, null);
          
          if (statsResponse.success && statsResponse.data) {
            const stats = statsResponse.data;
            
            // Extract totals from dashboard stats
            const totalTrees = typeof stats.totalTrees === 'number' 
              ? stats.totalTrees 
              : parseInt(String(stats.totalTrees || 0), 10) || 0;
            // Parse the string value correctly (it's returned as .toFixed(2) string)
            const totalCarbon = typeof stats.carbonSequestered === 'number'
              ? stats.carbonSequestered
              : parseFloat(String(stats.carbonSequestered || 0)) || 0;
            
            setCertificateData({
              totalTrees,
              totalCarbon: Math.round(totalCarbon),
              clientName: user?.name || 'Client',
              certificateId: generateCertificateId(),
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
            });
          } else {
            // Final fallback to default values
            setCertificateData({
              totalTrees: 0,
              totalCarbon: 0,
              clientName: user?.name || 'Client',
              certificateId: generateCertificateId(),
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
            });
          }
        }
      } catch (error) {
        console.error('Error fetching certificate data:', error);
        // Set default values on error
        setCertificateData({
          totalTrees: 0,
          totalCarbon: 0,
          clientName: user?.name || 'Client',
          certificateId: generateCertificateId(),
          date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
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

  // Download certificate as PDF
  const handleDownloadPDF = () => {
    if (!certificateRef.current || !certificateData) return;

    const element = certificateRef.current;
    const opt = {
      margin: 0,
      filename: `certificate-${certificateData.clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape' 
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tree Planting Certificate</h1>
          <p className="text-gray-600">
            Download your official certificate recognizing your contribution to the Saudi Green Initiative
          </p>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              <Download className="w-5 h-5" />
              Download Certificate
            </button>
          </div>

          {/* Certificate Content */}
          <div ref={certificateRef} className="certificate-container" style={{ 
            width: '297mm', 
            minHeight: '210mm', 
            margin: '0 auto',
            background: '#ffffff',
            padding: '0',
            fontFamily: 'Arial, Helvetica, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Teal-to-Green Gradient Banner Header */}
            <div style={{
              background: 'linear-gradient(to right, #13c5bc, #059669)',
              padding: '50px 80px',
              textAlign: 'center',
              width: '100%'
            }}>
              <h1 style={{ 
                fontSize: '36pt',
                fontWeight: 'bold',
                margin: '0 0 15px 0',
                color: '#ffffff',
                lineHeight: '1.2',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}>
                CERTIFICATE OF TREE PLANTING
              </h1>
              <p style={{ 
                fontSize: '18pt',
                margin: '0',
                color: '#ffffff',
                lineHeight: '1.4',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}>
                Saudi Green Initiative Contribution
              </p>
            </div>

            {/* Main Content Area */}
            <div style={{
              padding: '60px 80px',
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              {/* Certificate Body Text */}
              <div style={{ 
                textAlign: 'center',
                marginBottom: '60px'
              }}>
                <p style={{ 
                  fontSize: '16pt',
                  lineHeight: '1.8',
                  color: '#000000',
                  margin: '0 auto',
                  maxWidth: '85%',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}>
                  This certifies that <strong style={{ color: '#13c5bc', fontWeight: 'bold' }}>{certificateData.clientName}</strong> has 
                  contributed to the Saudi Green Initiative by planting native trees in Saudi Arabia, helping to combat 
                  climate change and restore natural ecosystems.
                </p>
              </div>

              {/* Three-Column Stats Section with Icons */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
                gap: '0',
                marginTop: '40px',
                marginBottom: '40px',
                alignItems: 'center'
              }}>
                {/* Left Section - Trees Planted */}
                <div style={{ 
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <TreePine 
                    size={60} 
                    strokeWidth={1.5}
                    style={{ 
                      margin: '0 auto 20px',
                      color: '#000000',
                      stroke: '#000000',
                      fill: 'none'
                    }}
                  />
                  <div style={{ 
                    fontSize: '56pt',
                    fontWeight: 'bold',
                    lineHeight: '1',
                    marginBottom: '15px',
                    color: '#13c5bc',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}>
                    {certificateData.totalTrees.toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '14pt',
                    fontWeight: 'normal',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#000000',
                    marginTop: '10px',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}>
                    TREES PLANTED
                  </div>
                </div>

                {/* Vertical Divider */}
                <div style={{
                  width: '1px',
                  height: '100%',
                  background: '#13c5bc',
                  margin: '0 20px'
                }}></div>

                {/* Middle Section - Client Name */}
                <div style={{ 
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <Leaf 
                    size={60} 
                    strokeWidth={1.5}
                    style={{ 
                      margin: '0 auto 20px',
                      color: '#000000',
                      stroke: '#000000',
                      fill: 'none'
                    }}
                  />
                  <div style={{ 
                    fontSize: '24pt',
                    fontWeight: 'normal',
                    lineHeight: '1.4',
                    color: '#13c5bc',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    marginTop: '20px'
                  }}>
                    {certificateData.clientName}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div style={{
                  width: '1px',
                  height: '100%',
                  background: '#13c5bc',
                  margin: '0 20px'
                }}></div>

                {/* Right Section - CO2 Sequestered */}
                <div style={{ 
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <Globe 
                    size={60} 
                    strokeWidth={1.5}
                    style={{ 
                      margin: '0 auto 20px',
                      color: '#000000',
                      stroke: '#000000',
                      fill: 'none'
                    }}
                  />
                  <div style={{ 
                    fontSize: '56pt',
                    fontWeight: 'bold',
                    lineHeight: '1',
                    marginBottom: '15px',
                    color: '#13c5bc',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}>
                    {certificateData.totalCarbon.toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '14pt',
                    fontWeight: 'normal',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#000000',
                    marginTop: '10px',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}>
                    TONS CO₂ SEQUESTERED
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div style={{ 
              padding: '30px 80px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px solid #e5e7eb'
            }}>
              {/* Left - Certificate ID and Verify */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
                <p style={{
                  fontSize: '11pt',
                  margin: '3px 0',
                  color: '#000000',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}>
                  Certificate ID: {certificateData.certificateId}
                </p>
                <p style={{
                  fontSize: '11pt',
                  margin: '3px 0',
                  color: '#000000',
                  fontFamily: 'Arial, Helvetica, sans-serif'
                }}>
                  Verify at urimpact.com/verify
                </p>
              </div>

              {/* Center - URIMPACT Logo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1'
              }}>
                <img 
                  src="/assets/img/URIMPACT_LOGO.png" 
                  alt="URIMPACT Logo" 
                  style={{
                    height: '40px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Right - QR Code */}
              <div style={{
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                background: '#ffffff'
              }}>
                <QRCodeSVG
                  value={`https://urimpact.com/verify?cert=${certificateData.certificateId}`}
                  size={80}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">About Your Certificate</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>This certificate is based on your assigned tree planting analyses</li>
            <li>The numbers reflect the total trees and carbon sequestered across all your assigned areas</li>
            <li>Your certificate ID can be used to verify your contribution</li>
            <li>Download and share your certificate to showcase your environmental impact</li>
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

export default TreesCertificate;
