// src/modules/program/entity/program.entity.ts
import { ProgramType } from '../dto/program.dto';

export class ProgramEntity {
  id: string;
  orgId: string;
  name: string;
  type: ProgramType;
}