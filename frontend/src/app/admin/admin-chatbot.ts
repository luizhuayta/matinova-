import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmsApiService, AiChatConfig } from '../cms/cms-api.service';
import { CmsContentService } from '../cms/cms-content.service';

@Component({
  selector: 'app-admin-chatbot',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="wrap">
      <header class="page-head">
        <div class="grow">
          <h1>Chatbot</h1>
          <p class="admin-lead">El modo clásico responde con textos y enlaces predefinidos. La IA es opcional: si falla o no hay clave, se usa el clásico.</p>
        </div>
        <div class="head-actions">
          @if (!loading() && !error()) {
            <span class="pill" [class.ok]="mode === 'ia' && keyConfigured()" [class.warn]="mode === 'ia' && !keyConfigured()" [class.neutral]="mode !== 'ia'">
              {{ mode === 'ia' ? (keyConfigured() ? 'IA activa' : 'IA sin clave') : 'Modo clásico' }}
            </span>
          }
        </div>
      </header>

      @if (loading()) {
        <div class="admin-group" aria-busy="true">
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
        </div>
      } @else if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      } @else {
        <form (ngSubmit)="save()">
          <div class="admin-card">
            <h2>Modo de respuesta</h2>
            <p class="card-sub">Elige cómo responde el asistente en la web.</p>
            <div class="admin-seg" role="group" aria-label="Modo del chatbot">
              <button type="button" [attr.aria-pressed]="mode === 'clasico'" [class.active]="mode === 'clasico'" (click)="mode = 'clasico'">Clásico</button>
              <button type="button" [attr.aria-pressed]="mode === 'ia'" [class.active]="mode === 'ia'" (click)="mode = 'ia'">Híbrido: IA con fallback clásico</button>
            </div>
            <p class="hint mode-hint">
              {{ mode === 'ia'
                ? 'Responde con IA y cae al clásico si algo falla.'
                : 'Respuestas predefinidas y redirecciones. Rápido y sin costo.' }}
            </p>
          </div>

          <div class="admin-card">
            <h2>Proveedor de IA</h2>
            <p class="card-sub">
              Clave: <strong>{{ keyConfigured() ? 'configurada' : 'no configurada' }}</strong>
              · No se muestra nunca después de guardarla.
            </p>
            <div class="form-grid">
              <div class="admin-field">
                <label for="ai-provider">Proveedor</label>
                <select id="ai-provider" name="provider" [(ngModel)]="provider" (ngModelChange)="onProvider()">
                  <option value="openrouter">OpenRouter</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div class="admin-field">
                <label for="ai-model">Modelo</label>
                <input id="ai-model" name="model" type="text" [(ngModel)]="model" autocomplete="off" placeholder="openai/gpt-4o-mini">
              </div>
              <div class="admin-field span">
                <label for="ai-base">URL base</label>
                <input id="ai-base" name="baseUrl" type="url" [(ngModel)]="baseUrl" [readOnly]="provider !== 'custom'" autocomplete="off">
              </div>
              <div class="admin-field span">
                <label for="ai-key">Clave API</label>
                <input id="ai-key" name="apiKey" type="password" [(ngModel)]="apiKey" autocomplete="new-password" placeholder="Dejar vacío para no cambiarla">
              </div>
            </div>

            @if (ok()) {
              <p class="admin-banner ok" role="status">{{ ok() }}</p>
            }
            @if (saveError()) {
              <p class="admin-banner error" role="alert">{{ saveError() }}</p>
            }

            <div class="actions">
              <button class="admin-btn" type="submit" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar' }}</button>
              <button class="admin-btn ghost" type="button" [disabled]="testing() || saving()" (click)="test()">{{ testing() ? 'Probando…' : 'Probar conexión' }}</button>
            </div>
          </div>
        </form>
      }
    </section>
  `,
  styleUrl: './styles/chatbot.scss',
})
export class AdminChatbot implements OnInit {
  private api = inject(CmsApiService);
  private cms = inject(CmsContentService);
  loading = signal(true);
  error = signal('');
  saveError = signal('');
  ok = signal('');
  saving = signal(false);
  testing = signal(false);
  keyConfigured = signal(false);
  mode: 'clasico' | 'ia' = 'clasico';
  provider: AiChatConfig['provider'] = 'openrouter';
  model = '';
  baseUrl = '';
  apiKey = '';

  async ngOnInit(): Promise<void> {
    try {
      const cfg = await this.api.getAiConfig();
      this.apply(cfg);
    } catch {
      this.error.set('No se pudo cargar la configuración. Solo un administrador puede ver esta sección.');
    } finally {
      this.loading.set(false);
    }
  }

  onProvider(): void {
    if (this.provider === 'openrouter') {
      this.baseUrl = 'https://openrouter.ai/api/v1';
      if (!this.model) this.model = 'openai/gpt-4o-mini';
    } else if (this.provider === 'deepseek') {
      this.baseUrl = 'https://api.deepseek.com/v1';
      if (!this.model || this.model.startsWith('openai/')) this.model = 'deepseek-chat';
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.saveError.set('');
    this.ok.set('');
    try {
      const body: Partial<AiChatConfig> & { apiKey?: string } = {
        enabled: this.mode === 'ia',
        provider: this.provider,
        model: this.model,
        baseUrl: this.baseUrl,
      };
      if (this.apiKey.trim()) {
        body.apiKey = this.apiKey.trim();
      }
      const saved = await this.api.saveAiConfig(body);
      this.apply(saved);
      this.apiKey = '';
      await this.cms.reloadSlug('sitio').catch(() => undefined);
      this.ok.set('Configuración guardada. La clave no se vuelve a mostrar.');
    } catch {
      this.saveError.set('No se pudo guardar. Revisa permisos y la clave.');
    } finally {
      this.saving.set(false);
    }
  }

  async test(): Promise<void> {
    this.testing.set(true);
    this.saveError.set('');
    this.ok.set('');
    try {
      const res = await this.api.testAiConfig();
      if (res.ok) {
        this.ok.set(res.message);
      } else {
        this.saveError.set(res.message);
      }
    } catch (err) {
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.saveError.set(message || 'No se pudo probar la conexión.');
    } finally {
      this.testing.set(false);
    }
  }

  private apply(cfg: AiChatConfig): void {
    this.mode = cfg.enabled ? 'ia' : 'clasico';
    this.provider = cfg.provider || 'openrouter';
    this.model = cfg.model || '';
    this.baseUrl = cfg.baseUrl || '';
    this.keyConfigured.set(!!cfg.keyConfigured);
  }
}
