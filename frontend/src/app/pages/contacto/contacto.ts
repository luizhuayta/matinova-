import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.scss']
})
export class Contacto {
  private http = inject(HttpClient);

  nombre: string = '';
  email: string = '';
  asunto: string = '';
  mensaje: string = '';

  enviar() {
    const urlBackend = 'https://api.myec.website/contacto';

    const body = {
      name: this.nombre,
      email: this.email,
      subject: this.asunto,
      message: this.mensaje
    };

    this.http.post(urlBackend, body).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Mensaje enviado!',
          text: 'Nos pondremos en contacto contigo lo antes posible.',
          icon: 'success',
          confirmButtonColor: '#00aaff',
          confirmButtonText: 'Aceptar'
        });
        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('Error al enviar contacto:', err);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al enviar el mensaje. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }

  limpiarFormulario() {
    this.nombre = '';
    this.email = '';
    this.asunto = '';
    this.mensaje = '';
  }
}
