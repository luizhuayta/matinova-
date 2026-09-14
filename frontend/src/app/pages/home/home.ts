import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  currentSlide = 0;
  currentServiceSlide = 0;
  currentTestimonialSlide = 0;

  slides = [
    {
      badge: 'INNOVACIÓN EN TECNOLOGÍA',
      title: 'Soluciones TI que Transforman para tu empresa',
      image: 'carousel.jpg'
    },
    {
      badge: 'NUESTRO EQUIPO',
      title: 'Profesionales altamente capacitados en tecnología y consultoría',
      image: 'carousel.jpg'
    },
    {
      badge: 'CLIENTES SATISFECHOS',
      title: 'Opiniones positivas y casos de éxito en implementación de TI',
      image: 'carousel.jpg'
    }
  ];

  innovativeServices = [
    {
      title: 'Soluciones TI',
      desc: 'Transformamos tu trabajo con soluciones de TI.',
      img: 'sol_ti.jpg'
    },
    {
      title: 'SAAS',
      desc: 'Gestiona todo, así puedes centrarte en tu negocio.',
      img: 'saas.jpg'
    },
    {
      title: 'Hardware',
      desc: 'Ofrecemos hardware avanzado para un rendimiento óptimo.',
      img: 'hard.avif'
    },
    {
      title: 'Software',
      desc: 'Creamos Software a medida para tu negocio',
      img: 'software.png'
    },
    {
      title: 'Consultoria',
      desc: 'Consultores en TI para transformar tu negocio',
      img: 'consultoria.jpg'
    }
  ];

  testimonials = [
    {
      text: 'Un equipo profesional como la empresa MIS que entiende nuestras necesidades y resuelve problemas rápidamente.',
      client: 'IEI Nº 449 San Luis – Cañete',
      logo: 'sanluis.jpg'
    },
    {
      text: 'Matt Innova Solution mejoró nuestra infraestructura TI y ofrece un soporte excepcional. ¡Recomendados!',
      client: 'IESTP TECNOCOM',
      logo: 'tecnocom.jpg'
    },
    {
      text: 'La implementación del ERP y otras soluciones de Matt Innova Solution optimizó nuestros procesos y aumentó la eficiencia.',
      client: 'IESTP WORLDNET',
      logo: 'worldnet.jpg'
    }
  ];

  private heroIntervalId: any;
  private serviceIntervalId: any;
  private testimonialIntervalId: any;

  ngOnInit(): void {
    this.iniciarCarruselesAutomaticos();
  }

  ngOnDestroy(): void {
    if (this.heroIntervalId) clearInterval(this.heroIntervalId);
    if (this.serviceIntervalId) clearInterval(this.serviceIntervalId);
    if (this.testimonialIntervalId) clearInterval(this.testimonialIntervalId);
  }

  private iniciarCarruselesAutomaticos(): void {
    this.heroIntervalId = setInterval(() => {
      this.nextSlide();
    }, 4000);

    this.serviceIntervalId = setInterval(() => {
      this.nextServiceSlide();
    }, 2000);

    this.testimonialIntervalId = setInterval(() => {
      this.nextTestimonialSlide();
    }, 2000);
  }

  nextSlide(): void {
    if (this.slides.length > 0) {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }
  }

  nextServiceSlide(): void {
    if (this.innovativeServices.length > 0) {
      const visibleItems = 3; // Cantidad de items visibles
      const maxSlides = Math.max(0, this.innovativeServices.length - visibleItems + 1);
      this.currentServiceSlide = (this.currentServiceSlide + 1) % maxSlides;
    }
  }

  nextTestimonialSlide(): void {
    if (this.testimonials.length > 0) {
      const visibleItems = 2; // Cantidad de testimonios visibles
      const maxTestimonials = Math.max(0, this.testimonials.length - visibleItems + 1);
      this.currentTestimonialSlide = (this.currentTestimonialSlide + 1) % maxTestimonials;
    }
  }

  setSlide(index: number) {
    this.currentSlide = index;
  }

  setServiceSlide(index: number) {
    this.currentServiceSlide = index;
  }

  setTestimonialSlide(index: number) {
    this.currentTestimonialSlide = index;
  }
}
