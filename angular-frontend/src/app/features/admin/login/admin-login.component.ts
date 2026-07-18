import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = environment.adminEmail || '';
  password = environment.adminPassword || '';
  showPassword = false;
  loading = false;
  error = '';

  submit() {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.loading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.user?.role !== 'admin') {
          this.error = 'Access denied. Admin credentials required.';
          // logout immediately to clear cookie
          this.authService.logout().subscribe();
          return;
        }
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
