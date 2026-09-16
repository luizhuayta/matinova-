import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { API_URL } from '../../cms/cms.models';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, CmsTextDirective],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.scss']
})
export class Contacto implements OnInit {
  private http = inject(HttpClient);
  private cms = inject(CmsContentService);
  page = computed(() => this.cms.pages()['contacto'] ?? {});
  fields = computed(() => (this.page()['fields'] as Record<string, boolean>) ?? {});
  placeholders = computed(() => (this.page()['placeholders'] as Record<string, string>) ?? {});
  cards = computed(() => (this.page()['cards'] as Array<Record<string, string>>) ?? []);

  nombre = '';
  email = '';
  telefono = '';
  asunto = '';
  mensaje = '';
  isLoading = false;

  ngOnInit(): void {
    this.cms.useSlug('contacto');
  }

  show(key: string): boolean {
    return this.fields()[key] !== false;
  }

  enviar() {
    if (this.show('phone') && this.telefono && !/^[0-9]{9}$/.test(this.telefono)) {
      Swal.fire({ title: 'Error', text: 'El teléfono debe tener 9 dígitos numéricos', icon: 'error', confirmButtonText: 'Cerrar' });
      return;
    }
    this.isLoading = true;
    this.http.post(`${API_URL}/contacto`, {
      name: this.nombre,
      email: this.email,
      phone: this.telefono,
      subject: this.asunto,
      message: this.mensaje
    }).subscribe({
      next: () => {
        this.isLoading = false;
        Swal.fire({ title: '¡Mensaje enviado!', text: 'Nos pondremos en contacto contigo lo antes posible.', icon: 'success', confirmButtonText: 'Aceptar' });
        this.nombre = this.email = this.telefono = this.asunto = this.mensaje = '';
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({ title: 'Error', text: 'No se pudo enviar el mensaje. Inténtalo de nuevo.', icon: 'error', confirmButtonText: 'Cerrar' });
      }
    });
  }
}
