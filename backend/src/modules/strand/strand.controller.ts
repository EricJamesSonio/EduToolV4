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
} from '@nestjs/common';
import { StrandService } from './strand.service';
import {
  CreateStrandDto,
  UpdateStrandDto,
  StrandQueryDto,
} from './dto/strand.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('strands')
export class StrandController {
  constructor(private readonly strandService: StrandService) {}

  @Post()
  @Roles('admin', 'platform_owner')
  create(@CurrentUser('org_id') orgId: string, @Body() dto: CreateStrandDto) {
    return this.strandService.create(orgId, dto);
  }

  @Get()
  @Roles('admin', 'educator', 'platform_owner')
  findAll(
    @CurrentUser('org_id') orgId: string,
    @Query() query: StrandQueryDto,
  ) {
    return this.strandService.findAll(orgId, query);
  }

  @Get(':id')
  @Roles('admin', 'educator', 'platform_owner')
  findOne(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.strandService.findOne(id, orgId);
  }

  @Patch(':id')
  @Roles('admin', 'platform_owner')
  update(
    @Param('id') id: string,
    @CurrentUser('org_id') orgId: string,
    @Body() dto: UpdateStrandDto,
  ) {
    return this.strandService.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles('admin', 'platform_owner')
  remove(@Param('id') id: string, @CurrentUser('org_id') orgId: string) {
    return this.strandService.remove(id, orgId);
  }
}
