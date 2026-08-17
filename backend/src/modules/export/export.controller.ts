import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('classes')
@UseGuards(AuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ✅ #2a — GET /classes/:classId/export/csv
  @Get(':classId/export/csv')
  @Roles('admin', 'educator')
  async exportCsv(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.buildClassCsv(classId, orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="class-${classId}-grades.csv"`,
    );
    res.send(csv);
  }

  // ✅ #2b — GET /classes/:classId/students/:studentId/card
  @Get(':classId/students/:studentId/card')
  @Roles('admin', 'educator')
  async exportCard(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('org_id') orgId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.exportService.buildClassCard(
      classId,
      studentId,
      orgId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="class-card-${studentId}.pdf"`,
    );
    res.send(pdfBuffer);
  }
}
