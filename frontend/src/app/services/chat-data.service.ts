import { Injectable } from '@angular/core';
import { ChatLink } from './chat';

export interface ChatMessage {
  text: string;
  type: 'user' | 'bot';
  links?: ChatLink[];
  timestamp?: Date;
  showFeedback?: boolean;
  feedback?: 'up' | 'down';
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
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;

  constructor() {
    this.loadSession();
  }

  private storage(): Storage | null {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage;
    } catch {
      return null;
    }
  }

  private loadSession(): void {
    const stored = this.storage()?.getItem(this.SESSION_KEY);
    if (!stored) {
      return;
    }
    try {
      const session = JSON.parse(stored) as ChatSession;
      const lastActivity = new Date(session.lastActivity);
      if (Date.now() - lastActivity.getTime() < this.SESSION_DURATION) {
        this.currentSession = {
          ...session,
          startTime: new Date(session.startTime),
          lastActivity,
          messages: (session.messages ?? []).map((msg) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
          })),
        };
      } else {
        this.storage()?.removeItem(this.SESSION_KEY);
      }
    } catch {
      this.storage()?.removeItem(this.SESSION_KEY);
    }
  }

  private saveSession(): void {
    if (this.currentSession) {
      this.storage()?.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
    }
  }

  startSession(): void {
    this.currentSession = {
      messages: [],
      startTime: new Date(),
      lastActivity: new Date(),
    };
    this.saveSession();
  }

  endSession(): void {
    this.currentSession = null;
    this.storage()?.removeItem(this.SESSION_KEY);
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
    const recentMessages = this.currentSession.messages.slice(-10);
    return recentMessages.map((msg) => `${msg.type}: ${msg.text}`).join('\n');
  }
}
