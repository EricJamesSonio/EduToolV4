import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
  BadRequestException
} from '@nestjs/common'
import { ProgramService } from './program.service'
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto'
import { AuthGuard } from '@/commons/guards/auth.guard'
import { RolesGuard } from '@/commons/guards/role.guard'
import { Roles } from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'
import { IsOptional, IsUUID } from 'class-validator'

class ProgramQueryDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string
}

@Controller('programs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @Post()
  async create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateProgramDto,
  ) {
    if (!orgId) {
      throw new BadRequestException('orgId is missing from user context')
    }

    return this.programService.create(orgId, dto)
  }

  @Get()
  async findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: ProgramQueryDto,
  ) {
    if (!orgId) {
      throw new BadRequestException('orgId is missing from user context')
    }

    if (!query.schoolYearId) return []

    return this.programService.findAll(orgId, query.schoolYearId)
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    if (!orgId) {
      throw new BadRequestException('orgId is missing from user context')
    }

    return this.programService.findById(id, orgId)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateProgramDto,
  ) {
    if (!orgId) {
      throw new BadRequestException('orgId is missing from user context')
    }

    return this.programService.update(id, orgId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    if (!orgId) {
      throw new BadRequestException('orgId is missing from user context')
    }

    await this.programService.remove(id, orgId)
  }
}