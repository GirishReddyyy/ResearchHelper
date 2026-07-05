const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const Report = require('../models/Report');
const Paper = require('../models/Paper');
const User = require('../models/User');
const { uploadToGridFS } = require('./gridfsService');
const { generateCitation } = require('../utils/citationFormatter');
const logger = require('../utils/logger');

/**
 * Generate report files (PDF, DOCX, Markdown) and store in GridFS
 */
const generateReportFiles = async (reportId) => {
  const report = await Report.findById(reportId).populate('papers');
  if (!report) throw new Error('Report not found');

  report.status = 'generating';
  await report.save();

  try {
    // Sort sections by order
    const sections = (report.sections || []).sort((a, b) => a.order - b.order);

    // Generate all three formats
    const [pdfResult, docxResult, mdResult] = await Promise.all([
      generatePDF(report, sections),
      generateDOCX(report, sections),
      generateMarkdown(report, sections),
    ]);

    report.files = [pdfResult, docxResult, mdResult];
    report.status = 'completed';
    await report.save();

    // Update user report count
    await User.findByIdAndUpdate(report.user, { $inc: { reportsGenerated: 1 } });

    logger.info(`Report generated: ${report.title} (${report._id})`);
    return report;
  } catch (error) {
    report.status = 'failed';
    await report.save();
    throw error;
  }
};

/**
 * Generate PDF and store in GridFS
 */
const generatePDF = async (report, sections) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        info: {
          Title: report.title,
          Author: 'Research Helper',
          Subject: report.topic || '',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          const gridfsId = await uploadToGridFS(buffer, filename, {
            reportId: report._id,
            format: 'pdf',
          });

          resolve({
            format: 'pdf',
            gridfsId,
            filename,
            size: buffer.length,
            mimeType: 'application/pdf',
            generatedAt: new Date(),
          });
        } catch (err) {
          reject(err);
        }
      });

      // Title page
      doc.fontSize(28).font('Helvetica-Bold').text(report.title, { align: 'center' });
      doc.moveDown(2);
      if (report.topic) {
        doc.fontSize(16).font('Helvetica').text(report.topic, { align: 'center' });
      }
      doc.moveDown(1);
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1);
      doc.text('Research Intelligence Platform', { align: 'center' });
      doc.addPage();

      // Sections
      for (const section of sections) {
        doc.fontSize(18).font('Helvetica-Bold').text(section.title || section.type);
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(section.content || '', {
          align: 'justify',
          lineGap: 4,
        });
        doc.moveDown(1.5);
      }

      // References section
      if (report.papers?.length) {
        doc.addPage();
        doc.fontSize(18).font('Helvetica-Bold').text('References');
        doc.moveDown(0.5);
        report.papers.forEach((paper, i) => {
          const citation = generateCitation(paper, 'apa');
          doc.fontSize(10).font('Helvetica').text(`[${i + 1}] ${citation}`, {
            lineGap: 4,
          });
          doc.moveDown(0.5);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate DOCX and store in GridFS
 */
const generateDOCX = async (report, sections) => {
  const children = [];

  // Title
  children.push(
    new Paragraph({
      text: report.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );

  if (report.topic) {
    children.push(
      new Paragraph({
        text: report.topic,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  children.push(
    new Paragraph({
      text: `Generated: ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // Sections
  for (const section of sections) {
    children.push(
      new Paragraph({
        text: section.title || section.type,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // Split content into paragraphs
    const contentParagraphs = (section.content || '').split('\n').filter(Boolean);
    for (const para of contentParagraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para, size: 22 })],
          spacing: { after: 120 },
        })
      );
    }
  }

  // References
  if (report.papers?.length) {
    children.push(
      new Paragraph({
        text: 'References',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    report.papers.forEach((paper, i) => {
      const citation = generateCitation(paper, 'apa');
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `[${i + 1}] ${citation}`, size: 20 })],
          spacing: { after: 100 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  const gridfsId = await uploadToGridFS(buffer, filename, {
    reportId: report._id,
    format: 'docx',
  });

  return {
    format: 'docx',
    gridfsId,
    filename,
    size: buffer.length,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedAt: new Date(),
  };
};

/**
 * Generate Markdown and store in GridFS
 */
const generateMarkdown = async (report, sections) => {
  let md = `# ${report.title}\n\n`;
  if (report.topic) md += `**Topic:** ${report.topic}\n\n`;
  md += `**Generated:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

  for (const section of sections) {
    md += `## ${section.title || section.type}\n\n`;
    md += `${section.content || ''}\n\n`;
  }

  // References
  if (report.papers?.length) {
    md += `## References\n\n`;
    report.papers.forEach((paper, i) => {
      const citation = generateCitation(paper, 'apa');
      md += `[${i + 1}] ${citation}\n\n`;
    });
  }

  const buffer = Buffer.from(md, 'utf-8');
  const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  const gridfsId = await uploadToGridFS(buffer, filename, {
    reportId: report._id,
    format: 'markdown',
  });

  return {
    format: 'markdown',
    gridfsId,
    filename,
    size: buffer.length,
    mimeType: 'text/markdown',
    generatedAt: new Date(),
  };
};

module.exports = { generateReportFiles };
