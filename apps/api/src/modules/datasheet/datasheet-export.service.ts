import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { AuthorizationService } from '../../common/services/authorization.service';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';

/**
 * DatasheetExportService — exports DataSheet data to Excel format.
 * Requires member role (any active member) to export. SRS 4.8
 */
@Injectable()
export class DatasheetExportService {
  constructor(
    @InjectRepository(DataSheet)
    private readonly sheetRepo: Repository<DataSheet>,
    @InjectRepository(DataSeries)
    private readonly seriesRepo: Repository<DataSeries>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  /**
   * Export a DataSheet and all its series to an Excel file.
   * Returns buffer and sanitized filename for HTTP response headers.
   */
  async exportToExcel(
    datasheetId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');

    await this.authorizationService.requireMember(sheet.businessId, userId);

    const series = await this.seriesRepo.find({
      where: { dataSheetId: datasheetId },
      order: { rowIndex: 'ASC' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data');

    // Header row: blank cell for series name column, then period headers
    ws.addRow(['', ...sheet.periodHeaders]);
    ws.getRow(1).font = { bold: true };

    // Data rows: series name then values in period order
    series.forEach((s) => {
      ws.addRow([s.seriesName, ...sheet.periodHeaders.map((h) => s.values[h] ?? 0)]);
    });

    // Set column widths for readability
    ws.getColumn(1).width = 20;
    sheet.periodHeaders.forEach((_, i) => {
      ws.getColumn(i + 2).width = 15;
    });

    const rawBuffer = await wb.xlsx.writeBuffer();
    const buffer = Buffer.from(rawBuffer);
    // Sanitize sheet name for use as filename (replace non-alphanumeric with underscore)
    const fileName = `${sheet.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.xlsx`;

    return { buffer, fileName };
  }
}
