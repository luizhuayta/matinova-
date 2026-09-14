import { Injectable } from '@angular/core';

export interface ChatMessage {
  text: string;
  type: 'user' | 'bot';
  timestamp?: Date;
}

export interface ChatSession {
  messages: ChatMessage[];
  startTime: Date;
  lastActivity: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatDataService {
  private currentSession: ChatSession | null = null;
  private readonly SESSION_KEY = 'chat_session';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const stored = localStorage.getItem(this.SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        const lastActivity = new Date(session.lastActivity);
        const now = new Date();
        
        // Si la sesión es reciente (menos de 24 horas), restaurarla
        if (now.getTime() - lastActivity.getTime() < this.SESSION_DURATION) {
          this.currentSession = session;
        } else {
          localStorage.removeItem(this.SESSION_KEY);
        }
      } catch (e) {
        localStorage.removeItem(this.SESSION_KEY);
      }
    }
  }

  private saveSession(): void {
    if (this.currentSession) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
    }
  }

  startSession(): void {
    this.currentSession = {
      messages: [],
      startTime: new Date(),
      lastActivity: new Date()
    };
    this.saveSession();
  }

  endSession(): void {
    this.currentSession = null;
    localStorage.removeItem(this.SESSION_KEY);
  }

  addMessage(message: ChatMessage): void {
    if (!this.currentSession) {
      this.startSession();
    }
    
    message.timestamp = new Date();
    this.currentSession!.messages.push(message);
    this.currentSession!.lastActivity = new Date();
    this.saveSession();
  }

  getMessages(): ChatMessage[] {
    return this.currentSession?.messages || [];
  }

  getSession(): ChatSession | null {
    return this.currentSession;
  }

  clearMessages(): void {
    if (this.currentSession) {
      this.currentSession.messages = [];
      this.currentSession.lastActivity = new Date();
      this.saveSession();
    }
  }

  getConversationContext(): string {
    if (!this.currentSession || this.currentSession.messages.length === 0) {
      return '';
    }

    // Retornar los últimos 10 mensajes como contexto
    const recentMessages = this.currentSession.messages.slice(-10);
    return recentMessages.map(msg => `${msg.type}: ${msg.text}`).join('\n');
  }
}
