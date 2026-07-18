import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);

  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    // If authenticated, perform same redirect as React context:
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        const dest = this.authService.getDashboardRoute(user.role);
        if (dest.isAngular) {
          this.router.navigate([dest.path]);
        } else {
          window.location.href = `${environment.reactAppUrl}${dest.path}`;
        }
      }
    });
  }

  handleFindJobs(): void {
    this.router.navigate(['/jobs']);
  }

  handleHireTalent(): void {
    // Replicate role click -> recruiter signup/login flow
    this.router.navigate(['/register'], { queryParams: { role: 'recruiter' } });
  }

  handleRegisterResume(): void {
    this.router.navigate(['/register']);
  }
}
