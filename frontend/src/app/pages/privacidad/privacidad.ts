import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacidad.html',
  styleUrl: './privacidad.scss'
})
export class Privacidad {
  lastUpdated = 'Septiembre 2026';
}
