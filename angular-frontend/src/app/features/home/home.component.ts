import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../shared/services/auth-modal.service';
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
  modalService = inject(AuthModalService);
  router = inject(Router);

  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    // APP_INITIALIZER already resolved auth state. Just snapshot-check here.
    const user = this.authService.currentUser;
    if (user) {
      const dest = this.authService.getDashboardRoute(user.role);
      if (dest.isAngular) {
        this.router.navigate([dest.path]);
      } else {
        window.location.href = `${environment.reactAppUrl}${dest.path}`;
      }
    }
  }

  handleFindJobs(): void {
    this.router.navigate(['/jobs']);
  }

  handleHireTalent(): void {
    // Replicate role click -> recruiter signup/login flow
    this.modalService.open('register', 'recruiter');
  }

  handleRegisterResume(): void {
    this.modalService.open('register', 'jobseeker');
  }
}
