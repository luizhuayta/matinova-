import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsTextDirective } from '../../../cms/cms-text.directive';
import { CmsImageDirective } from '../../../cms/cms-image.directive';
import { useCmsPage } from '../../../cms/use-cms-page';

@Component({
  selector: 'app-hardware',
  imports: [CommonModule, RouterLink, CmsTextDirective, CmsImageDirective],
  templateUrl: './hardware.html',
  styleUrl: './hardware.scss',
})
export class Hardware {
  ctx = useCmsPage('servicios-hardware');
}
