import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, Profile } from '../../../core/services/profile.service';

@Component({
  selector: 'app-profile-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <header class="top-nav">
        <div class="nav-left">
          <a routerLink="/dashboard" class="back-link">← Dashboard</a>
          <div class="divider"></div>
          <span class="title">Profile Builder</span>
        </div>
      </header>

      <main class="content">
        <div class="header-text">
          <h1>Build Your Profile</h1>
          <p>Fill in your details below.</p>
        </div>

        <!-- Personal Info Form -->
        <div class="card">
          <h2>Personal Information</h2>
          <form (ngSubmit)="savePersonalInfo()">
            <div class="form-grid">
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" [(ngModel)]="profile.phone" name="phone" class="input-field" placeholder="+1 234 567 8900" />
              </div>
              <div class="form-group">
                <label>Location</label>
                <input type="text" [(ngModel)]="profile.location" name="location" class="input-field" placeholder="New York, NY" />
              </div>
              <div class="form-group">
                <label>Headline</label>
                <input type="text" [(ngModel)]="profile.headline" name="headline" class="input-field" placeholder="Software Engineer" />
              </div>
            </div>
            
            <div class="form-actions">
              <span *ngIf="saving" class="saving-text">Saving...</span>
              <button type="submit" class="btn-primary" [disabled]="saving">Save Personal Info</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; background: #f3f4f6; font-family: inherit; }
    .top-nav { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 64px; }
    .nav-left { display: flex; align-items: center; gap: 16px; }
    .back-link { color: #6b7280; text-decoration: none; font-size: 13px; font-weight: 600; padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 8px; transition: all 0.2s; }
    .back-link:hover { color: #111; background: #f9fafb; }
    .divider { width: 1px; height: 24px; background: #e5e7eb; }
    .title { color: #111; font-weight: 700; font-size: 16px; }
    .content { max-width: 900px; margin: 0 auto; padding: 28px 20px; }
    .header-text h1 { color: #111; font-weight: 700; font-size: 28px; margin: 0 0 4px; }
    .header-text p { color: #6b7280; font-size: 14px; margin: 0 0 24px; }
    
    .card { background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .card h2 { color: #1e293b; font-weight: 700; font-size: 18px; margin: 0 0 24px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .input-field { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s; box-sizing: border-box; }
    .input-field:focus { border-color: #111; }
    .form-actions { margin-top: 28px; display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
    .saving-text { font-size: 13px; color: #6b7280; }
    .btn-primary { padding: 12px 32px; background: #111; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { background: #333; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class ProfileBuilderComponent implements OnInit {
  profileService = inject(ProfileService);
  
  profile: Partial<Profile> = {};
  saving = false;

  ngOnInit() {
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        this.profile = res.data.profile || {};
      },
      error: (err) => console.error(err)
    });
  }

  savePersonalInfo() {
    this.saving = true;
    const updateData = {
      phone: this.profile.phone,
      location: this.profile.location,
      headline: this.profile.headline
    };
    
    this.profileService.updateProfile(updateData).subscribe({
      next: (res) => {
        this.saving = false;
        alert('Saved successfully!');
      },
      error: (err) => {
        this.saving = false;
        alert('Failed to save.');
        console.error(err);
      }
    });
  }
}
