import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsTextDirective } from '../../../cms/cms-text.directive';
import { CmsImageDirective } from '../../../cms/cms-image.directive';
import { useCmsPage } from '../../../cms/use-cms-page';

@Component({
  selector: 'app-soluciones-ti',
  standalone: true,
  imports: [CommonModule, RouterLink, CmsTextDirective, CmsImageDirective],
  templateUrl: './soluciones-ti.html',
  styleUrls: ['./soluciones-ti.scss'],
})
export class SolucionesTi {
  ctx = useCmsPage('servicios-soluciones-ti');
}
