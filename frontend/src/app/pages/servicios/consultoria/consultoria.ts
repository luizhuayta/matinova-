import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsTextDirective } from '../../../cms/cms-text.directive';
import { CmsImageDirective } from '../../../cms/cms-image.directive';
import { useCmsPage } from '../../../cms/use-cms-page';

@Component({
  selector: 'app-consultoria',
  standalone: true,
  imports: [CommonModule, RouterLink, CmsTextDirective, CmsImageDirective],
  templateUrl: './consultoria.html',
  styleUrls: ['./consultoria.scss'],
})
export class Consultoria {
  ctx = useCmsPage('servicios-consultoria');
}
