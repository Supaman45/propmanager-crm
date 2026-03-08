import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateChecklistPDF = async (checklist, properties = [], tenants = []) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight = 20) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to get condition color
  const getConditionColor = (condition) => {
    const colors = {
      'excellent': [16, 185, 129], // green
      'good': [59, 130, 246],      // blue
      'fair': [245, 158, 11],      // yellow
      'poor': [239, 68, 68],       // orange
      'damaged': [220, 38, 38],    // red
      'missing': [124, 58, 237],   // purple
      'n/a': [148, 163, 184]        // gray
    };
    return colors[condition] || [0, 0, 0];
  };

  // Helper function to format condition text
  const formatCondition = (condition) => {
    if (!condition) return 'Not Set';
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  // Initialize checklist items - handle both loaded checklist and form data
  const checklistItems = checklist.checklist_items || [];

  // HEADER SECTION
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const inspectionType = checklist.inspection_type === 'move_in' ? 'Move-in Inspection Report' : 'Move-out Inspection Report';
  doc.text(inspectionType, margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Property information
  const property = properties.find(p => p.id === checklist.property_id);
  const propertyAddress = property ? property.address : 'No Property Selected';
  doc.text(`Property: ${propertyAddress}`, margin, yPosition);
  yPosition += 6;

  if (checklist.unit_number) {
    doc.text(`Unit: ${checklist.unit_number}`, margin, yPosition);
    yPosition += 6;
  }

  if (checklist.inspection_date) {
    const inspectionDate = new Date(checklist.inspection_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Inspection Date: ${inspectionDate}`, margin, yPosition);
    yPosition += 6;
  }

  if (checklist.inspector_name) {
    doc.text(`Inspector: ${checklist.inspector_name}`, margin, yPosition);
    yPosition += 6;
  }

  if (checklist.tenant_id) {
    const tenant = tenants.find(t => t.id === checklist.tenant_id);
    if (tenant) {
      doc.text(`Tenant: ${tenant.name}`, margin, yPosition);
      yPosition += 6;
    }
  }

  yPosition += 5;

  // SUMMARY SECTION
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (checklist.overall_condition) {
    doc.text(`Overall Condition: ${formatCondition(checklist.overall_condition)}`, margin, yPosition);
    yPosition += 6;
  }

  const totalItems = checklistItems.length;
  doc.text(`Total Items Inspected: ${totalItems}`, margin, yPosition);
  yPosition += 6;

  const statusText = checklist.status ? checklist.status.replace('_', ' ').toUpperCase() : 'DRAFT';
  doc.text(`Status: ${statusText}`, margin, yPosition);
  yPosition += 6;

  if (checklist.tenant_present) {
    doc.text('Tenant Present: Yes', margin, yPosition);
    yPosition += 6;
  }

  yPosition += 5;

  // ROOM SECTIONS
  if (checklistItems.length > 0) {
    // Group items by room
    const itemsByRoom = {};
    checklistItems.forEach(item => {
      if (!itemsByRoom[item.room]) {
        itemsByRoom[item.room] = [];
      }
      itemsByRoom[item.room].push(item);
    });

    // Sort rooms
    const roomOrder = [
      'Living Room',
      'Kitchen',
      'Primary Bedroom',
      'Bedroom 2',
      'Primary Bathroom',
      'Bathroom 2',
      'Laundry Area',
      'Garage',
      'Exterior',
      'General'
    ];

    const sortedRooms = Object.keys(itemsByRoom).sort((a, b) => {
      const indexA = roomOrder.indexOf(a);
      const indexB = roomOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    sortedRooms.forEach(room => {
      checkPageBreak(40);
      
      // Room header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(room, margin, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = itemsByRoom[room].map(item => {
        const condition = formatCondition(item.condition);
        const notes = item.notes || '';
        return [item.item_name, condition, notes];
      });

      // Create table
      doc.autoTable({
        startY: yPosition,
        head: [['Item', 'Condition', 'Notes']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [26, 115, 232],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 40 },
          2: { cellWidth: 60 }
        },
        didParseCell: (data) => {
          // Color code condition column
          if (data.column.index === 1 && data.row.index > 0) {
            const condition = itemsByRoom[room][data.row.index - 1].condition;
            if (condition) {
              const color = getConditionColor(condition);
              data.cell.styles.textColor = color;
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    });
  }

  // PHOTOS SECTION
  const itemsWithPhotos = checklistItems.filter(item => {
    const photos = item.checklist_photos || [];
    return photos.length > 0;
  });

  if (itemsWithPhotos.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Photo Documentation', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    for (const item of itemsWithPhotos) {
      const photos = item.checklist_photos || [];
      checkPageBreak(50);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.item_name} (${item.room})`, margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      
      // Note: jsPDF doesn't directly support images from URLs due to CORS
      // We'll list the photo URLs instead
      photos.forEach((photo, index) => {
        doc.text(`Photo ${index + 1}: ${photo.photo_url}`, margin + 5, yPosition);
        yPosition += 5;
      });

      yPosition += 3;
    }
  }

  // SIGNATURES SECTION
  if (checklist.inspector_signature_url || checklist.tenant_signature_url) {
    checkPageBreak(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Signatures', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Inspector signature
    if (checklist.inspector_signature_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = checklist.inspector_signature_url;
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              const imgWidth = 60;
              const imgHeight = (img.height / img.width) * imgWidth;
              doc.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight);
              doc.text('Inspector Signature', margin, yPosition + imgHeight + 5);
              yPosition += imgHeight + 15;
              resolve();
            } catch (error) {
              doc.text('Inspector Signature: [Image not available]', margin, yPosition);
              yPosition += 10;
              resolve();
            }
          };
          img.onerror = () => {
            doc.text('Inspector Signature: [Image not available]', margin, yPosition);
            yPosition += 10;
            resolve();
          };
        });
      } catch (error) {
        doc.text('Inspector Signature: [Image not available]', margin, yPosition);
        yPosition += 10;
      }
    }

    // Tenant signature
    if (checklist.tenant_signature_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = checklist.tenant_signature_url;
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              const imgWidth = 60;
              const imgHeight = (img.height / img.width) * imgWidth;
              doc.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight);
              doc.text('Tenant Signature', margin, yPosition + imgHeight + 5);
              yPosition += imgHeight + 15;
              resolve();
            } catch (error) {
              doc.text('Tenant Signature: [Image not available]', margin, yPosition);
              yPosition += 10;
              resolve();
            }
          };
          img.onerror = () => {
            doc.text('Tenant Signature: [Image not available]', margin, yPosition);
            yPosition += 10;
            resolve();
          };
        });
      } catch (error) {
        doc.text('Tenant Signature: [Image not available]', margin, yPosition);
        yPosition += 10;
      }
    }
  }

  // FOOTER
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    
    const generatedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const footerText = `Generated by Propli on ${generatedDate}`;
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, pageWidth - margin - footerWidth, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, margin, pageHeight - 10);
  }

  // Generate filename
  const propertyName = property ? property.address.replace(/[^a-z0-9]/gi, '_') : 'NoProperty';
  const unitText = checklist.unit_number ? `_Unit${checklist.unit_number}` : '';
  const dateText = checklist.inspection_date ? `_${checklist.inspection_date}` : '';
  const filename = `${inspectionType.replace(/\s+/g, '_')}_${propertyName}${unitText}${dateText}.pdf`;

  // Save PDF
  doc.save(filename);
};
