import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsEditorService } from '../../cms/cms-editor.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  private cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  private router = inject(Router);
  isMobileMenuOpen = false;
  logoClass = '';
  site = computed(() => this.cms.site());
  nav = computed(() => (this.site()['nav'] as Record<string, string>) ?? {});
  navServices = computed(() => (this.site()['navServices'] as Array<Record<string, string>>) ?? []);
  showClients = computed(() => this.site()['showClientsToggle'] !== false);

  toggleMobileMenu() { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  closeMobileMenu() { this.isMobileMenuOpen = false; }
  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeMobileMenu();
  }
  toggleTransparency() {
    document.body.classList.toggle('transparency-mode');
  }
}
