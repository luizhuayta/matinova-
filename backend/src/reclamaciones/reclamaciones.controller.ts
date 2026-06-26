import { Controller, Post, Body } from '@nestjs/common';
import { ReclamacionesService } from './reclamaciones.service';
type ReclamoDto = Parameters<ReclamacionesService['registrarYEnviar']>[0];
type ContactoDto = Parameters<ReclamacionesService['enviarContacto']>[0];

@Controller('reclamaciones')
export class ReclamacionesController {
  constructor(private readonly reclamacionesService: ReclamacionesService) {}

  @Post()
  crearReclamo(@Body() datosReclamo: ReclamoDto) {
    const ticketNumber = `R-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    this.reclamacionesService.registrarYEnviar(datosReclamo, ticketNumber);

    return { success: true, ticket: ticketNumber };
  }

  @Post('contacto')
  crearContacto(@Body() datosContacto: ContactoDto) {
    this.reclamacionesService.enviarContacto(datosContacto);

    return { success: true };
  }
}
