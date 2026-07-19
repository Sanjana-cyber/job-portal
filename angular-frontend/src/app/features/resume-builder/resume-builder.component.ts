import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
    headline: string;
    summary: string;
  };
  education: {
    college: string;
    degree: string;
    specialization: string;
    startYear: string;
    endYear: string;
    cgpa: string;
  }[];
  experience: {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    responsibilities: string;
  }[];
  skills: string;
  projects: {
    name: string;
    description: string;
    techStack: string;
    liveLink: string;
  }[];
}

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resume-builder.component.html',
  styleUrls: ['./resume-builder.component.css']
})
export class ResumeBuilderComponent implements OnInit {
  authService = inject(AuthService);
  profileService = inject(ProfileService);
  router = inject(Router);

  isLoggedIn = false;
  isLoadingData = false;

  resumeData: ResumeData = {
    personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', headline: '', summary: '' },
    education: [],
    experience: [],
    skills: '',
    projects: []
  };

  ngOnInit() {
    this.isLoggedIn = !!this.authService.currentUser;
    if (this.isLoggedIn) {
      this.loadProfileData();
    } else {
      // Add a blank entry to get them started
      this.addEducation();
      this.addExperience();
    }
  }

  loadProfileData() {
    this.isLoadingData = true;
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success && res.data.profile) {
          const p = res.data.profile;
          // Map backend profile to resumeData
          this.resumeData.personal = {
            name: p.user?.name || '',
            email: p.user?.email || '',
            phone: p.phone || '',
            location: p.location || '',
            linkedin: p.linkedin || '',
            github: p.github || '',
            portfolio: p.portfolio || '',
            headline: p.headline || '',
            summary: p.about || ''
          };
          
          this.resumeData.skills = p.technicalSkills?.join(', ') || '';
          
          if (p.education && p.education.length) {
            this.resumeData.education = p.education.map((e: any) => ({
              college: e.college,
              degree: e.degree,
              specialization: e.specialization,
              startYear: e.startYear,
              endYear: e.endYear,
              cgpa: e.cgpa
            }));
          } else {
            this.addEducation();
          }

          if (p.experience && p.experience.length) {
            this.resumeData.experience = p.experience.map((e: any) => ({
              company: e.company,
              role: e.role,
              startDate: e.startDate ? new Date(e.startDate).getFullYear().toString() : '',
              endDate: e.endDate ? new Date(e.endDate).getFullYear().toString() : '',
              isCurrent: e.isCurrent,
              responsibilities: e.responsibilities
            }));
          } else {
            this.addExperience();
          }

          if (p.projects && p.projects.length) {
            this.resumeData.projects = p.projects.map((proj: any) => ({
              name: proj.name,
              description: proj.description,
              techStack: proj.techStack?.join(', ') || '',
              liveLink: proj.liveLink
            }));
          }
        }
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
        this.addEducation();
        this.addExperience();
      }
    });
  }

  addEducation() {
    this.resumeData.education.push({ college: '', degree: '', specialization: '', startYear: '', endYear: '', cgpa: '' });
  }

  removeEducation(index: number) {
    this.resumeData.education.splice(index, 1);
  }

  addExperience() {
    this.resumeData.experience.push({ company: '', role: '', startDate: '', endDate: '', isCurrent: false, responsibilities: '' });
  }

  removeExperience(index: number) {
    this.resumeData.experience.splice(index, 1);
  }

  addProject() {
    this.resumeData.projects.push({ name: '', description: '', techStack: '', liveLink: '' });
  }

  removeProject(index: number) {
    this.resumeData.projects.splice(index, 1);
  }

  downloadPDF() {
    if (!this.isLoggedIn) {
      alert('You must be logged in to download your resume as a PDF.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/resume-builder' } });
      return;
    }
    
    // Trigger native browser print
    setTimeout(() => {
      window.print();
    }, 100);
  }
}
