import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.scss']
})
export class Contacto {
  nombre: string = '';
  email: string = '';
  asunto: string = '';
  mensaje: string = '';

  enviar() {
    const serviceID = 'service_c4ylqod';
    const templateID = 'template_sb512fl';
    const publicKey = '3xG2yzqmGg2-X3KXt';

    const templateParams = {
      subject: this.asunto,
      name: this.nombre,
      email: this.email,
      message: this.mensaje
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then((response) => {
        Swal.fire({
          title: '¡Mensaje enviado!',
          text: 'Nos pondremos en contacto contigo lo antes posible.',
          icon: 'success',
          confirmButtonColor: '#00aaff',
          confirmButtonText: 'Aceptar'
        });
        this.limpiarFormulario();
      }, (err) => {
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al enviar el mensaje. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Cerrar'
        });
      });
  }

  limpiarFormulario() {
    this.nombre = '';
    this.email = '';
    this.asunto = '';
    this.mensaje = '';
  }
}
