import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { StrandService } from './strand.service'
import { CreateStrandDto, UpdateStrandDto, StrandQueryDto } from './dto/strand.dto'
import { AuthGuard } from '@/commons/guards/auth.guard'
import { RolesGuard } from '@/commons/guards/role.guard'
import { Roles } from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'

@UseGuards(AuthGuard, RolesGuard)
@Controller('strands')
export class StrandController {
  constructor(private readonly strandService: StrandService) {}

  @Post()
  @Roles('admin', 'platform_owner')
  create(@Body() dto: CreateStrandDto) {
    return this.strandService.create(dto)
  }

  @Get()
  @Roles('admin', 'educator', 'platform_owner')
  findAll(@CurrentUser() user: any, @Query() query: StrandQueryDto) {
    return this.strandService.findAll(user.org_id, query)
  }

  @Get(':id')
  @Roles('admin', 'educator', 'platform_owner')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.strandService.findOne(id, user.org_id)
  }

  @Patch(':id')
  @Roles('admin', 'platform_owner')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStrandDto,
  ) {
    return this.strandService.update(id, user.org_id, dto)
  }

  @Delete(':id')
  @Roles('admin', 'platform_owner')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.strandService.remove(id, user.org_id)
  }
}