import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  ProfileService, Profile, Resume,
  Education, Experience, Project, Certification
} from '../../../core/services/profile.service';

@Component({
  selector: 'app-profile-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './profile-builder.component.html',
  styleUrl: './profile-builder.component.css'
})
export class ProfileBuilderComponent implements OnInit {
  private ps = inject(ProfileService);
  private route = inject(ActivatedRoute);

  profile: any = {
    phone: '', location: '', linkedin: '', github: '', portfolio: '',
    headline: '', about: '',
    technicalSkills: [], tools: [], softSkills: [],
    education: [], experience: [], projects: [], certifications: [],
    photo: { url: '' }, resume: { url: '' }
  };
  resumes: Resume[] = [];
  saving = false;
  activeTab = 'personal';
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  // Skill inputs
  newTechnical = '';
  newTool = '';
  newSoft = '';

  // Sub-forms
  eduForm: any = { degree: '', college: '', specialization: '', startYear: null, endYear: null, cgpa: '' };
  expForm: any = { company: '', role: '', startDate: '', endDate: '', isCurrent: false, responsibilities: '' };
  projForm: any = { name: '', description: '', techStack: [] as string[], githubLink: '', liveLink: '' };
  certForm: any = { name: '', issuer: '', issueDate: '', credentialUrl: '' };
  newProjTech = '';

  readonly tabs = [
    { key: 'personal',       label: 'Personal Info',   check: (p: any) => !!(p?.phone && p?.location) },
    { key: 'professional',   label: 'Professional',    check: (p: any) => !!(p?.headline && p?.about) },
    { key: 'skills',         label: 'Skills',          check: (p: any) => !!(p?.technicalSkills?.length > 0) },
    { key: 'education',      label: 'Education',       check: (p: any) => !!(p?.education?.length > 0) },
    { key: 'experience',     label: 'Experience',      check: (p: any) => !!(p?.experience?.length > 0) },
    { key: 'projects',       label: 'Projects',        check: (p: any) => !!(p?.projects?.length > 0) },
    { key: 'certifications', label: 'Certifications',  check: (p: any) => !!(p?.certifications?.length > 0) },
    { key: 'resume',         label: 'Resume',          check: (p: any) => !!(p?.resume?.url) },
  ];

  ngOnInit() {
    // Read initial tab from query params (e.g. ?tab=education)
    this.route.queryParams.subscribe(params => {
      if (params['tab']) this.activeTab = params['tab'];
    });
    this.loadProfile();
  }

  loadProfile() {
    this.ps.getMyProfile().subscribe({
      next: res => {
        const p = res.data.profile;
        this.profile = {
          ...this.profile,
          ...p,
          technicalSkills: p.technicalSkills || [],
          tools: p.tools || [],
          softSkills: p.softSkills || [],
          education: p.education || [],
          experience: p.experience || [],
          projects: p.projects || [],
          certifications: p.certifications || [],
        };
      },
      error: () => this.toast('Failed to load profile', 'error')
    });
    this.ps.getResumes().subscribe({
      next: res => this.resumes = res.data || [],
      error: () => {}
    });
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  toast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMsg = msg;
    this.toastType = type;
    setTimeout(() => this.toastMsg = '', 3000);
  }

  // ── Personal ──────────────────────────────────────────────────────────────
  savePersonal() {
    this.saving = true;
    this.ps.updatePersonalInfo({
      phone: this.profile.phone, location: this.profile.location,
      linkedin: this.profile.linkedin, github: this.profile.github, portfolio: this.profile.portfolio
    }).subscribe({
      next: () => { this.saving = false; this.toast('Personal info saved!'); this.loadProfile(); },
      error: () => { this.saving = false; this.toast('Failed to save', 'error'); }
    });
  }

  // ── Professional ──────────────────────────────────────────────────────────
  saveProfessional() {
    this.saving = true;
    this.ps.updateProfessional({ headline: this.profile.headline, about: this.profile.about }).subscribe({
      next: () => { this.saving = false; this.toast('Professional info saved!'); this.loadProfile(); },
      error: () => { this.saving = false; this.toast('Failed to save', 'error'); }
    });
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  addSkill(field: 'technicalSkills' | 'tools' | 'softSkills', val: string) {
    const v = val?.trim();
    if (v && !this.profile[field].includes(v)) this.profile[field].push(v);
  }

  removeSkill(field: 'technicalSkills' | 'tools' | 'softSkills', idx: number) {
    this.profile[field].splice(idx, 1);
  }

  saveSkills() {
    this.saving = true;
    this.ps.updateSkills({
      technicalSkills: this.profile.technicalSkills,
      tools: this.profile.tools,
      softSkills: this.profile.softSkills
    }).subscribe({
      next: () => { this.saving = false; this.toast('Skills saved!'); this.loadProfile(); },
      error: () => { this.saving = false; this.toast('Failed to save', 'error'); }
    });
  }

  // ── Education ─────────────────────────────────────────────────────────────
  addEducation() {
    if (!this.eduForm.degree || !this.eduForm.college) { this.toast('Degree and College are required', 'error'); return; }
    this.saving = true;
    this.ps.addEducation(this.eduForm).subscribe({
      next: () => {
        this.saving = false; this.toast('Education added!');
        this.eduForm = { degree: '', college: '', specialization: '', startYear: null, endYear: null, cgpa: '' };
        this.loadProfile();
      },
      error: () => { this.saving = false; this.toast('Failed to add', 'error'); }
    });
  }

  // ── Experience ────────────────────────────────────────────────────────────
  addExperience() {
    this.saving = true;
    this.ps.addExperience(this.expForm).subscribe({
      next: () => {
        this.saving = false; this.toast('Experience added!');
        this.expForm = { company: '', role: '', startDate: '', endDate: '', isCurrent: false, responsibilities: '' };
        this.loadProfile();
      },
      error: () => { this.saving = false; this.toast('Failed to add', 'error'); }
    });
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  addProjTech() {
    const v = this.newProjTech?.trim();
    if (v) { this.projForm.techStack.push(v); this.newProjTech = ''; }
  }

  addProject() {
    this.saving = true;
    this.ps.addProject(this.projForm).subscribe({
      next: () => {
        this.saving = false; this.toast('Project added!');
        this.projForm = { name: '', description: '', techStack: [], githubLink: '', liveLink: '' };
        this.loadProfile();
      },
      error: () => { this.saving = false; this.toast('Failed to add', 'error'); }
    });
  }

  // ── Certifications ────────────────────────────────────────────────────────
  addCertification() {
    this.saving = true;
    this.ps.addCertification(this.certForm).subscribe({
      next: () => {
        this.saving = false; this.toast('Certification added!');
        this.certForm = { name: '', issuer: '', issueDate: '', credentialUrl: '' };
        this.loadProfile();
      },
      error: () => { this.saving = false; this.toast('Failed to add', 'error'); }
    });
  }

  // ── Generic delete for sub-documents ──────────────────────────────────────
  deleteEntry(section: 'education' | 'experience' | 'projects' | 'certifications', id: string) {
    if (!confirm('Delete this entry?')) return;
    this.saving = true;
    let obs;
    switch (section) {
      case 'education': obs = this.ps.deleteEducation(id); break;
      case 'experience': obs = this.ps.deleteExperience(id); break;
      case 'projects': obs = this.ps.deleteProject(id); break;
      case 'certifications': obs = this.ps.deleteCertification(id); break;
    }
    obs.subscribe({
      next: () => { this.saving = false; this.toast('Deleted!'); this.loadProfile(); },
      error: () => { this.saving = false; this.toast('Failed to delete', 'error'); }
    });
  }

  // ── Resume ────────────────────────────────────────────────────────────────
  uploadResume(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.saving = true;
    this.ps.uploadResume(file, file.name).subscribe({
      next: () => { this.saving = false; this.toast('Resume uploaded!'); this.loadProfile(); },
      error: () => { this.saving = false; this.toast('Upload failed', 'error'); }
    });
  }

  setActive(id: string) {
    this.ps.activateResume(id).subscribe({
      next: () => { this.toast('Active resume updated!'); this.loadProfile(); },
      error: () => this.toast('Failed to set active', 'error')
    });
  }

  deleteResume(id: string) {
    if (!confirm('Delete this resume version?')) return;
    this.ps.deleteResume(id).subscribe({
      next: () => { this.toast('Resume deleted!'); this.loadProfile(); },
      error: () => this.toast('Failed to delete', 'error')
    });
  }

  // ── Auto-Fill Profile from Resume ─────────────────────────────────────────
  autoFillFromResume(r: Resume) {
    if (r.parsingStatus === 'done' && r.parsedData) {
      this.executeAutofill(r.parsedData);
    } else {
      this.saving = true;
      this.toast('Parsing resume with AI... (this takes ~10 seconds)');
      this.ps.parseResume(r._id).subscribe({
        next: (res) => {
          this.toast('Resume parsed successfully!', 'success');
          // Update local resume data
          r.parsingStatus = 'done';
          r.parsedData = res.data.parsedData;
          this.executeAutofill(r.parsedData);
        },
        error: () => {
          this.saving = false;
          this.toast('Failed to parse resume', 'error');
        }
      });
    }
  }

  private executeAutofill(parsedData: any) {
    if (!parsedData) return;
    this.saving = true;
    this.toast('Auto-filling profile...');
    
    this.ps.autofillProfile(parsedData).subscribe({
      next: (res) => {
        this.saving = false;
        this.toast('Profile magically auto-filled! ✨', 'success');
        this.loadProfile();
      },
      error: (err) => {
        this.saving = false;
        this.toast('Failed to auto-fill profile', 'error');
        console.error(err);
      }
    });
  }
}

