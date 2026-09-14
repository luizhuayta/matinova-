import { CommonModule } from '@angular/common';
import { Component, HostListener, AfterViewInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements AfterViewInit {
  isMobileMenuOpen = false;
  isScrolled = false;
  isTransparent = false;
  logoClass = '';

  constructor(private router: Router) {
    // Check initial scroll position
    this.checkScroll();
  }

  ngAfterViewInit() {
    // Escuchar navegación para animar el logo
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.animateLogo();
    });
  }

  animateLogo() {
    // Remover y re-agregar la clase para reiniciar la animación
    this.logoClass = '';
    setTimeout(() => {
      this.logoClass = 'logo-entrance';
    }, 10);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.checkScroll();
  }

  checkScroll() {
    this.isScrolled = window.scrollY > 50;
    const header = document.querySelector('.main-header');
    if (header) {
      if (this.isScrolled) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeMobileMenu();
  }

  toggleTransparency() {
    this.isTransparent = !this.isTransparent;
    const body = document.body;
    if (this.isTransparent) {
      body.classList.add('transparency-mode');
    } else {
      body.classList.remove('transparency-mode');
    }
  }
}
