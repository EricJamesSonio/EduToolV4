// @/modules/program/program.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProgramService } from './program.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('programs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  /**
   * POST /programs
   * Creates a new program (built-in or custom).
   */
  @Post()
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateProgramDto,
  ) {
    return this.programService.create(orgId, dto);
  }

  /**
   * GET /programs
   * Returns all programs for the org.
   */
  @Get()
  async findAll(@CurrentUser('orgId') orgId: string) {
    return this.programService.findAll(orgId);
  }

  /**
   * GET /programs/:id
   * Returns a single program.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.programService.findById(id, orgId);
  }

  /**
   * PATCH /programs/:id
   * Updates program name or type.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programService.update(id, orgId, dto);
  }

  /**
   * DELETE /programs/:id
   * Deletes a program. Blocked if levels are linked to it.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.programService.remove(id, orgId);
  }
}