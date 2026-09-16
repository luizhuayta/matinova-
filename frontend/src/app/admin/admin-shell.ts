import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../cms/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
  host: { class: 'admin-root' },
})
export class AdminShell {
  auth = inject(AuthService);
  initial = computed(() => (this.auth.username() || 'A').slice(0, 1).toUpperCase());
}
