import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  API_URL,
  CmsDocResponse,
  CmsMediaItem,
  CmsMessage,
  CmsPageSummary,
  CmsRevision,
  JsonMap,
} from './cms.models';

@Injectable({ providedIn: 'root' })
export class CmsApiService {
  constructor(private http: HttpClient) {}

  getSite(preview = ''): Promise<CmsDocResponse> {
    return firstValueFrom(this.http.get<CmsDocResponse>(`${API_URL}/site${preview}`));
  }

  getPages(): Promise<CmsPageSummary[]> {
    return firstValueFrom(this.http.get<{ pages: CmsPageSummary[] }>(`${API_URL}/pages`)).then(
      (res) => res.pages ?? []
    );
  }

  getPage(slug: string, preview = ''): Promise<CmsDocResponse> {
    return firstValueFrom(this.http.get<CmsDocResponse>(`${API_URL}/pages/${slug}${preview}`));
  }

  save(slug: string, content: JsonMap, version: number): Promise<CmsDocResponse> {
    const url = slug === 'sitio' ? `${API_URL}/site` : `${API_URL}/pages/${slug}`;
    return firstValueFrom(this.http.put<CmsDocResponse>(url, { content, version }));
  }

  publish(slug: string, version: number): Promise<CmsDocResponse> {
    const url = slug === 'sitio' ? `${API_URL}/site/publish` : `${API_URL}/pages/${slug}/publish`;
    return firstValueFrom(this.http.post<CmsDocResponse>(url, { version }));
  }

  listRevisions(slug: string): Promise<CmsRevision[]> {
    return firstValueFrom(this.http.get<{ items: CmsRevision[] }>(`${API_URL}/pages/${slug}/revisions`)).then(
      (res) => res.items ?? []
    );
  }

  restoreRevision(slug: string, id: number, version: number): Promise<CmsDocResponse> {
    return firstValueFrom(
      this.http.post<CmsDocResponse>(`${API_URL}/pages/${slug}/revisions/${id}/restore`, { version })
    );
  }

  createPreviewToken(slug: string): Promise<{ url: string }> {
    return firstValueFrom(this.http.post<{ url: string }>(`${API_URL}/pages/${slug}/preview-token`, {}));
  }

  uploadMedia(file: File): Promise<{ url: string; width?: number; height?: number }> {
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(this.http.post<{ url: string; width?: number; height?: number }>(`${API_URL}/media`, body));
  }

  listMedia(): Promise<CmsMediaItem[]> {
    return firstValueFrom(this.http.get<{ items: CmsMediaItem[] }>(`${API_URL}/media`)).then((res) => res.items ?? []);
  }

  deleteMedia(id: number): Promise<void> {
    return firstValueFrom(this.http.delete(`${API_URL}/media/${id}`)).then(() => undefined);
  }

  listMessages(): Promise<CmsMessage[]> {
    return firstValueFrom(this.http.get<{ items: CmsMessage[] }>(`${API_URL}/messages`)).then((res) => res.items ?? []);
  }
}
