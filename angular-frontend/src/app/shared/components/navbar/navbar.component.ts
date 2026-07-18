import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../services/auth-modal.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  modalService = inject(AuthModalService);
  router = inject(Router);

  user: any = null;
  isAuthenticated = false;
  showDropdown = false;
  showNavbar = true;
  isScrolled = false;

  private subs = new Subscription();

  ngOnInit(): void {
    // 1. Listen to auth state changes
    this.subs.add(
      this.authService.currentUser$.subscribe((user: any) => {
        this.user = user;
      })
    );
    this.subs.add(
      this.authService.isAuthenticated$.subscribe(auth => {
        this.isAuthenticated = auth;
      })
    );

    // 2. Hide navbar on dashboard routes (parity with React)
    this.checkNavbarVisibility(this.router.url);
    this.subs.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.checkNavbarVisibility(event.urlAfterRedirects);
        this.showDropdown = false; // Close dropdown on navigate
      })
    );

    // 3. Scroll listener for dynamic background styling
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
    }
  }

  handleScroll = (): void => {
    this.isScrolled = window.scrollY > 10;
  };

  private checkNavbarVisibility(url: string): void {
    this.showNavbar = !(
      url.startsWith('/dashboard') ||
      url.startsWith('/recruiter/dashboard') ||
      url.startsWith('/admin')
    );
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  navigateTo(path: string): void {
    if (path === '/login') {
      this.modalService.open('login');
    } else {
      this.router.navigate([path]);
    }
  }

  handleLogoClick(): void {
    this.router.navigate(['/']);
  }

  handleDashboard(): void {
    if (!this.user) return;
    const dest = this.authService.getDashboardRoute(this.user.role);
    if (dest.isAngular) {
      this.router.navigate([dest.path]);
    } else {
      window.location.href = `${environment.reactAppUrl}${dest.path}`;
    }
    this.showDropdown = false;
  }

  handleLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
        this.showDropdown = false;
      },
      error: () => {
        // Fallback redirect
        this.router.navigate(['/']);
        this.showDropdown = false;
      }
    });
  }

  goToAdminLogin(): void {
    window.location.href = `${environment.reactAppUrl}/admin/login`;
  }
}
