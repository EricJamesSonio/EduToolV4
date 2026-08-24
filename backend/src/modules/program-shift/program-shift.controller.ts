import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProgramShiftService } from './program-shift.service';
import { ShiftProgramDto } from './dto/program-shift.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('school-years/:schoolYearId/enrollments/:studentSchoolYearId/shift')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ProgramShiftController {
  constructor(private readonly service: ProgramShiftService) {}

  @Post()
  shift(
    @Param('studentSchoolYearId') studentSchoolYearId: string,
    @CurrentUser() user: { org_id: string; id: string },
    @Body() dto: ShiftProgramDto,
  ) {
    return this.service.shiftProgram(user.org_id, studentSchoolYearId, user.id, dto);
  }
}
