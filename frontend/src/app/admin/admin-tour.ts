import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export const ADMIN_TOUR_KEY = 'matt_admin_tour';

type Hole = { top: number; left: number; width: number; height: number };
type CardPos = { top: number; left: number; width: number };

@Component({
  selector: 'app-admin-tour',
  standalone: true,
  template: `
    @if (active()) {
      <div class="tour-root">
        <div class="tour-catch"></div>
        <div
          class="tour-spot"
          [style.top.px]="hole().top"
          [style.left.px]="hole().left"
          [style.width.px]="hole().width"
          [style.height.px]="hole().height"></div>
        <div
          #cardEl
          class="tour-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-tour-title"
          aria-describedby="admin-tour-body"
          [style.top.px]="card().top"
          [style.left.px]="card().left"
          [style.width.px]="card().width">
          <h2 id="admin-tour-title">{{ step().title }}</h2>
          <p id="admin-tour-body">{{ step().body }}</p>
          <footer>
            <button type="button" class="admin-link" (click)="skip()">Saltar</button>
            <span class="tour-count">{{ index() + 1 }} / {{ total() }}</span>
            <button #nextBtn type="button" class="admin-btn-primary" (click)="next()">
              {{ last() ? 'Entendido' : 'Siguiente' }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styleUrl: './admin-tour.scss',
})
export class AdminTour implements OnDestroy {
  readonly canPublish = input(true);
  readonly activeChange = output<boolean>();
  readonly active = signal(false);
  readonly index = signal(0);
  readonly hole = signal<Hole>({ top: 0, left: 0, width: 0, height: 0 });
  readonly card = signal<CardPos>({ top: 0, left: 12, width: 320 });
  @ViewChild('cardEl') private cardEl?: ElementRef<HTMLElement>;
  @ViewChild('nextBtn') private nextBtn?: ElementRef<HTMLButtonElement>;

  readonly steps = computed(() => {
    const publish = this.canPublish()
      ? 'Cuando pulses Publicar, esto lo verá todo el mundo.'
      : 'Tú editas el borrador. Un administrador publica.';
    return [
      {
        target: 'mode',
        title: 'Ver o Editar',
        body: 'En Ver miras la página limpia. En Editar, un clic abre esa parte en el panel.',
      },
      {
        target: 'preview',
        title: 'Clic en la página',
        body: 'Pulsa un título o una foto. El panel salta a ese texto o esa imagen.',
      },
      {
        target: 'status',
        title: 'Se guarda solo',
        body: 'Los cambios van al borrador. La web pública no cambia todavía.',
      },
      {
        target: 'publish',
        title: 'Publicar',
        body: publish,
      },
    ];
  });

  readonly step = computed(() => this.steps()[this.index()] ?? this.steps()[0]);
  readonly total = computed(() => this.steps().length);
  readonly last = computed(() => this.index() >= this.total() - 1);

  private onKey = (event: KeyboardEvent) => this.handleKey(event);
  private onMove = () => this.layout();

  static seen(): boolean {
    try {
      return localStorage.getItem(ADMIN_TOUR_KEY) === '1';
    } catch {
      return false;
    }
  }

  maybeStart(): void {
    if (!AdminTour.seen()) {
      this.start();
    }
  }

  start(): void {
    this.index.set(0);
    this.setActive(true);
    this.bind();
    this.layout();
  }

  skip(): void {
    this.finish();
  }

  next(): void {
    if (this.last()) {
      this.finish();
      return;
    }
    this.index.update((value) => value + 1);
    this.layout();
  }

  ngOnDestroy(): void {
    this.unbind();
  }

  private finish(): void {
    try {
      localStorage.setItem(ADMIN_TOUR_KEY, '1');
    } catch {
      /* private mode */
    }
    this.setActive(false);
    this.unbind();
  }

  private setActive(on: boolean): void {
    this.active.set(on);
    this.activeChange.emit(on);
  }

  private bind(): void {
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('resize', this.onMove);
    window.addEventListener('scroll', this.onMove, true);
  }

  private unbind(): void {
    window.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('resize', this.onMove);
    window.removeEventListener('scroll', this.onMove, true);
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.active()) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.skip();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const buttons = this.cardEl?.nativeElement.querySelectorAll<HTMLElement>('button');
    if (!buttons?.length) {
      return;
    }
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private layout(): void {
    requestAnimationFrame(() => {
      const target = this.step()?.target;
      const el = target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null;
      const pad = 6;
      if (!el) {
        this.hole.set({ top: 16, left: 16, width: 48, height: 36 });
      } else {
        const box = el.getBoundingClientRect();
        this.hole.set({
          top: Math.max(8, box.top - pad),
          left: Math.max(8, box.left - pad),
          width: box.width + pad * 2,
          height: box.height + pad * 2,
        });
      }
      requestAnimationFrame(() => this.placeCard());
    });
  }

  private placeCard(): void {
    const hole = this.hole();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(360, vw - 24);
    const height = this.cardEl?.nativeElement.offsetHeight || 168;
    const gap = 12;
    const holeBottom = hole.top + hole.height;
    let top: number;
    let left = Math.min(Math.max(12, hole.left), Math.max(12, vw - width - 12));
    if (vw < 640) {
      top = vh - height - 16;
      left = 12;
    } else if (hole.height > vh * 0.4) {
      top = vh - height - 16;
      left = 12;
    } else if (vh - holeBottom >= height + gap + 8) {
      top = holeBottom + gap;
    } else {
      top = Math.max(12, hole.top - height - gap);
    }
    this.card.set({ top, left, width });
    this.nextBtn?.nativeElement.focus();
  }
}
