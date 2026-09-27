export function formatFilename(fullName, dateStr) {
  const safeName = (fullName || 'Client').trim().replace(/[^a-zA-Z0-9]/g, '_');
  // Date format YYYY-MM-DD or DD_MM_YYYY
  let formattedDate = dateStr || '';
  if (formattedDate.includes('/')) {
    const parts = formattedDate.split('/');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } else {
    formattedDate = new Date().toISOString().split('T')[0];
  }
  return `HorizonFit_Health_Insight_Report_${safeName}_${formattedDate}.pdf`;
}

export function prepareEmailPayload(formData, filename, delivery = {}) {
  const subject = `New Horizon Fit Health Assessment — ${formData.fullName || 'Client'}`;
  return {
    recipient: delivery.recipient || '',
    subject,
    attachmentFilename: delivery.filename || filename,
    status: delivery.message || 'Report email sent successfully.'
  };
}
