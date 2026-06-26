import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface ReclamoDto {
  fullname: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  typeOfBien: 'producto' | 'servicio';
  claimedAmount: number | null;
  descriptionBien: string;
  typeOfAccion: 'reclamo' | 'queja';
  details: string;
  consumerPedido: string;
}

interface ContactoDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable()
export class ReclamacionesService {
  constructor(private readonly mailerService: MailerService) {}

  registrarYEnviar(datos: ReclamoDto, ticketNumber: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0c2340; text-align: center;">Hoja de Reclamación Virtual</h2>
        <p style="text-align: center; font-size: 14px; color: #666;">Se ha registrado un nuevo caso con el ticket: <strong>${ticketNumber}</strong></p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <h3>1. Identificación del Consumidor</h3>
        <p><strong>Nombre:</strong> ${datos.fullname}</p>
        <p><strong>Documento:</strong> ${datos.documentType} - ${datos.documentNumber}</p>
        <p><strong>Teléfono:</strong> ${datos.phone} | <strong>Email:</strong> ${datos.email}</p>
        <p><strong>Domicilio:</strong> ${datos.address}</p>
        <h3>2. Detalle del Bien Contratado</h3>
        <p><strong>Tipo:</strong> ${datos.typeOfBien}</p>
        <p><strong>Monto:</strong> ${datos.claimedAmount ? `S/ ${datos.claimedAmount}` : 'No especificado (Opcional)'}</p>
        <p><strong>Descripción:</strong> ${datos.descriptionBien}</p>
        <h3>3. Detalle de la Reclamación</h3>
        <p><strong>Acción:</strong> ${datos.typeOfAccion}</p>
        <p><strong>Detalle:</strong> ${datos.details}</p>
        <p><strong>Pedido Concreto:</strong> ${datos.consumerPedido}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #999; text-align: center;">Este es un correo automático enviado conforme a las normativas de Indecopi por Matt Innova Solution.</p>
      </div>
    `;

    // El proceso de envío de Mailer sigue siendo una promesa, pero la manejamos con un catch silencioso
    this.mailerService
      .sendMail({
        to: [datos.email, 'yastin.vasquezrosales6@gmail.com'],
        subject: `Libro de Reclamaciones - Ticket ${ticketNumber}`,
        html: htmlContent,
      })
      .catch((err) =>
        console.error('Error enviando correo de reclamo en background:', err),
      );
  }

  enviarContacto(datos: ContactoDto) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #00aaff; text-align: center;">Nuevo Mensaje de Contacto</h2>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><strong>Nombre del interesado:</strong> ${datos.name}</p>
        <p><strong>Correo de contacto:</strong> ${datos.email}</p>
        <p><strong>Asunto:</strong> ${datos.subject}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <h3>Mensaje:</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #00aaff;">
          ${datos.message}
        </p>
      </div>
    `;

    this.mailerService
      .sendMail({
        to: ['yastin.vasquezrosales6@gmail.com', datos.email],
        subject: `Contacto Web: ${datos.subject}`,
        html: htmlContent,
      })
      .catch((err) =>
        console.error('Error enviando correo de contacto en background:', err),
      );
  }
}
