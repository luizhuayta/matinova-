import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class ChatbotComponent {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;

  suggestions = ['¿Qué es un ERP?', 'Ver Cursos', 'Contacto', '¿Quién es Pedro Taya?'];

  messages: { text: string, type: 'user' | 'bot' }[] = [
    { text: '¡Hola! Soy el asistente de *Matt Innova Solution*. ¿En qué puedo ayudarte hoy?', type: 'bot' }
  ];

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.scrollToBottom();
  }

  formatText(text: string): string {
    if (!text) return '';
    return text.replace(/\*(.*?)\*/g, '<b>$1</b>');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }, 100);
  }
  selectSuggestion(suggestion: string) {
    this.userInput = suggestion;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMsg = this.userInput;
    this.messages.push({ text: userMsg, type: 'user' });
    this.userInput = '';
    this.isTyping = true;

    this.cdr.detectChanges();
    this.scrollToBottom();

    this.chatService.sendMessage(userMsg).subscribe({
      next: (resp) => {
        this.isTyping = false;
        this.messages.push({ text: resp.reply, type: 'bot' });
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => {
        this.isTyping = false;
        this.messages.push({ text: 'Error de conexión con el servidor.', type: 'bot' });
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });
  }
}
