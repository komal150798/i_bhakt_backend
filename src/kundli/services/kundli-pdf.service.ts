import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

export interface DetailedDashaPeriod {
  mahadasha: string;
  antardasha: string;
  pratyantar: string;
  start_date: string;
  end_date: string;
  duration_years: number;
}

export interface KundliPdfData {
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  lagna?: {
    sign: string;
    degrees: number;
    lord: string;
  };
  nakshatra?: {
    name: string;
    pada: number;
    lord: string;
  };
  planets?: Array<{
    name: string;
    sign: string;
    sign_lord?: string;
    house?: number;
    nakshatra?: string;
    nakshatra_pada?: number;
    is_retrograde?: boolean;
    longitude?: number;
  }>;
  houses?: Array<{
    house_number: number;
    sign: string;
    sign_lord?: string;
    start_degree?: number;
    end_degree?: number;
  }>;
  ayanamsa?: number;
  tithi?: string;
  yoga?: string;
  karana?: string;
  dasha_timeline?: {
    vimshottari?: {
      mahadasha?: Array<{
        lord: string;
        start: string;
        end: string;
        duration_years: number;
      }>;
      current_mahadasha?: string;
      current_antardasha?: string;
      current_pratyantar?: string;
      detailed_timeline?: DetailedDashaPeriod[];
    };
  };
}

@Injectable()
export class KundliPdfService {
  private readonly logger = new Logger(KundliPdfService.name);

  /**
   * Generate PDF buffer from Kundli data
   * @param data Kundli data to include in PDF
   * @returns Promise<Buffer> PDF file buffer
   */
  async generatePdf(data: KundliPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true, // Enable page buffering for footer with page numbers
          info: {
            Title: `Kundli Report - ${data.name}`,
            Author: 'iBhakt',
            Subject: 'Vedic Birth Chart Report',
            Creator: 'iBhakt Digital Twin',
          },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate PDF content
        this.addHeader(doc, data);
        this.addBasicDetails(doc, data);
        this.addLagnaNakshatra(doc, data);
        this.addPanchang(doc, data);
        this.addDashaSection(doc, data);
        this.addPlanetaryPositions(doc, data);
        this.addHousesSection(doc, data);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        this.logger.error('Error generating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Add header with title and branding
   */
  private addHeader(doc: PDFKit.PDFDocument, data: KundliPdfData): void {
    // Title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('iBhakt Kundli Report', { align: 'center' });

    doc.moveDown(0.5);

    // Subtitle with name
    doc
      .fontSize(16)
      .font('Helvetica')
      .fillColor('#4a5568')
      .text(`Birth Chart for ${data.name}`, { align: 'center' });

    // Decorative line
    doc.moveDown(0.5);
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(1);
  }

  /**
   * Add basic birth details section
   */
  private addBasicDetails(doc: PDFKit.PDFDocument, data: KundliPdfData): void {
    this.addSectionTitle(doc, 'Birth Details');

    const detailsY = doc.y;
    const col1X = 50;
    const col2X = 300;

    doc.fontSize(10).font('Helvetica').fillColor('#2d3748');

    // Column 1
    this.addLabelValue(doc, 'Name:', data.name, col1X, detailsY);
    this.addLabelValue(doc, 'Birth Date:', this.formatDate(data.birth_date), col1X, detailsY + 18);
    this.addLabelValue(doc, 'Birth Time:', data.birth_time, col1X, detailsY + 36);

    // Column 2
    this.addLabelValue(doc, 'Birth Place:', data.birth_place, col2X, detailsY);
    this.addLabelValue(doc, 'Timezone:', data.timezone || 'Asia/Kolkata', col2X, detailsY + 18);
    if (data.ayanamsa) {
      this.addLabelValue(doc, 'Ayanamsa:', `${data.ayanamsa.toFixed(4)}°`, col2X, detailsY + 36);
    }

    doc.y = detailsY + 60;
    doc.moveDown(1);
  }

  /**
   * Add Lagna and Nakshatra section
   */
  private addLagnaNakshatra(doc: PDFKit.PDFDocument, data: KundliPdfData): void {
    if (!data.lagna && !data.nakshatra) return;

    this.addSectionTitle(doc, 'Lagna & Nakshatra');

    const startY = doc.y;
    const boxWidth = 240;
    const boxHeight = 70;
    const gap = 15;

    // Lagna Box
    if (data.lagna) {
      this.drawInfoBox(doc, 50, startY, boxWidth, boxHeight, '#f7fafc', '#e2e8f0');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d');
      doc.text('Lagna (Ascendant)', 60, startY + 10);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2b6cb0');
      doc.text(data.lagna.sign, 60, startY + 28);
      doc.fontSize(9).font('Helvetica').fillColor('#4a5568');
      doc.text(`${data.lagna.degrees?.toFixed(2) || '0'}° | Lord: ${data.lagna.lord}`, 60, startY + 48);
    }

    // Nakshatra Box
    if (data.nakshatra) {
      this.drawInfoBox(doc, 50 + boxWidth + gap, startY, boxWidth, boxHeight, '#f7fafc', '#e2e8f0');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d');
      doc.text('Nakshatra', 60 + boxWidth + gap, startY + 10);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2b6cb0');
      doc.text(data.nakshatra.name, 60 + boxWidth + gap, startY + 28);
      doc.fontSize(9).font('Helvetica').fillColor('#4a5568');
      doc.text(`Pada ${data.nakshatra.pada} | Lord: ${data.nakshatra.lord}`, 60 + boxWidth + gap, startY + 48);
    }

    doc.y = startY + boxHeight + 15;
    doc.moveDown(0.5);
  }

  /**
   * Add Panchang section (Tithi, Yoga, Karana)
   */
  private addPanchang(doc: PDFKit.PDFDocument, data: KundliPdfData): void {
    if (!data.tithi && !data.yoga && !data.karana) return;

    this.addSectionTitle(doc, 'Panchang Details');

    const startY = doc.y;
    const colWidth = 160;

    doc.fontSize(10).font('Helvetica').fillColor('#2d3748');

    if (data.tithi) {
      this.addLabelValue(doc, 'Tithi:', data.tithi, 50, startY);
    }
    if (data.yoga) {
      this.addLabelValue(doc, 'Yoga:', data.yoga, 50 + colWidth, startY);
    }
    if (data.karana) {
      this.addLabelValue(doc, 'Karana:', data.karana, 50 + colWidth * 2, startY);
    }

    doc.y = startY + 25;
    doc.moveDown(1);
  }

  /**
   * Add Dasha (Mahadasha, Antardasha, Pratyantar) section
   */
  private addDashaSection(doc: PDFKit.PDFDocument, data: KundliPdfData): void {
    const dasha = data.dasha_timeline?.vimshottari;
    if (!dasha) return;

    // Need at least 150px for Current Dasha box + title + some rows
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }

    this.addSectionTitle(doc, 'Vimshottari Dasha');

    // Current Dasha Box
    const boxY = doc.y;
    this.drawInfoBox(doc, 50, boxY, 495, 60, '#ebf8ff', '#90cdf4');

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a365d');
    doc.text('Current Dasha Period', 60, boxY + 8);

    doc.fontSize(10).font('Helvetica').fillColor('#2d3748');
    const currentY = boxY + 28;

    // Current Mahadasha
    doc.font('Helvetica-Bold').text('Mahadasha: ', 60, currentY, { continued: true });
    doc.font('Helvetica').fillColor('#2b6cb0').text(dasha.current_mahadasha || 'N/A');

    // Current Antardasha
    doc.font('Helvetica-Bold').fillColor('#2d3748').text('Antardasha: ', 200, currentY, { continued: true });
    doc.font('Helvetica').fillColor('#2b6cb0').text(dasha.current_antardasha || 'N/A');

    // Current Pratyantar
    doc.font('Helvetica-Bold').fillColor('#2d3748').text('Pratyantar: ', 350, currentY, { continued: true });
    doc.font('Helvetica').fillColor('#2b6cb0').text(dasha.current_pratyantar || 'N/A');

    doc.y = boxY + 70;
    doc.moveDown(0.5);

    // Detailed Dasha Timeline Table (Mahadasha > Antardasha > Pratyantar)
    if (dasha.detailed_timeline && dasha.detailed_timeline.length > 0) {
      this.addDetailedDashaTable(doc, dasha.detailed_timeline, dasha.current_mahadasha, dasha.current_antardasha, dasha.current_pratyantar);
    } else if (dasha.mahadasha && dasha.mahadasha.length > 0) {
      // Fallback to simple Mahadasha Timeline Table
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a365d');
      doc.text('Mahadasha Timeline', 50, doc.y);
      doc.moveDown(0.5);

      const tableY = doc.y;
      const colWidths = [80, 140, 140, 100];
      const headers = ['Lord', 'Start Date', 'End Date', 'Duration'];

      this.drawTableHeader(doc, 50, tableY, colWidths, headers);

      let rowY = tableY + 22;
      const maxRows = Math.min(dasha.mahadasha.length, 9);

      for (let i = 0; i < maxRows; i++) {
        const maha = dasha.mahadasha[i];
        const isCurrentMaha = maha.lord === dasha.current_mahadasha;

        if (isCurrentMaha) {
          doc.rect(50, rowY - 2, 460, 18).fill('#ebf8ff');
        }

        doc.fontSize(9).font(isCurrentMaha ? 'Helvetica-Bold' : 'Helvetica').fillColor('#2d3748');

        let xPos = 55;
        doc.text(maha.lord, xPos, rowY);
        xPos += colWidths[0];
        doc.text(this.formatDate(maha.start), xPos, rowY);
        xPos += colWidths[1];
        doc.text(this.formatDate(maha.end), xPos, rowY);
        xPos += colWidths[2];
        doc.text(`${maha.duration_years} years`, xPos, rowY);

        rowY += 18;
      }

      doc.y = rowY + 10;
    }

    doc.moveDown(1);
  }

  /**
   * Add Detailed Dasha Timeline Table with Mahadasha, Antardasha, Pratyantar
   */
  private addDetailedDashaTable(
    doc: PDFKit.PDFDocument,
    detailedTimeline: DetailedDashaPeriod[],
    currentMaha?: string,
    currentAntara?: string,
    currentPratyantar?: string,
  ): void {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a365d');
    doc.text('Detailed Dasha Timeline', 50, doc.y);
    doc.moveDown(0.5);

    // Table columns: Mahadasha, Antardasha, Pratyantar, Start Date, End Date, Duration
    const colWidths = [70, 70, 70, 95, 95, 60];
    const headers = ['Mahadasha', 'Antardasha', 'Pratyantar', 'Start Date', 'End Date', 'Duration'];
    const rowHeight = 16;
    const headerHeight = 20;
    const pageMarginBottom = 740; // Leave room for footer

    let tableY = doc.y;

    // Draw initial header
    this.drawDashaTableHeader(doc, 50, tableY, colWidths, headers);
    let rowY = tableY + headerHeight + 2;

    // Track previous values for row grouping visual
    const state = { prevMaha: '', prevAntara: '', rowY, tableY };

    const currentDasha = { maha: currentMaha, antara: currentAntara, pratyantar: currentPratyantar };

    for (const period of detailedTimeline) {
      // Check if we need a new page
      if (state.rowY > pageMarginBottom) {
        state.tableY = this.addDashaPageBreak(doc, colWidths, headers, headerHeight);
        state.rowY = state.tableY + headerHeight + 2;
        state.prevMaha = '';
        state.prevAntara = '';
      }

      state.rowY = this.renderDashaPeriodRow(doc, period, {
        state, colWidths, rowHeight, headerHeight, currentDasha,
      });
    }

    doc.y = state.rowY + 10;
  }

  /**
   * Add page break for dasha table and return new tableY
   */
  private addDashaPageBreak(
    doc: PDFKit.PDFDocument,
    colWidths: number[],
    headers: string[],
    headerHeight: number,
  ): number {
    doc.addPage();
    doc.y = 50;
    let tableY = 50;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a365d');
    doc.text('Detailed Dasha Timeline (Continued)', 50, tableY);
    tableY += 25;
    doc.y = tableY;

    this.drawDashaTableHeader(doc, 50, tableY, colWidths, headers);
    return tableY;
  }

  /**
   * Render a single dasha period row and return new rowY
   */
  private renderDashaPeriodRow(
    doc: PDFKit.PDFDocument,
    period: DetailedDashaPeriod,
    options: {
      state: { prevMaha: string; prevAntara: string; rowY: number; tableY: number };
      colWidths: number[];
      rowHeight: number;
      headerHeight: number;
      currentDasha?: { maha?: string; antara?: string; pratyantar?: string };
    },
  ): number {
    const { state, colWidths, rowHeight, headerHeight, currentDasha } = options;

    const isCurrentPeriod =
      period.mahadasha === currentDasha?.maha &&
      period.antardasha === currentDasha?.antara &&
      period.pratyantar === currentDasha?.pratyantar;

    const mahaChanged = period.mahadasha !== state.prevMaha;
    const antaraChanged = period.antardasha !== state.prevAntara;
    const isFirstRow = state.rowY === state.tableY + headerHeight + 2;

    // Draw row background
    const bgColor = this.getDashaRowBgColor(isCurrentPeriod, mahaChanged, period.mahadasha);
    if (bgColor) {
      doc.rect(50, state.rowY - 1, 460, rowHeight).fill(bgColor);
    }

    // Draw row content
    doc.fontSize(8).fillColor('#2d3748');
    let xPos = 55;

    // Mahadasha - show only when changed
    if (mahaChanged || isFirstRow) {
      doc.font('Helvetica-Bold').text(period.mahadasha, xPos, state.rowY, { width: colWidths[0] - 5 });
      state.prevMaha = period.mahadasha;
    }
    xPos += colWidths[0];

    // Antardasha - show only when changed
    if (antaraChanged || mahaChanged || isFirstRow) {
      doc.font('Helvetica-Bold').text(period.antardasha, xPos, state.rowY, { width: colWidths[1] - 5 });
      state.prevAntara = period.antardasha;
    }
    xPos += colWidths[1];

    // Pratyantar
    doc.font(isCurrentPeriod ? 'Helvetica-Bold' : 'Helvetica').text(period.pratyantar, xPos, state.rowY, { width: colWidths[2] - 5 });
    xPos += colWidths[2];

    // Dates and Duration
    doc.font('Helvetica');
    doc.text(this.formatDate(period.start_date), xPos, state.rowY, { width: colWidths[3] - 5 });
    xPos += colWidths[3];
    doc.text(this.formatDate(period.end_date), xPos, state.rowY, { width: colWidths[4] - 5 });
    xPos += colWidths[4];
    doc.text(this.formatDuration(period.duration_years), xPos, state.rowY, { width: colWidths[5] - 5 });

    return state.rowY + rowHeight;
  }

  /**
   * Get background color for dasha row based on state
   */
  private getDashaRowBgColor(isCurrentPeriod: boolean, mahaChanged: boolean, mahadasha: string): string | null {
    if (isCurrentPeriod) {
      return '#d4edda';
    }
    if (mahaChanged && this.getMahadashaIndex(mahadasha) % 2 === 0) {
      return '#f8f9fa';
    }
    return null;
  }

  /**
   * Draw Dasha table header with background
   */
  private drawDashaTableHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    colWidths: number[],
    headers: string[],
  ): void {
    const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);

    // Header background
    doc.rect(x, y, totalWidth, 18).fill('#2b6cb0');

    // Header text
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');

    let xPos = x + 5;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], xPos, y + 5, { width: colWidths[i] - 5 });
      xPos += colWidths[i];
    }
  }

  /**
   * Get Mahadasha index for alternating colors
   */
  private getMahadashaIndex(lord: string): number {
    const dashaSequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
    return dashaSequence.indexOf(lord);
  }

  /**
   * Format duration in years to readable format
   */
  private formatDuration(years: number): string {
    if (years >= 1) {
      return `${years.toFixed(2)}y`;
    } else if (years >= 1 / 12) {
      const months = years * 12;
      return `${months.toFixed(1)}m`;
    } else {
      const days = years * 365;
      return `${Math.round(days)}d`;
    }
  }

  /**
   * Add Planetary Positions section
   */
  private addPlanetaryPositions(doc: PDFKit.PDFDocument, data: KundliPdfData): void {
    if (!data.planets || data.planets.length === 0) return;

    // Check if we need a new page (need space for title + header + at least a few rows)
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }

    this.addSectionTitle(doc, 'Planetary Positions');

    // Table header
    const tableY = doc.y;
    const colWidths = [70, 70, 60, 50, 90, 50];
    const headers = ['Planet', 'Sign', 'Lord', 'House', 'Nakshatra', 'Retro'];

    this.drawTableHeader(doc, 50, tableY, colWidths, headers);

    // Table rows
    let rowY = tableY + 22;

    for (const planet of data.planets) {
      if (rowY > 740) {
        doc.addPage();
        doc.y = 50;
        rowY = 50;
      }

      doc.fontSize(9).font('Helvetica').fillColor('#2d3748');

      let xPos = 55;
      doc.text(planet.name, xPos, rowY);
      xPos += colWidths[0];
      doc.text(planet.sign, xPos, rowY);
      xPos += colWidths[1];
      doc.text(planet.sign_lord || '', xPos, rowY);
      xPos += colWidths[2];
      doc.text(planet.house?.toString() || 'N/A', xPos, rowY);
      xPos += colWidths[3];
      doc.text(`${planet.nakshatra || ''} (${planet.nakshatra_pada || ''})`, xPos, rowY);
      xPos += colWidths[4];
      doc.text(planet.is_retrograde ? 'R' : '-', xPos, rowY);

      rowY += 16;
    }

    doc.y = rowY + 10;
    doc.moveDown(1);
  }

  /**
   * Add Houses section
   */
  private addHousesSection(doc: PDFKit.PDFDocument, data: KundliPdfData): void {
    if (!data.houses || data.houses.length === 0) return;

    // Check if we need a new page (need about 200px for 12 houses in 4 rows)
    if (doc.y > 550) {
      doc.addPage();
      doc.y = 50;
    }

    this.addSectionTitle(doc, 'Houses (Bhavas)');

    // Display houses in a 3-column grid
    const startY = doc.y;
    const colWidth = 155;
    const rowHeight = 40;

    for (let i = 0; i < data.houses.length; i++) {
      const house = data.houses[i];
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 50 + col * colWidth;
      const y = startY + row * rowHeight;

      this.drawInfoBox(doc, x, y, colWidth - 10, rowHeight - 5, '#f7fafc', '#e2e8f0');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a365d');
      doc.text(`House ${house.house_number}`, x + 8, y + 5);

      doc.fontSize(8).font('Helvetica').fillColor('#4a5568');
      doc.text(`${house.sign} | Lord: ${house.sign_lord}`, x + 8, y + 18);
    }

    doc.y = startY + Math.ceil(data.houses.length / 3) * rowHeight + 10;
  }

  /**
   * Add footer with generation timestamp
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Footer line
      doc
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(50, 780)
        .lineTo(545, 780)
        .stroke();

      // Footer text
      doc.fontSize(8).font('Helvetica').fillColor('#718096');
      doc.text(
        `Generated by iBhakt | ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
        50,
        785,
        { align: 'center', width: 495 },
      );
    }
  }

  // ============ Helper Methods ============

  /**
   * Add section title with styling
   */
  private addSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a365d');
    doc.text(title);
    doc.moveDown(0.3);

    // Underline
    doc
      .strokeColor('#4299e1')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(150, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add label-value pair
   */
  private addLabelValue(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
  ): void {
    doc.font('Helvetica-Bold').fillColor('#4a5568').text(label, x, y, { continued: true });
    doc.font('Helvetica').fillColor('#2d3748').text(` ${value}`);
  }

  /**
   * Draw info box with background
   */
  private drawInfoBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    strokeColor: string,
  ): void {
    doc.rect(x, y, width, height).fill(fillColor);
    doc.rect(x, y, width, height).stroke(strokeColor);
  }

  /**
   * Draw table header
   */
  private drawTableHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    colWidths: number[],
    headers: string[],
  ): void {
    const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);

    // Header background
    doc.rect(x, y, totalWidth, 18).fill('#edf2f7');

    // Header text
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a365d');

    let xPos = x + 5;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], xPos, y + 5);
      xPos += colWidths[i];
    }
  }

  /**
   * Format date string to dd/mm/yyyy format
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }
}
