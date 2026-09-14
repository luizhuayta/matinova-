import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { ChatService } from '../../services/chat';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class ChatbotComponent implements AfterViewInit {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  hasInteracted = false;

  suggestions = ['¿Qué servicios ofrecen?', 'Desarrollo Web', 'Consultoría TI', 'Contacto', 'Precios'];

  messages: { text: string, type: 'user' | 'bot', links?: { label: string; path: string }[] }[] = [
    { 
      text: '¡Hola! 👋 Soy el asistente inteligente de *Matt Innova Solution*. Estoy especializado en soluciones tecnológicas. ¿En qué puedo ayudarte hoy?', 
      type: 'bot',
      links: [
        { label: 'Servicios', path: '/servicios' },
        { label: 'Contacto', path: '/contacto' },
        { label: 'Acerca de', path: '/acerca-de' }
      ]
    }
  ];

  // Base de conocimiento local para respuestas inteligentes
  private knowledgeBase = {
    'servicios': 'Ofrecemos servicios de desarrollo web, software a medida, consultoría TI, soluciones en la nube, hardware y capacitaciones tecnológicas.',
    'web': 'Desarrollamos sitios web modernos, aplicaciones web progresivas (PWA), e-commerce y plataformas personalizadas.',
    'software': 'Creamos software a medida, sistemas de gestión (ERP, CRM), aplicaciones móviles y soluciones de automatización.',
    'consultoria': 'Brindamos consultoría en arquitectura de sistemas, optimización de procesos, ciberseguridad y transformación digital.',
    'precios': 'Nuestros precios varían según el proyecto. Puedes solicitarnos un presupuesto personalizado a través de nuestro formulario de contacto.',
    'contacto': 'Puedes contactarnos por WhatsApp al (+51) 992 422 219, email a contacto@mattinnovasolution.com, o visitarnos en Urb. Libertad - Calle Las Moras.',
    'tiempo': 'El tiempo de desarrollo depende de la complejidad del proyecto. Generalmente los proyectos web toman 2-8 semanas.',
    'tecnologias': 'Trabajamos con Angular, React, Node.js, Python, PHP, bases de datos SQL y NoSQL, y tecnologías cloud como AWS y Azure.',
    'soporte': 'Ofrecemos soporte técnico continuo, mantenimiento preventivo y actualizaciones de seguridad.',
    'matt': 'Matt Innova Solution es una empresa especializada en soluciones tecnológicas que transforman negocios mediante innovación digital.',
    'default': 'Entiendo tu consulta. Para darte una respuesta más precisa, ¿podrías ser más específico sobre qué aspecto de nuestros servicios te interesa?'
  };

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngAfterViewInit() {
    // Escuchar cambios de ruta para scroll suave
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.hasInteracted = true;
      this.scrollToBottom();
    }
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

  // Sistema de respuestas inteligentes locales
  private getLocalResponse(userMessage: string): { text: string, links?: { label: string; path: string }[] } | null {
    const message = userMessage.toLowerCase();
    
    // Respuestas inteligentes basadas en palabras clave
    if (message.includes('servicio') || message.includes('ofrecen') || message.includes('hacen')) {
      return {
        text: this.knowledgeBase['servicios'],
        links: [
          { label: 'Ver todos los servicios', path: '/servicios' },
          { label: 'Desarrollo Web', path: '/servicios/software' },
          { label: 'Consultoría', path: '/servicios/consultoria' }
        ]
      };
    }
    
    if (message.includes('web') || message.includes('página') || message.includes('sitio')) {
      return {
        text: this.knowledgeBase['web'],
        links: [
          { label: 'Ver servicios web', path: '/servicios/software' },
          { label: 'Contacto para presupuesto', path: '/contacto' }
        ]
      };
    }
    
    if (message.includes('software') || message.includes('aplicación') || message.includes('sistema')) {
      return {
        text: this.knowledgeBase['software'],
        links: [
          { label: 'Servicios de software', path: '/servicios/software' },
          { label: 'SaaS', path: '/servicios/saas' }
        ]
      };
    }
    
    if (message.includes('consultoria') || message.includes('asesor') || message.includes('asesoría')) {
      return {
        text: this.knowledgeBase['consultoria'],
        links: [
          { label: 'Consultoría TI', path: '/servicios/consultoria' },
          { label: 'Soluciones TI', path: '/servicios/soluciones-ti' }
        ]
      };
    }
    
    if (message.includes('precio') || message.includes('costo') || message.includes('cuánto') || message.includes('presupuesto')) {
      return {
        text: this.knowledgeBase['precios'],
        links: [
          { label: 'Solicitar presupuesto', path: '/contacto' }
        ]
      };
    }
    
    if (message.includes('contacto') || message.includes('ubicación') || message.includes('dirección') || message.includes('donde')) {
      return {
        text: this.knowledgeBase['contacto'],
        links: [
          { label: 'Ir a contacto', path: '/contacto' }
        ]
      };
    }
    
    if (message.includes('tiempo') || message.includes('demora') || message.includes('cuánto tarda') || message.includes('cuándo')) {
      return {
        text: this.knowledgeBase['tiempo']
      };
    }
    
    if (message.includes('tecnología') || message.includes('tecnologías') || message.includes('lenguaje') || message.includes('framework')) {
      return {
        text: this.knowledgeBase['tecnologias']
      };
    }
    
    if (message.includes('soporte') || message.includes('mantenimiento') || message.includes('ayuda')) {
      return {
        text: this.knowledgeBase['soporte']
      };
    }
    
    if (message.includes('matt') || message.includes('empresa') || message.includes('quienes') || message.includes('quiénes')) {
      return {
        text: this.knowledgeBase['matt'],
        links: [
          { label: 'Acerca de nosotros', path: '/acerca-de' }
        ]
      };
    }
    
    return null; // No hay respuesta local, usar API
  }

  selectSuggestion(suggestion: string) {
    this.userInput = suggestion;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    this.hasInteracted = true;

    const userMsg = this.userInput;
    this.messages.push({ text: userMsg, type: 'user' });
    this.userInput = '';
    this.isTyping = true;

    this.cdr.detectChanges();
    this.scrollToBottom();

    // Primero intentar respuesta local inteligente
    const localResponse = this.getLocalResponse(userMsg);
    
    if (localResponse) {
      // Simular tiempo de respuesta para naturalidad
      setTimeout(() => {
        this.isTyping = false;
        this.messages.push({ 
          text: localResponse.text, 
          type: 'bot',
          links: localResponse.links
        });
        this.cdr.detectChanges();
        this.scrollToBottom();
      }, 800 + Math.random() * 500); // 0.8-1.3 segundos de "pensamiento"
    } else {
      // Si no hay respuesta local, usar API
      this.chatService.sendMessage(userMsg).subscribe({
        next: (resp) => {
          this.isTyping = false;
          this.messages.push({ text: resp.reply, type: 'bot' });
          this.cdr.detectChanges();
          this.scrollToBottom();
        },
        error: (err) => {
          this.isTyping = false;
          // Fallback a respuesta genérica si falla la API
          this.messages.push({ 
            text: this.knowledgeBase['default'],
            type: 'bot',
            links: [
              { label: 'Servicios', path: '/servicios' },
              { label: 'Contacto', path: '/contacto' }
            ]
          });
          this.cdr.detectChanges();
          this.scrollToBottom();
        }
      });
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.isOpen = false;
  }
}
