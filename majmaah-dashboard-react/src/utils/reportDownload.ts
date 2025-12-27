/**
 * Report Download Utility
 * Provides functions to view and download the detailed PDF report
 */

/**
 * Gets the PDF path for the detailed report
 */
export const getReportPdfPath = (): string => {
  return '/assets/reports/URIMPACT_Advanced_Tier_Report_Majmaah_University_Tree_Planting_Project.pdf';
};

/**
 * Gets the PDF filename
 */
export const getReportFileName = (): string => {
  return 'URIMPACT_Advanced_Tier_Report_Majmaah_University_Tree_Planting_Project';
};

/**
 * Downloads the detailed report PDF file directly
 * Fallback method if viewing fails or user prefers direct download
 */
export const downloadDetailedReport = async (): Promise<void> => {
  try {
    // Path to the PDF file in public folder
    const pdfPath = '/assets/reports/URIMPACT_Advanced_Tier_Report_Majmaah_University_Tree_Planting_Project.pdf';
    
    // Fetch the PDF file
    const response = await fetch(pdfPath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.statusText}`);
    }
    
    // Get the blob data
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `URIMPACT_Advanced_Tier_Report_Majmaah_University_Tree_Planting_Project_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Report downloaded successfully');
  } catch (error) {
    console.error('❌ Error downloading report:', error);
    throw error;
  }
};

