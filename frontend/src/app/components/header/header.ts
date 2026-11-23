import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsEditorService } from '../../cms/cms-editor.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { LocaleService, CMS_LOCALES } from '../../cms/locale.service';
import { CLIENT_CATEGORY_META, CLIENT_CATEGORY_ORDER } from '../../cms/client-panels';
import { KNOWN_NAV_PATHS } from '../../cms/cms-routes';
import { PublicButton } from '../public/public-button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, PublicButton],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements AfterViewInit {
  private cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  locales = inject(LocaleService);
  private router = inject(Router);
  isMobileMenuOpen = false;
  isScrolled = false;
  site = computed(() => this.cms.site());
  nav = computed(() => (this.site()['nav'] as Record<string, string>) ?? {});
  navServices = computed(() => (this.site()['navServices'] as Array<Record<string, string>>) ?? []);
  extraMenu = computed(() => {
    const known = KNOWN_NAV_PATHS;
    return this.cms.menuItems().filter((item) => item.path && !known.has(item.path) && !item.path.startsWith('/servicios/'));
  });
  showClients = computed(() => this.site()['showClientsToggle'] !== false);
  localeOptions = CMS_LOCALES;
  openMenu: 'servicios' | 'clientes' | null = null;
  readonly clientCategories = CLIENT_CATEGORY_ORDER.map((key) => ({
    key,
    label: CLIENT_CATEGORY_META[key].label,
  }));

  homeLink(): string {
    return this.locales.prefix('/');
  }
  aboutLink(): string {
    return this.locales.prefix('/acerca-de');
  }
  contactLink(): string {
    return this.locales.prefix('/contacto');
  }
  clientsLink(): string {
    return this.locales.prefix('/clientes');
  }
  menuPath(path: string): string {
    return this.locales.prefix(path);
  }
  switchLocale(next: 'es' | 'en'): void {
    const url = this.router.url.split('?')[0];
    void this.router.navigateByUrl(this.locales.switchPath(url, next));
  }

  constructor() {
    this.checkScroll();
  }

  ngAfterViewInit() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeMobileMenu();
    });
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.checkScroll();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.openMenu = null;
  }

  checkScroll() {
    this.isScrolled = typeof window !== 'undefined' && window.scrollY > 50;
  }

  toggleMobileMenu() { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.openMenu = null;
  }
  toggleMenu(menu: 'servicios' | 'clientes', event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.openMenu = this.openMenu === menu ? null : menu;
  }
  navigateTo(path: string) {
    void this.router.navigateByUrl(path);
    this.closeMobileMenu();
  }
  goClients(category: string) {
    const path = this.clientsLink();
    void this.router.navigateByUrl(`${path}${path.includes('?') ? '&' : '?'}category=${encodeURIComponent(category)}`);
    this.closeMobileMenu();
  }
}
