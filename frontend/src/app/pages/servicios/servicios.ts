import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from 'express';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss',
})
export class Servicios {

}
