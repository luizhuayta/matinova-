import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../cms.models';
import { CmsBlock, asRecord, propsPath } from '../block-registry';
import { AnalyticsService } from '../../services/analytics.service';
import { CyberCard } from '../../components/ui/cyber-card';
import { HudDivider } from '../../components/ui/hud-divider';
import { GlowButton } from '../../components/ui/glow-button';

@Component({
  selector: 'app-contact-form-block',
  standalone: true,
  imports: [CommonModule, FormsModule, CyberCard, HudDivider, GlowButton],
  templateUrl: './contact-form-block.html',
})
export class ContactFormBlock {
  private http = inject(HttpClient);
  private analytics = inject(AnalyticsService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  fields = computed(() => (this.props()['fields'] as Record<string, boolean>) ?? {});
  placeholders = computed(() => asRecord(this.props()['placeholders']));

  nombre = '';
  email = '';
  telefono = '';
  asunto = '';
  mensaje = '';
  isLoading = false;

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  show(key: string): boolean {
    return this.fields()[key] !== false;
  }

  submitLabel(): string {
    return this.isLoading ? 'Enviando...' : String(this.props()['submitLabel'] || 'Enviar mensaje');
  }

  async enviar(): Promise<void> {
    const { default: Swal } = await import('sweetalert2');
    const fields = this.props()['fields'] as Record<string, boolean> | undefined;
    const showPhone = fields?.['phone'] !== false;
    if (!this.nombre.trim() || !this.email.trim() || !this.mensaje.trim()) {
      Swal.fire({ title: 'Error', text: 'Nombre, correo y mensaje son obligatorios.', icon: 'error', confirmButtonText: 'Cerrar' });
      return;
    }
    if (showPhone && this.telefono && !/^[0-9]{9}$/.test(this.telefono)) {
      Swal.fire({ title: 'Error', text: 'El teléfono debe tener 9 dígitos numéricos', icon: 'error', confirmButtonText: 'Cerrar' });
      return;
    }
    this.isLoading = true;
    this.http.post<{ mailSent?: boolean; message?: string }>(`${API_URL}/contacto`, {
      name: this.nombre,
      email: this.email,
      phone: this.telefono,
      subject: this.asunto,
      message: this.mensaje,
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.analytics.trackContactFormSubmit({ phone: this.telefono });
        const text = res.mailSent === false
          ? 'Tu mensaje quedó registrado. El correo no se pudo enviar; el equipo lo verá en el panel.'
          : 'Nos pondremos en contacto contigo lo antes posible.';
        Swal.fire({ title: '¡Mensaje enviado!', text, icon: 'success', confirmButtonText: 'Aceptar' });
        this.nombre = this.email = this.telefono = this.asunto = this.mensaje = '';
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({ title: 'Error', text: 'No se pudo enviar el mensaje. Inténtalo de nuevo.', icon: 'error', confirmButtonText: 'Cerrar' });
      },
    });
  }
}
