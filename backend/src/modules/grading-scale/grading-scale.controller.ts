import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
  AssignGradingScaleDto,
} from './dto/grading-scale.dto';
import { AuthGuard }   from '@/commons/guards/auth.guard';
import { RolesGuard }  from '@/commons/guards/role.guard';
import { Roles }       from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('grading-scales')
@UseGuards(AuthGuard, RolesGuard)
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  @Get('by-class/:classId')
  async findByClass(
    @Param('classId') classId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const scale = await this.gradingScaleService.findByClassId(classId, orgId);
    if (!scale) {
      throw new NotFoundException(
        "No grading scale configured for this class's program.",
      );
    }
    return scale;
  }

  @Post('programs/:programId/grading-scale')
  @Roles('admin')
  async assignToProgram(
    @Param('programId') programId: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: AssignGradingScaleDto,
  ) {
    return this.gradingScaleService.assignToProgram(
      orgId,
      programId,
      dto.scaleId,
      dto.schoolYearId,
    );
  }

  @Get('assignments')
  async getAssignments(
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.gradingScaleService.getAssignments(orgId, schoolYearId);
  }

  @Delete('assignments')
  @Roles('admin')
  async removeAssignment(
    @CurrentUser('org_id') orgId: string,
    @Query('programId') programId: string,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    await this.gradingScaleService.removeAssignment(
      orgId,
      programId,
      schoolYearId,
    );
    return { success: true };
  }

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('org_id') orgId: string,
    @Body() dto: CreateGradingScaleDto,
  ) {
    return this.gradingScaleService.create(orgId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: QueryGradingScaleDto,
  ) {
    return this.gradingScaleService.findAll(orgId, query);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateGradingScaleDto,
  ) {
    return this.gradingScaleService.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.gradingScaleService.delete(id, orgId);
  }
}
