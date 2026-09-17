import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LibroReclamacionesComponent } from './libro-reclamaciones';

describe('LibroReclamacionesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroReclamacionesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LibroReclamacionesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
