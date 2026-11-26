import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsEditorService } from '../../cms/cms-editor.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { LocaleService, CMS_LOCALES } from '../../cms/locale.service';
import { CLIENT_CATEGORY_ORDER, clientCategoryLabel } from '../../cms/client-panels';
import { KNOWN_NAV_PATHS } from '../../cms/cms-routes';
import { PublicButton } from '../public/public-button';
import { HeaderMegaMenu } from './mega-menu';
import {
  MegaMenuItem,
  buildClientMegaItem,
  buildDynamicChildMegaItem,
  buildExtraNavEntries,
  buildServiceMegaItem,
} from './mega-menu.model';

const HOVER_OPEN_DELAY_MS = 110;
const HOVER_CLOSE_DELAY_MS = 180;
const SCROLL_CLOSE_THRESHOLD_PX = 12;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, PublicButton, HeaderMegaMenu],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements AfterViewInit, OnDestroy {
  private cms = inject(CmsContentService);
  private destroyRef = inject(DestroyRef);
  private hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  private doc = inject(DOCUMENT);
  editor = inject(CmsEditorService);
  locales = inject(LocaleService);
  private router = inject(Router);

  isMobileMenuOpen = false;
  isScrolled = false;
  readonly openMenu = signal<string | null>(null);
  readonly currentPath = signal<string>(this.locales.parseUrl(this.router.url).path);

  private openTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private openScrollY = 0;
  private openedByHoverAt = 0;
  private hasInitialNav = false;

  site = computed(() => this.cms.site());
  nav = computed(() => (this.site()['nav'] as Record<string, string>) ?? {});
  navServices = computed(() => (this.site()['navServices'] as Array<Record<string, string>>) ?? []);
  extraMenuRaw = computed(() => {
    const known = KNOWN_NAV_PATHS;
    return this.cms.menuItems().filter((item) => item.path && !known.has(item.path) && !item.path.startsWith('/servicios/'));
  });
  extraEntries = computed(() => buildExtraNavEntries(this.extraMenuRaw()));
  showClients = computed(() => this.site()['showClientsToggle'] !== false);
  isEnglish = computed(() => this.locales.locale() === 'en');

  servicesSectionLabel = computed(() => (this.isEnglish() ? 'IT SERVICES' : 'SERVICIOS TI'));
  allServicesLabel = computed(() => (this.isEnglish() ? 'View all services' : 'Ver todos los servicios'));
  clientsSectionLabel = computed(() => (this.isEnglish() ? 'PROJECTS & CLIENTS' : 'PROYECTOS Y CLIENTES'));
  allClientsLabel = computed(() => (this.isEnglish() ? 'View all clients' : 'Ver todos los clientes'));

  serviceMegaItems = computed<MegaMenuItem[]>(() => {
    const locale = this.locales.locale();
    return this.navServices().map((item, index) =>
      buildServiceMegaItem(item, index, this.locales.prefix(item['path'] || '/servicios', locale), locale)
    );
  });

  clientMegaItems = computed<MegaMenuItem[]>(() => {
    const locale = this.locales.locale();
    const base = this.locales.prefix('/clientes', locale);
    return CLIENT_CATEGORY_ORDER.map((key) =>
      buildClientMegaItem(key, clientCategoryLabel(key, locale), base, locale)
    );
  });

  isServicesActive = computed(() => {
    const path = this.currentPath();
    return path === '/servicios' || path.startsWith('/servicios/');
  });

  isClientsActive = computed(() => {
    const path = this.currentPath();
    return path === '/clientes' || path.startsWith('/clientes/');
  });

  localeOptions = CMS_LOCALES;

  homeLink(): string {
    return this.locales.prefix('/');
  }
  aboutLink(): string {
    return this.locales.prefix('/acerca-de');
  }
  servicesLink(): string {
    return this.locales.prefix('/servicios');
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

  dynamicGroupItems(children?: Array<{ slug: string; title: string; path: string }>): MegaMenuItem[] {
    if (!children?.length) {
      return [];
    }
    const locale = this.locales.locale();
    return children.map((child) =>
      buildDynamicChildMegaItem(child, this.locales.prefix(child.path, locale), locale)
    );
  }

  isDynamicGroupActive(basePath: string): boolean {
    const clean = (basePath || '').split(/[?#]/)[0].replace(/\/+$/, '');
    const current = this.currentPath();
    return !!clean && (current === clean || current.startsWith(`${clean}/`));
  }

  switchLocale(next: 'es' | 'en'): void {
    this.locales.savePreference(next);
    const target = this.locales.switchPath(this.router.url, next);
    this.closeMobileMenu();
    if (target === this.router.url && this.locales.locale() === next) {
      return;
    }
    void this.router.navigateByUrl(target);
  }

  constructor() {
    this.checkScroll();
  }

  ngOnDestroy(): void {
    this.clearHoverTimers();
    this.syncBodyNavClass(false);
  }

  ngAfterViewInit() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      this.currentPath.set(this.locales.parseUrl(event.urlAfterRedirects).path);
      if (this.hasInitialNav) {
        this.closeMobileMenu();
      } else {
        this.hasInitialNav = true;
      }
    });
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.checkScroll();
    if (
      this.openMenu()
      && !this.isMobileViewport()
      && typeof window !== 'undefined'
      && Math.abs(window.scrollY - this.openScrollY) > SCROLL_CLOSE_THRESHOLD_PX
    ) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    const active = this.openMenu();
    if (active) {
      this.closeDropdown();
      this.focusTrigger(active);
      return;
    }
    if (this.isMobileMenuOpen) {
      this.setMobileMenuOpen(false);
      const toggle = this.hostEl.nativeElement.querySelector<HTMLButtonElement>('.mobile-menu-toggle');
      toggle?.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target || this.hostEl.nativeElement.contains(target)) {
      return;
    }
    if (this.openMenu() || this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  @HostListener('focusout', ['$event'])
  onHostFocusOut(event: FocusEvent) {
    if (this.isMobileViewport() || !this.openMenu()) {
      return;
    }
    const next = event.relatedTarget as Node | null;
    if (next && !this.hostEl.nativeElement.contains(next)) {
      this.closeDropdown();
    }
  }

  checkScroll() {
    this.isScrolled = typeof window !== 'undefined' && window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.setMobileMenuOpen(!this.isMobileMenuOpen);
  }

  closeMobileMenu() {
    this.setMobileMenuOpen(false);
  }

  private setMobileMenuOpen(open: boolean): void {
    this.isMobileMenuOpen = open;
    this.syncBodyNavClass(open);
    if (!open) {
      this.closeDropdown();
    }
  }

  private syncBodyNavClass(open: boolean): void {
    if (typeof document !== 'undefined' && this.doc?.body) {
      this.doc.body.classList.toggle('mobile-nav-open', open);
    }
  }

  closeDropdown() {
    this.clearHoverTimers();
    this.openMenu.set(null);
  }

  toggleMenu(menu: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.clearHoverTimers();
    if (this.openMenu() === menu) {
      // Si hover acaba de abrir este panel justo antes del clic, mantenerlo abierto
      if (this.openedByHoverAt && Date.now() - this.openedByHoverAt < 400) {
        this.openedByHoverAt = 0;
        return;
      }
      this.openMenu.set(null);
    } else {
      this.openedByHoverAt = 0;
      this.setMenuOpen(menu);
    }
  }

  onTriggerKeydown(menu: string, panelId: string, event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.clearHoverTimers();
      this.openedByHoverAt = 0;
      this.setMenuOpen(menu);
      setTimeout(() => {
        const panel = this.hostEl.nativeElement.querySelector<HTMLElement>(`#${CSS.escape(panelId)}`);
        panel?.querySelector<HTMLElement>('a, button')?.focus();
      }, 0);
    }
  }

  onDropdownEnter(menu: string, event: PointerEvent) {
    if (event.pointerType !== 'mouse' || this.isMobileViewport()) {
      return;
    }
    this.cancelCloseTimer();
    if (this.openMenu() === menu) {
      return;
    }
    this.cancelOpenTimer();
    // Si ya hay otro mega-menú abierto, cambiar de inmediato; si estaba cerrado, aplicar delay breve
    const delay = this.openMenu() ? 0 : HOVER_OPEN_DELAY_MS;
    if (delay === 0) {
      this.openedByHoverAt = Date.now();
      this.setMenuOpen(menu);
    } else {
      this.openTimer = setTimeout(() => {
        this.openTimer = undefined;
        this.openedByHoverAt = Date.now();
        this.setMenuOpen(menu);
      }, delay);
    }
  }

  onDropdownLeave(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || this.isMobileViewport()) {
      return;
    }
    this.cancelOpenTimer();
    this.scheduleHoverClose();
  }

  onPanelEnter(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || this.isMobileViewport()) {
      return;
    }
    this.cancelCloseTimer();
  }

  onPanelLeave(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || this.isMobileViewport()) {
      return;
    }
    this.scheduleHoverClose();
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

  private setMenuOpen(menu: string): void {
    this.openScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    this.openMenu.set(menu);
  }

  private focusTrigger(menu: string): void {
    const btn = this.hostEl.nativeElement.querySelector<HTMLButtonElement>(`button[data-mega-trigger="${menu}"]`);
    btn?.focus();
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
  }

  private scheduleHoverClose(): void {
    this.cancelCloseTimer();
    this.closeTimer = setTimeout(() => {
      this.closeTimer = undefined;
      this.openMenu.set(null);
    }, HOVER_CLOSE_DELAY_MS);
  }

  private cancelOpenTimer(): void {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = undefined;
    }
  }

  private cancelCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  private clearHoverTimers(): void {
    this.cancelOpenTimer();
    this.cancelCloseTimer();
  }
}
