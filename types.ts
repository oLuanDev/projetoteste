// FIX: Removed circular import of 'UserRole' from './types' which was causing a conflict with the local declaration of 'UserRole' in this same file.
export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  password?: string;
  role?: UserRole;
  specialty?: string;
}

export interface JobSource {
  name: string;
  url: string;
}

export type JobStatus = 'active' | 'archived';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  description:string;
  responsibilities: string[];
  benefits: string[];
  requirements: string[];
  sources: JobSource[];
  status: JobStatus;
}

export type CandidateStatus = 'applied' | 'screening' | 'offer' | 'approved' | 'rejected' | 'hired' | 'pending' | 'waitlist';

export interface Resume {
    professionalExperience: {
        company: string;
        role: string;
        duration: string;
        description: string;
    }[];
    courses: {
        name: string;
        institution: string;
    }[];
    availability: string;
    contact: {
        phone: string;
        email: string;
    };
    personalSummary: string;
    conducaoPropria?: string;
    motivo?: string;
}

export interface CandidateInterview {
    date: string;
    time: string;
    location: string;
    interviewers: string[];
    notes: string;
    noShow?: boolean;
}

export interface Candidate {
  id: number;
  name: string;
  age: number;
  maritalStatus: string;
  location: string;
  experience: string;
  education: string;
  skills: string[];
  summary: string;
  avatarUrl?: string;
  jobId: string;
  fitScore?: number;
  status: CandidateStatus;
  applicationDate: string;
  source: string;
  resume: Resume;
  isArchived: boolean;
  hireDate?: string;
  interview?: CandidateInterview;
  gender?: 'male' | 'female';
}

export interface Talent {
  id: number;
  originalCandidateId?: number;
  name: string;
  age: number;
  city: string;
  education: string;
  experience: string;
  skills: string[];
  potential: number;
  status: string;
  desiredPosition: string;
  avatarUrl?: string;
  isArchived?: boolean;
  gender?: 'male' | 'female';
  rejectionReason?: string;
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  fitScore: number;
  interviewQuestions: string[];
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}