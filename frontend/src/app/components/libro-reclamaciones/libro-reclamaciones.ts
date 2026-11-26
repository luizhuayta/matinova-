import { Component, ElementRef, ViewChild, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { API_URL, JsonMap } from '../../cms/cms.models';
import { pageBlocks, propsPath } from '../../cms/block-registry';
import { LocaleService } from '../../cms/locale.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PageHeader } from '../ui/page-header';
import { CyberCard } from '../ui/cyber-card';
import { HudDivider } from '../ui/hud-divider';
import { GlowButton } from '../ui/glow-button';

@Component({
  selector: 'app-libro-reclamaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CmsTextDirective, CmsImageDirective, PageHeader, CyberCard, HudDivider, GlowButton],
  templateUrl: './libro-reclamaciones.html',
  styleUrl: './libro-reclamaciones.scss',
})
export class LibroReclamacionesComponent {
  private http = inject(HttpClient);
  private cms = inject(CmsContentService);
  private analytics = inject(AnalyticsService);
  private locales = inject(LocaleService);
  readonly prefix = input('');
  isEn = computed(() => this.locales.locale() === 'en');
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
  submitAttempted = false;

  submitLabel(): string {
    if (this.isLoading) {
      return this.isEn() ? 'Sending...' : 'Enviando...';
    }
    return String(this.props()['submitLabel'] || (this.isEn() ? 'Send virtual claim' : 'Enviar Reclamación Virtual'));
  }
  @ViewChild('reclamacionesForm') private libroForm?: NgForm;
  @ViewChild('errorSummary') private errorSummary?: ElementRef<HTMLElement>;

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

  async enviarReclamo() {
    this.submitAttempted = true;
    if (this.libroForm && this.libroForm.invalid) {
      queueMicrotask(() => this.errorSummary?.nativeElement.focus());
      return;
    }
    this.isLoading = true;
    const en = this.isEn();
    const { default: Swal } = await import('sweetalert2');
    this.http.post<{ ticket?: string; mailSent?: boolean; message?: string }>(`${API_URL}/reclamaciones`, this.reclamo).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.analytics.trackLibroReclamacionesSubmit();
        const ticket = response.ticket ? ` Ticket ${response.ticket}.` : '';
        const mail = response.mailSent
          ? (en ? ' A copy was sent to your email.' : ' Se envió una copia a su correo.')
          : (en
              ? ' The record was saved in the panel; the email could not be sent.'
              : ' El registro quedó en el panel; el correo no se pudo enviar.');
        Swal.fire({
          title: en ? 'Claim registered!' : '¡Reclamación Registrada!',
          text: `${en ? 'Your case has been saved.' : 'Su caso ha sido guardado.'}${ticket}${mail}`,
          icon: 'success',
          confirmButtonColor: '#0066ff',
          confirmButtonText: en ? 'OK' : 'Aceptar',
        });
        this.limpiarFormulario();
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: en
            ? 'Could not register the claim on the server. Please try again later.'
            : 'No se pudo registrar la reclamación en el servidor. Intente más tarde.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: en ? 'Close' : 'Cerrar',
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
