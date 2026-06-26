import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-libro-reclamaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './libro-reclamaciones.html',
  styleUrl: './libro-reclamaciones.scss',
})
export class LibroReclamacionesComponent {
  private http = inject(HttpClient);

  reclamo = {
    fullname: '',
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    email: '',
    address: '',
    typeOfBien: 'servicio',
    claimedAmount: null as number | null,
    amountNotApplicable: true,
    descriptionBien: '',
    typeOfAccion: 'reclamo',
    details: '',
    consumerPedido: '',
    isMinor: false,
    guardianName: ''
  };

  enviarReclamo() {
    const urlBackend = 'https://mattinnovasolution.com/libro-reclamaciones';

    this.http.post(urlBackend, this.reclamo).subscribe({
      next: (response: any) => {
        Swal.fire({
          title: '¡Reclamación Registrada!',
          text: `Su caso ha sido enviado con el ticket ${response.ticket}. Se envió una copia a su correo.`,
          icon: 'success',
          confirmButtonColor: '#0c2340',
          confirmButtonText: 'Aceptar'
        });

        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('Error al enviar reclamación:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo registrar la reclamación en el servidor. Intente más tarde.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }

  private limpiarFormulario() {
    this.reclamo = {
      fullname: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: '',
      address: '',
      typeOfBien: 'servicio',
      claimedAmount: null,
      amountNotApplicable: true,
      descriptionBien: '',
      typeOfAccion: 'reclamo',
      details: '',
      consumerPedido: '',
      isMinor: false,
      guardianName: ''
    };
  }
}
