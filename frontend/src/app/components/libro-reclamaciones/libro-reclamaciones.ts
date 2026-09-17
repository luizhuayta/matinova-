import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { API_URL, JsonMap } from '../../cms/cms.models';
import { pageBlocks, propsPath } from '../../cms/block-registry';
import { AnalyticsService } from '../../services/analytics.service';

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
  private analytics = inject(AnalyticsService);
  readonly prefix = input('');
  page = computed(() => this.cms.pages()['libro-reclamaciones'] ?? {});
  props = computed(() => {
    const given = this.prefix();
    if (given) {
      const value = given.split('.').reduce<unknown>((acc, key) => (acc as JsonMap)?.[key], this.page());
      return (value && typeof value === 'object' ? value : {}) as JsonMap;
    }
    const blocks = pageBlocks(this.page());
    const found = blocks.find((item) => item.type === 'claimsBook');
    return found?.props ?? this.page();
  });
  isLoading = false;

  path(field: string): string {
    const given = this.prefix();
    if (given) {
      return `${given}.${field}`;
    }
    const blocks = pageBlocks(this.page());
    const index = blocks.findIndex((item) => item.type === 'claimsBook');
    return index >= 0 ? propsPath(index, field) : field;
  }

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
    this.http.post<{ ticket?: string; mailSent?: boolean; message?: string }>(`${API_URL}/reclamaciones`, this.reclamo).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.analytics.trackLibroReclamacionesSubmit();
        const ticket = response.ticket ? ` Ticket ${response.ticket}.` : '';
        const mail = response.mailSent
          ? ' Se envió una copia a su correo.'
          : ' El registro quedó en el panel; el correo no se pudo enviar.';
        Swal.fire({
          title: '¡Reclamación Registrada!',
          text: `Su caso ha sido guardado.${ticket}${mail}`,
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
