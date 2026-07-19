import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, Profile, Resume, ProfileResponse, ResumesResponse } from '../../core/services/profile.service';
import { ApplicationService, AtsData, AiFeedback, RecommendedJob, AiIntelligenceResponse } from '../../core/services/application.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private applicationService = inject(ApplicationService);
  public router = inject(Router);

  // ── Auth State ──
  user: any = null;

  // ── Profile State ──
  profile: Profile | null = null;
  resumes: Resume[] = [];
  completionScore = 0;
  profileLoading = true;

  // ── ATS State ──
  jd = '';
  loadingAts = false;
  loadingAi = false;
  atsResult: AtsData | null = null;
  aiFeedback: { atsFeedback: AiFeedback; recommendedJobs: RecommendedJob[] } | null = null;
  atsError = '';
  parsingResume = false;
  uploadingPhoto = false;

  // ── Profile Sections ──
  readonly sections = [
    { key: 'personal',       label: 'Personal Info',   icon: '', check: (p: Profile | null) => !!(p?.phone && p?.location) },
    { key: 'professional',   label: 'Professional',    icon: '', check: (p: Profile | null) => !!(p?.headline && p?.about) },
    { key: 'skills',         label: 'Skills',          icon: '', check: (p: Profile | null) => !!(p?.technicalSkills && p.technicalSkills.length > 0) },
    { key: 'education',      label: 'Education',       icon: '', check: (p: Profile | null) => !!(p?.education && p.education.length > 0) },
    { key: 'experience',     label: 'Experience',      icon: '', check: (p: Profile | null) => !!(p?.experience && p.experience.length > 0) },
    { key: 'projects',       label: 'Projects',        icon: '', check: (p: Profile | null) => !!(p?.projects && p.projects.length > 0) },
    { key: 'certifications', label: 'Certifications',  icon: '', check: (p: Profile | null) => !!(p?.certifications && p.certifications.length > 0) },
    { key: 'resume',         label: 'Resume',          icon: '', check: (p: Profile | null) => !!(p?.resume?.url) },
  ];

  private subs = new Subscription();
  readonly apiUrl = environment.apiUrl;

  get activeResume(): Resume | null {
    return this.resumes.find(r => r.isActive) ?? null;
  }

  get firstName(): string {
    return (this.user?.name as string | undefined)?.split(' ')[0] ?? 'there';
  }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  get completionColor(): string {
    if (this.completionScore >= 80) return '#4ade80';
    if (this.completionScore >= 50) return '#f59e0b';
    return '#aaaaaa';
  }

  get completionLabel(): string {
    if (this.completionScore >= 80) return 'Looking great!';
    if (this.completionScore >= 50) return 'Almost there';
    if (this.completionScore > 0) return 'Keep going';
    return "Let's get started";
  }

  get ringCircumference(): number { return 2 * Math.PI * 46; }
  get ringOffset(): number { return this.ringCircumference - (this.completionScore / 100) * this.ringCircumference; }

  get atsCircumference(): number { return 2 * Math.PI * 46; }
  get atsRingOffset(): number {
    const score = this.atsResult?.matchScore ?? 0;
    return this.atsCircumference - (score / 100) * this.atsCircumference;
  }

  get atsScoreClass(): string {
    const s = this.atsResult?.matchScore ?? 0;
    if (s >= 80) return 'excellent';
    if (s >= 65) return 'strong';
    if (s >= 50) return 'good';
    if (s >= 35) return 'fair';
    return 'needs';
  }

  get feedback(): AiFeedback | undefined { return this.aiFeedback?.atsFeedback; }
  get recommendedJobs(): RecommendedJob[] { return this.aiFeedback?.recommendedJobs ?? []; }
  get isLoading(): boolean { return this.loadingAts || this.loadingAi; }

  ngOnInit(): void {
    // Auth state already resolved by APP_INITIALIZER — read snapshot directly.
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.user = currentUser;
      const u = currentUser as { role?: string };
      if (u.role && u.role !== 'jobseeker') {
        this.router.navigate([this.authService.getDashboardRoute(u.role).path]);
        return;
      }
    }
    // Still subscribe to react to future auth state changes (e.g. token expiry)
    this.subs.add(
      this.authService.currentUser$.subscribe((user: unknown) => {
        this.user = user;
        const u = user as { role?: string } | null;
        if (u && u.role && u.role !== 'jobseeker') {
          const dest = this.authService.getDashboardRoute(u.role);
          this.router.navigate([dest.path]);
        }
      })
    );
    this.loadProfile();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  loadProfile(): void {
    this.profileLoading = true;
    forkJoin([
      this.profileService.getMyProfile().pipe(catchError(() => of(null))),
      this.profileService.getResumes().pipe(catchError(() => of(null)))
    ]).subscribe((results: Array<ProfileResponse | ResumesResponse | null>) => {
      const profileRes = results[0] as ProfileResponse | null;
      const resumesRes = results[1] as ResumesResponse | null;
      if (profileRes?.success) {
        this.profile = profileRes.data.profile;
        this.completionScore = profileRes.data.completionScore;
      }
      if (resumesRes?.success) {
        this.resumes = resumesRes.data;
      }
      this.profileLoading = false;
    });
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadingPhoto = true;
      this.profileService.uploadPhoto(file).subscribe({
        next: (res) => {
          this.uploadingPhoto = false;
          if (this.profile) {
            this.profile.photo = { url: res.data.photoUrl, publicId: '' };
            this.completionScore = res.data.completionScore;
          }
          alert('Photo uploaded successfully!');
        },
        error: (err) => {
          this.uploadingPhoto = false;
          alert('Failed to upload photo.');
          console.error(err);
        }
      });
    }
  }

  getSectionSubtitle(section: { key: string; check: (p: Profile | null) => boolean }): string {
    const done = section.check(this.profile);
    if (section.key === 'resume' && done) return 'Uploaded ✓';
    return done ? 'Edit ✏️' : 'Tap to fill →';
  }

  navigateToSection(key: string): void {
    this.router.navigate(['/dashboard/profile'], { queryParams: { tab: key } });
  }

  menuOpen = false;
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  goToFindJobs(): void { this.router.navigate(['/dashboard/jobs']); }
  goToBuildProfile(): void { this.router.navigate(['/dashboard/profile']); }

  parseActiveResume(): void {
    if (!this.activeResume) return;
    this.parsingResume = true;
    this.profileService.parseResume(this.activeResume._id).subscribe({
      next: (res) => {
        this.parsingResume = false;
        const idx = this.resumes.findIndex(r => r._id === this.activeResume!._id);
        if (idx !== -1) {
          this.resumes[idx].parsingStatus = 'done';
          this.resumes[idx].parsedData = res.data.parsedData;
        }
        alert('Resume parsed successfully! You can now use the ATS Match Analyzer.');
      },
      error: (err) => {
        this.parsingResume = false;
        alert('Failed to parse resume. Check console for details.');
        console.error(err);
      }
    });
  }

  handleAnalyze(): void {
    if (!this.jd.trim() || this.jd.trim().length < 30) {
      this.atsError = 'Please paste a job description (at least 30 characters).'; return;
    }
    if (!this.activeResume) {
      this.atsError = 'No active resume found. Please upload and set a resume as active.'; return;
    }
    if (this.activeResume.parsingStatus !== 'done') {
      this.atsError = 'Please parse your active resume first using the ✨ Parse button in your profile.'; return;
    }
    this.atsError = '';
    this.atsResult = null;
    this.aiFeedback = null;
    this.loadingAts = true;

    const resumeId = this.activeResume._id;
    this.applicationService.matchATS(resumeId, this.jd).subscribe({
      next: (res: { success: boolean; data: AtsData }) => {
        this.atsResult = res.data;
        this.loadingAts = false;
        this.loadingAi = true;
        this.applicationService.getAiIntelligence(resumeId, {
          jobDescription: this.jd,
          atsScore: res.data.matchScore,
          matchedSkills: res.data.matchedKeywords,
          missingSkills: res.data.missingKeywords,
          matchedRequirements: [],
          missingRequirements: []
        }).subscribe({
          next: (aiRes: AiIntelligenceResponse) => { this.aiFeedback = aiRes.data; this.loadingAi = false; },
          error: () => { this.atsError = 'AI analysis failed. ATS score is still shown above.'; this.loadingAi = false; }
        });
      },
      error: () => { this.atsError = 'ATS analysis failed. Please try again.'; this.loadingAts = false; }
    });
  }

  getMatchLevelClass(level: string): string {
    return level === 'Strong' ? 'excellent' : level === 'Moderate' ? 'fair' : 'needs';
  }

  getJobScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'strong';
    if (score >= 50) return 'good';
    if (score >= 35) return 'fair';
    return 'needs';
  }

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigate(['/']));
  }
}
