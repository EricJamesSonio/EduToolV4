import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';
import { GradeTemplateService } from './grade-template.service';
import {
  SaveGradeTemplateMappingDto,
  UploadGradeTemplateDto,
} from './dto/grade-template.dto';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function sendWorkbook(res: Response, fileName: string, buffer: Buffer): void {
  const safe = fileName.replace(/[^\w.\- ]+/g, '_');
  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
  res.send(buffer);
}

@Controller('grade-templates')
@UseGuards(AuthGuard, RolesGuard)
export class GradeTemplateController {
  constructor(private readonly service: GradeTemplateService) {}

  // ── Educator routes (declared first so "mine" is never read as an :id) ──

  // GET /grade-templates/mine
  @Get('mine')
  @Roles('educator')
  listMine(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.service.listMine(orgId, educatorId, schoolYearId);
  }

  // GET /grade-templates/mine/:id/download
  @Get('mine/:id/download')
  @Roles('educator')
  async downloadMine(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Res() res: Response,
  ) {
    const file = await this.service.downloadMine(orgId, educatorId, id);
    sendWorkbook(res, file.fileName, file.buffer);
  }

  // POST /grade-templates/mine/:id/submit
  @Post('mine/:id/submit')
  @Roles('educator')
  submitMine(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.service.submitMine(orgId, educatorId, id);
  }

  // ── Admin routes ──

  // GET /grade-templates/programs?schoolYearId=
  @Get('programs')
  @Roles('admin')
  listPrograms(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    if (!schoolYearId) throw new BadRequestException('schoolYearId is required.');
    return this.service.listPrograms(orgId, schoolYearId);
  }

  // POST /grade-templates
  @Post()
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\.xlsx$/i.test(file.originalname)) {
          cb(
            new BadRequestException('Only .xlsx workbooks are supported.'),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadGradeTemplateDto,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.upload(orgId, actorId, dto, file);
  }

  // GET /grade-templates?schoolYearId=
  @Get()
  @Roles('admin')
  list(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.service.list(orgId, schoolYearId);
  }

  // GET /grade-templates/:id/analysis
  @Get(':id/analysis')
  @Roles('admin')
  analysis(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.service.analysis(orgId, id);
  }

  // GET /grade-templates/:id/preview?sheet=&offset=&limit=
  @Get(':id/preview')
  @Roles('admin')
  preview(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Query('sheet') sheet?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.preview(orgId, id, { sheet, offset, limit });
  }

  // GET /grade-templates/:id/mapping?sheet=&headerRow=
  @Get(':id/mapping')
  @Roles('admin')
  mappingInfo(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Query('sheet') sheet?: string,
    @Query('headerRow') headerRow?: string,
  ) {
    return this.service.mappingInfo(orgId, id, { sheet, headerRow });
  }

  // PUT /grade-templates/:id/mapping
  @Put(':id/mapping')
  @Roles('admin')
  saveMapping(
    @Param('id') id: string,
    @Body() dto: SaveGradeTemplateMappingDto,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.saveMapping(orgId, actorId, id, dto);
  }

  // GET /grade-templates/:id/progress
  @Get(':id/progress')
  @Roles('admin')
  progress(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.service.progress(orgId, id);
  }

  // GET /grade-templates/:id/master
  @Get(':id/master')
  @Roles('admin')
  async master(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Res() res: Response,
  ) {
    const file = await this.service.master(orgId, id);
    sendWorkbook(res, file.fileName, file.buffer);
  }

  // DELETE /grade-templates/:id
  @Delete(':id')
  @Roles('admin')
  remove(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.remove(orgId, actorId, id);
  }
}