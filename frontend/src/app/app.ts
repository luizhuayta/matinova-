import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { WhatsappBubble } from "./components/whatsapp-bubble/whatsapp-bubble";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    FormsModule,
    Header,
    Footer,
    ChatbotComponent,
    WhatsappBubble
],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
