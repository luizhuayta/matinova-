import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acerca-de',
  imports: [RouterLink],
  templateUrl: './acerca-de.html',
  styleUrl: './acerca-de.scss',
})
export class AcercaDe {

videos = [
  {
    id: 'VIDEO_ID_1',
    titulo: 'Relacionamiento con Partner Microsoft Local y Tenant Microsoft 365'
  },
  {
    id: 'VIDEO_ID_2',
    titulo: 'Relacionamiento con Partner Microsoft Local y Tenant Microsoft 365'
  }
];

}
