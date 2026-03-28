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
} from '@nestjs/common'
import { ProgramService } from './program.service'
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto'
import { AuthGuard } from '@/commons/guards/auth.guard'
import { RolesGuard } from '@/commons/guards/role.guard'
import { Roles } from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'

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
    return this.programService.create(orgId, dto)
  }

  /**
   * Returns all programs with their courses[] and strands[] (lightweight).
   * Use this for pickers and dashboard lists.
   */
  @Get()
  async findAll(@CurrentUser('orgId') orgId: string) {
    return this.programService.findAll(orgId)
  }

  /**
   * Returns full program detail:
   * program → courses → subjects[]
   * program → strands → subjects[]
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.programService.findById(id, orgId)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programService.update(id, orgId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    await this.programService.remove(id, orgId)
  }
}