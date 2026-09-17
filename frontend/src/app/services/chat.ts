import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { API_URL } from '../cms/cms.models';

export type ChatbotMode = 'clasico' | 'ia';

export interface ChatLink {
  label: string;
  path: string;
}

export interface ChatReply {
  status?: string;
  reply: string;
  source?: 'classic' | 'ia';
  fallback?: boolean;
  links?: ChatLink[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatReply> {
    return this.http.post<ChatReply>(`${API_URL}/bot`, { message });
  }

  sendAi(message: string): Observable<ChatReply> {
    return this.http.post<ChatReply>(`${API_URL}/bot-ai`, { message });
  }

  sendSmart(message: string, mode: ChatbotMode = 'clasico'): Observable<ChatReply> {
    if (mode !== 'ia') {
      return this.sendMessage(message);
    }
    return this.sendAi(message).pipe(
      catchError(() => this.sendMessage(message))
    );
  }
}
