import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import {
  API_URL,
  CmsDocResponse,
  CmsMediaItem,
  CmsMediaVersion,
  CmsMenuItem,
  CmsMessage,
  CmsPageSummary,
  CmsRevision,
  JsonMap,
} from './cms.models';
import { BlockTypeDef, PageTemplateDef } from './block-registry';
import { LocaleService } from './locale.service';

export interface AiChatConfig {
  enabled: boolean;
  provider: 'openrouter' | 'deepseek' | 'custom' | string;
  model: string;
  baseUrl: string;
  keyConfigured: boolean;
}

@Injectable({ providedIn: 'root' })
export class CmsApiService {
  constructor(
    private http: HttpClient,
    @Optional() private locale?: LocaleService
  ) {}

  private locParams(): { locale: string } {
    return { locale: this.locale?.locale() || 'es' };
  }

  private requireDoc(res: CmsDocResponse): CmsDocResponse {
    if (!res || !res.content || typeof res.content !== 'object' || Array.isArray(res.content)) {
      throw new Error('La API no devolvió un documento CMS válido.');
    }
    return res;
  }

  getSite(preview = ''): Promise<CmsDocResponse> {
    return firstValueFrom(this.http.get<CmsDocResponse>(`${API_URL}/site${preview}`, { params: this.locParams() }).pipe(timeout(15000)))
      .then((res) => this.requireDoc(res));
  }

  getPagesCatalog(): Promise<{ pages: CmsPageSummary[]; menu: CmsMenuItem[] }> {
    return firstValueFrom(this.http.get<{ pages: CmsPageSummary[]; menu?: CmsMenuItem[] }>(`${API_URL}/pages`, { params: this.locParams() }).pipe(timeout(15000))).then(
      (res) => {
        if (!res || !Array.isArray(res.pages)) {
          throw new Error('La API no devolvió un catálogo CMS válido.');
        }
        return { pages: res.pages, menu: res.menu ?? [] };
      }
    );
  }

  getPages(): Promise<CmsPageSummary[]> {
    return this.getPagesCatalog().then((res) => res.pages);
  }

  listBlocks(): Promise<{ blocks: BlockTypeDef[]; templates: PageTemplateDef[] }> {
    return firstValueFrom(
      this.http.get<{ blocks: BlockTypeDef[]; templates: PageTemplateDef[] }>(`${API_URL}/blocks`)
    ).then((res) => ({ blocks: res.blocks ?? [], templates: res.templates ?? [] }));
  }

  createPage(body: {
    title: string;
    slug?: string;
    template?: string;
    showInMenu?: boolean;
    path?: string;
  }): Promise<{ page: CmsPageSummary; content: JsonMap; version: number }> {
    return firstValueFrom(
      this.http.post<{ page: CmsPageSummary; content: JsonMap; version: number }>(`${API_URL}/pages`, body, {
        params: this.locParams(),
      })
    );
  }

  deletePage(slug: string): Promise<void> {
    return firstValueFrom(this.http.delete(`${API_URL}/pages/${slug}`)).then(() => undefined);
  }

  updatePageMeta(
    slug: string,
    body: { title?: string; slug?: string; showInMenu?: boolean; menuOrder?: number; path?: string }
  ): Promise<{ page: CmsPageSummary }> {
    return firstValueFrom(this.http.patch<{ page: CmsPageSummary }>(`${API_URL}/pages/${slug}/meta`, body, { params: this.locParams() }));
  }

  getPage(slug: string, preview = ''): Promise<CmsDocResponse> {
    return firstValueFrom(this.http.get<CmsDocResponse>(`${API_URL}/pages/${slug}${preview}`, { params: this.locParams() }).pipe(timeout(15000)))
      .then((res) => this.requireDoc(res));
  }

  save(slug: string, content: JsonMap, version: number): Promise<CmsDocResponse> {
    const url = slug === 'sitio' ? `${API_URL}/site` : `${API_URL}/pages/${slug}`;
    return firstValueFrom(this.http.put<CmsDocResponse>(url, { content, version }, { params: this.locParams() }));
  }

  publish(slug: string, version: number): Promise<CmsDocResponse> {
    const url = slug === 'sitio' ? `${API_URL}/site/publish` : `${API_URL}/pages/${slug}/publish`;
    return firstValueFrom(this.http.post<CmsDocResponse>(url, { version }, { params: this.locParams() }));
  }

  listRevisions(slug: string): Promise<CmsRevision[]> {
    return firstValueFrom(this.http.get<{ items: CmsRevision[] }>(`${API_URL}/pages/${slug}/revisions`)).then(
      (res) => res.items ?? []
    );
  }

  restoreRevision(slug: string, id: number, version: number): Promise<CmsDocResponse> {
    return firstValueFrom(
      this.http.post<CmsDocResponse>(`${API_URL}/pages/${slug}/revisions/${id}/restore`, { version }, { params: this.locParams() })
    );
  }

  createPreviewToken(slug: string): Promise<{ url: string }> {
    return firstValueFrom(this.http.post<{ url: string }>(`${API_URL}/pages/${slug}/preview-token`, {}, { params: this.locParams() }));
  }

  translatePage(slug: string, locale: string): Promise<{ ok: boolean; locale: string }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean; locale: string }>(`${API_URL}/pages/${slug}/translate`, { locale }, { params: this.locParams() })
    );
  }

  cropMedia(body: { url: string; x: number; y: number; w: number; h: number }): Promise<{
    url: string;
    width?: number;
    height?: number;
    id?: number;
    previous_url?: string;
    parent_id?: number | null;
    original_url?: string | null;
  }> {
    return firstValueFrom(
      this.http.post<{
        url: string;
        width?: number;
        height?: number;
        id?: number;
        previous_url?: string;
        parent_id?: number | null;
        original_url?: string | null;
      }>(`${API_URL}/media/crop`, body)
    );
  }

  listUsers(): Promise<Array<{ id: number; username: string; role: string; active: boolean }>> {
    return firstValueFrom(this.http.get<{ items: Array<{ id: number; username: string; role: string; active: boolean }> }>(`${API_URL}/auth/users`)).then(
      (res) => res.items ?? []
    );
  }

  createUser(body: { username: string; password: string; role: string }): Promise<{ item: { id: number; username: string; role: string; active: boolean } }> {
    return firstValueFrom(this.http.post<{ item: { id: number; username: string; role: string; active: boolean } }>(`${API_URL}/auth/users`, body));
  }

  patchUser(id: number, body: { role?: string; active?: boolean; password?: string }): Promise<{ item: { id: number; username: string; role: string; active: boolean } }> {
    return firstValueFrom(this.http.patch<{ item: { id: number; username: string; role: string; active: boolean } }>(`${API_URL}/auth/users/${id}`, body));
  }

  listRedirects(): Promise<Array<{ id: number; from_path: string; to_path: string; status: number }>> {
    return firstValueFrom(this.http.get<{ items: Array<{ id: number; from_path: string; to_path: string; status: number }> }>(`${API_URL}/redirects`)).then(
      (res) => res.items ?? []
    );
  }

  private readonly redirectCache = new Map<string, Promise<{ to: string; status: number } | null>>();

  lookupRedirect(path: string): Promise<{ to: string; status: number } | null> {
    const key = String(path ?? '');
    let pending = this.redirectCache.get(key);
    if (!pending) {
      pending = firstValueFrom(this.http.get<{ redirect: { to: string; status: number } | null }>(`${API_URL}/redirects/lookup`, { params: { path: key } })).then(
        (res) => res.redirect
      );
      pending.catch(() => this.redirectCache.delete(key));
      this.redirectCache.set(key, pending);
    }
    return pending;
  }

  listWebhooks(): Promise<Array<{ id: number; url: string; events: string; active: boolean }>> {
    return firstValueFrom(this.http.get<{ items: Array<{ id: number; url: string; events: string; active: boolean }> }>(`${API_URL}/webhooks`)).then(
      (res) => res.items ?? []
    );
  }

  createWebhook(body: { url: string; secret?: string; events?: string }): Promise<{ id: number; secret: string }> {
    return firstValueFrom(this.http.post<{ id: number; secret: string }>(`${API_URL}/webhooks`, body));
  }

  patchWebhook(id: number, body: { url?: string; events?: string; active?: boolean; secret?: string }): Promise<void> {
    return firstValueFrom(this.http.patch(`${API_URL}/webhooks/${id}`, body)).then(() => undefined);
  }

  testWebhook(id: number): Promise<{ ok: boolean; error?: string }> {
    return firstValueFrom(this.http.post<{ ok: boolean; error?: string }>(`${API_URL}/webhooks/${id}/test`, {}));
  }

  listWebhookDeliveries(id: number): Promise<Array<{ id: number; event: string; status: string; last_error: string; created_at: string }>> {
    return firstValueFrom(
      this.http.get<{ items: Array<{ id: number; event: string; status: string; last_error: string; created_at: string }> }>(
        `${API_URL}/webhooks/${id}/deliveries`
      )
    ).then((res) => res.items ?? []);
  }

  deleteWebhook(id: number): Promise<void> {
    return firstValueFrom(this.http.delete(`${API_URL}/webhooks/${id}`)).then(() => undefined);
  }

  deleteRedirect(id: number): Promise<void> {
    return firstValueFrom(this.http.delete(`${API_URL}/redirects/${id}`)).then(() => undefined);
  }

  uploadMedia(file: File): Promise<{ url: string; width?: number; height?: number; variants?: CmsMediaItem['variants'] }> {
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(
      this.http.post<{ url: string; width?: number; height?: number; variants?: CmsMediaItem['variants'] }>(`${API_URL}/media`, body)
    );
  }

  resolveMedia(url: string): Promise<{
    url: string;
    width?: number | null;
    height?: number | null;
    variants?: CmsMediaItem['variants'];
  }> {
    return firstValueFrom(
      this.http.get<{
        url: string;
        width?: number | null;
        height?: number | null;
        variants?: CmsMediaItem['variants'];
      }>(`${API_URL}/media/resolve`, { params: { url } })
    );
  }

  listMedia(): Promise<CmsMediaItem[]> {
    return firstValueFrom(this.http.get<{ items: CmsMediaItem[] }>(`${API_URL}/media`)).then((res) => res.items ?? []);
  }

  listMediaVersions(id: number): Promise<CmsMediaVersion[]> {
    return firstValueFrom(this.http.get<{ items: CmsMediaVersion[] }>(`${API_URL}/media/${id}/versions`)).then((res) => res.items ?? []);
  }

  restoreMedia(id: number, body: { use?: string; versionId?: number }): Promise<{ url: string; id?: number; kind?: string }> {
    return firstValueFrom(this.http.post<{ url: string; id?: number; kind?: string }>(`${API_URL}/media/${id}/restore`, body));
  }

  deleteMedia(id: number): Promise<void> {
    return firstValueFrom(this.http.delete(`${API_URL}/media/${id}`)).then(() => undefined);
  }

  listMessages(params?: { kind?: string; q?: string; status?: string; page?: number; limit?: number }): Promise<{
    items: CmsMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query: Record<string, string | number> = {};
    if (params?.kind) query['kind'] = params.kind;
    if (params?.q) query['q'] = params.q;
    if (params?.status) query['status'] = params.status;
    if (params?.page) query['page'] = params.page;
    if (params?.limit) query['limit'] = params.limit;
    return firstValueFrom(
      this.http.get<{ items: CmsMessage[]; total?: number; page?: number; limit?: number }>(`${API_URL}/messages`, {
        params: query,
      })
    ).then((res) => ({
      items: res.items ?? [],
      total: res.total ?? (res.items ?? []).length,
      page: res.page ?? 1,
      limit: res.limit ?? 50,
    }));
  }

  patchMessage(id: number, body: { status: string }): Promise<CmsMessage> {
    return firstValueFrom(this.http.patch<{ item: CmsMessage }>(`${API_URL}/messages/${id}`, body)).then((res) => res.item);
  }

  getAiConfig(): Promise<AiChatConfig> {
    return firstValueFrom(this.http.get<AiChatConfig>(`${API_URL}/admin/ai-config`));
  }

  saveAiConfig(body: Partial<AiChatConfig> & { apiKey?: string }): Promise<AiChatConfig> {
    return firstValueFrom(this.http.put<AiChatConfig>(`${API_URL}/admin/ai-config`, body));
  }

  testAiConfig(): Promise<{ ok: boolean; message: string }> {
    return firstValueFrom(this.http.post<{ ok: boolean; message: string }>(`${API_URL}/admin/ai-config/test`, {}));
  }
}
