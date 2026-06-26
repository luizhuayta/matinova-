import { Module } from '@nestjs/common';
import { ReclamacionesController } from './reclamaciones.controller';
import { ReclamacionesService } from './reclamaciones.service';

@Module({
  controllers: [ReclamacionesController],
  providers: [ReclamacionesService],
})
export class ReclamacionesModule {}
