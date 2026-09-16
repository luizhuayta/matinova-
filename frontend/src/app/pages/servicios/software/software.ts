import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsTextDirective } from '../../../cms/cms-text.directive';
import { CmsImageDirective } from '../../../cms/cms-image.directive';
import { useCmsPage } from '../../../cms/use-cms-page';

@Component({
  selector: 'app-software',
  imports: [CommonModule, RouterLink, CmsTextDirective, CmsImageDirective],
  templateUrl: './software.html',
  styleUrls: ['./software.scss'],
  encapsulation: ViewEncapsulation.None
})
export class Software {
  ctx = useCmsPage('servicios-software');
}
