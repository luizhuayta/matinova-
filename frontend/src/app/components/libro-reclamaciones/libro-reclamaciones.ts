import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { API_URL } from '../../cms/cms.models';

@Component({
  selector: 'app-libro-reclamaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CmsTextDirective, CmsImageDirective],
  templateUrl: './libro-reclamaciones.html',
  styleUrl: './libro-reclamaciones.scss',
})
export class LibroReclamacionesComponent {
  private http = inject(HttpClient);
  private cms = inject(CmsContentService);
  page = computed(() => this.cms.pages()['libro-reclamaciones'] ?? {});
  isLoading = false;

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
    guardianName: '',
  };

  constructor() {
    this.cms.useSlug('libro-reclamaciones');
  }

  enviarReclamo() {
    this.isLoading = true;
    this.http.post<{ ticket?: string }>(`${API_URL}/reclamaciones`, this.reclamo).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire({
          title: '¡Reclamación Registrada!',
          text: `Su caso ha sido enviado con el ticket ${response.ticket}. Se envió una copia a su correo.`,
          icon: 'success',
          confirmButtonColor: '#1e3a8a',
          confirmButtonText: 'Aceptar',
        });
        this.limpiarFormulario();
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo registrar la reclamación en el servidor. Intente más tarde.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Cerrar',
        });
      },
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
      guardianName: '',
    };
  }
}
