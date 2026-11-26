import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, adminReturnUrl } from '../cms/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  host: { class: 'login-host' },
})
export class AdminLogin {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  username = 'admin';
  password = '';
  error = '';
  loading = false;

  async submit(): Promise<void> {
    this.error = '';
    this.loading = true;
    const message = await this.auth.login(this.username.trim(), this.password);
    this.loading = false;
    if (message) {
      this.error = message;
      return;
    }
    await this.router.navigateByUrl(adminReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));
  }
}
