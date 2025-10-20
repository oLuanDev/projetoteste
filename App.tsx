import React, { useState, useEffect } from 'react';
import LoginScreen from './components/auth/LoginScreen';
import MainLayout, { View } from './components/layout/MainLayout';
import { USERS, INITIAL_JOBS, INITIAL_CANDIDATES, INITIAL_TALENT_POOL } from './constants';
import { User, Job, Candidate, Talent, CandidateInterview } from './types';
import ReminderToast from './components/notifications/ReminderToast';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [talentPool, setTalentPool] = useState<Talent[]>(INITIAL_TALENT_POOL);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeView, setActiveView] = useState<View>('vagas');
  
  const [activeReminder, setActiveReminder] = useState<{ candidate: Candidate; type: 'reminder' | 'now' } | null>(null);
  const [remindedIntervals, setRemindedIntervals] = useState<Record<string, boolean>>({});


  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('lacoste-burger-user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const savedTheme = localStorage.getItem('lacoste-burger-theme');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark');
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      localStorage.clear();
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lacoste-burger-theme', theme);
  }, [theme]);
  
  // Effect for scheduling reminders
  useEffect(() => {
    if (!currentUser) return; // Don't run if not logged in

    const intervalId = setInterval(() => {
        const now = new Date();
        
        // --- Cleanup old reminders from state to prevent memory leak ---
        const activeInterviewIds = new Set(
            candidates
                .filter(c => c.interview && new Date(`${c.interview.date}T${c.interview.time}`) > now)
                .map(c => c.id)
        );
        const cleanedReminders: Record<string, boolean> = {};
        let needsCleaning = false;
        Object.keys(remindedIntervals).forEach(key => {
            const candidateId = parseInt(key.split('_')[0]);
            if (activeInterviewIds.has(candidateId)) {
                cleanedReminders[key] = true;
            } else {
                needsCleaning = true;
            }
        });
        if (needsCleaning) {
            setRemindedIntervals(cleanedReminders);
        }

        // --- Check for interviews happening NOW ---
        const interviewNow = candidates.find(c => {
            if (!c.interview || c.interview.noShow) return false;
            const interviewTime = new Date(`${c.interview.date}T${c.interview.time}`);
            const diffMins = (now.getTime() - interviewTime.getTime()) / 60000;
            return diffMins >= 0 && diffMins < 1; // Started within the last minute
        });

        if (interviewNow) {
            const reminderKey = `${interviewNow.id}_0`;
            if (!remindedIntervals[reminderKey]) {
                setActiveReminder({ candidate: interviewNow, type: 'now' });
                setRemindedIntervals(prev => ({...prev, [reminderKey]: true}));
                return; // Prioritize "now" notification
            }
        }
        
        // --- Check for upcoming interviews to remind ---
        const nextInterviewToNotify = candidates
            .filter(c => c.interview && !c.interview.noShow && new Date(`${c.interview.date}T${c.interview.time}`) > now)
            .sort((a, b) => new Date(`${a.interview!.date}T${a.interview!.time}`).getTime() - new Date(`${b.interview!.date}T${b.interview!.time}`).getTime())
            [0];
        
        if (nextInterviewToNotify) {
            const interviewTime = new Date(`${nextInterviewToNotify.interview!.date}T${nextInterviewToNotify.interview!.time}`);
            const diffMins = (interviewTime.getTime() - now.getTime()) / 60000;
            
            if (diffMins > 0 && diffMins <= 30) {
                const reminderInterval = Math.ceil(diffMins / 5) * 5; // Groups into 30, 25, 20...
                const reminderKey = `${nextInterviewToNotify.id}_${reminderInterval}`;
                
                if (!remindedIntervals[reminderKey] && !activeReminder) {
                    setActiveReminder({ candidate: nextInterviewToNotify, type: 'reminder' });
                    setRemindedIntervals(prev => ({...prev, [reminderKey]: true}));
                }
            }
        }

    }, 1000 * 5); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [candidates, remindedIntervals, currentUser, activeReminder]);


  const handleLogin = (username: string, password: string, rememberMe: boolean): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('lacoste-burger-user', JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem('lacoste-burger-creds', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('lacoste-burger-creds');
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lacoste-burger-user');
  };

  // User Management
  const handleAddUser = (userData: Omit<User, 'id' | 'role'>) => {
    const newUser: User = { ...userData, id: Date.now(), role: 'user' };
    setUsers(prev => [...prev, newUser]);
  };

  const handleRemoveUser = (userId: number) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleToggleAdminRole = (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
  };

  // Job Management
  const handleAddJob = (jobData: Omit<Job, 'id'>) => {
    const newJob: Job = { ...jobData, id: `job-${Date.now()}-${Math.random()}` };
    setJobs(prev => [newJob, ...prev]);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
  };

  const handleArchiveJob = (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'archived' } : j));
  };

  const handleRestoreJob = (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'active' } : j));
  };

  const handlePermanentDeleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };


  // Candidate Management
  const handleUpdateCandidate = (updatedCandidate: Candidate) => {
    const originalCandidate = candidates.find(c => c.id === updatedCandidate.id);

    // If candidate is being rejected, add them to the talent pool automatically
    if (originalCandidate && updatedCandidate.status === 'rejected' && originalCandidate.status !== 'rejected') {
        const jobTitle = jobs.find(j => j.id === originalCandidate.jobId)?.title || 'Cargo Anterior';
        const isScreeningRejection = (originalCandidate.status === 'applied' || originalCandidate.status === 'screening');
        
        const newTalent: Omit<Talent, 'id'> = {
            originalCandidateId: originalCandidate.id,
            name: originalCandidate.name,
            age: originalCandidate.age,
            city: originalCandidate.location.split('(')[0].trim(),
            education: originalCandidate.education,
            experience: originalCandidate.experience,
            skills: originalCandidate.skills,
            potential: originalCandidate.fitScore || 5.0,
            status: isScreeningRejection ? 'Rejeitado (Triagem)' : 'Rejeitado (Entrevista)',
            desiredPosition: jobTitle,
            avatarUrl: originalCandidate.avatarUrl,
            gender: originalCandidate.gender,
            rejectionReason: isScreeningRejection 
                ? `Rejeitado na triagem inicial por baixa compatibilidade (Score: ${originalCandidate.fitScore?.toFixed(1) || 'N/A'}).`
                : 'Candidato não aprovado na fase de entrevista por critérios comportamentais ou técnicos.'
        };
        
        const talentExists = talentPool.some(t => t.originalCandidateId === originalCandidate.id);
        if (!talentExists) {
             handleAddTalent(newTalent);
        }
    }
    setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
  };

  const handleArchiveCandidate = (candidateId: number) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, isArchived: true } : c));
  };
  
  const handleRestoreCandidate = (candidateId: number) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, isArchived: false } : c));
  };

  const handlePermanentDeleteCandidate = (candidateId: number) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
  };
  
  const handleInterviewScheduled = (candidate: Candidate, interviewDetails: CandidateInterview) => {
    handleUpdateCandidate({ ...candidate, interview: interviewDetails, status: 'approved' });
  };
  
  const handleBulkInterviewScheduled = (candidateIds: number[], interviewDetails: Omit<CandidateInterview, 'notes'>) => {
    setCandidates(prev => prev.map(c => {
        if(candidateIds.includes(c.id)) {
            return { ...c, interview: { ...interviewDetails, notes: '' }, status: 'approved' };
        }
        return c;
    }));
  };

  const handleBulkCancelInterviews = (candidateIds: number[]) => {
    setCandidates(prev => prev.map(c => {
        if(candidateIds.includes(c.id)) {
            const updated = { ...c };
            delete updated.interview;
            updated.status = 'approved';
            return updated;
        }
        return c;
    }));
  };


  // Talent Pool Management
  const handleAddTalent = (talentData: Omit<Talent, 'id'>) => {
    const newTalent: Talent = { ...talentData, id: Date.now() };
    setTalentPool(prev => [newTalent, ...prev]);
  };

  const handleUpdateTalent = (updatedTalent: Talent) => {
    setTalentPool(prev => prev.map(t => t.id === updatedTalent.id ? updatedTalent : t));
  };
  
  const handleArchiveTalent = (talentId: number) => {
      setTalentPool(prev => prev.map(t => t.id === talentId ? { ...t, isArchived: true } : t));
  };

  const handleRestoreTalent = (talentId: number) => {
    setTalentPool(prev => prev.map(t => t.id === talentId ? { ...t, isArchived: false } : t));
  };

  const handlePermanentDeleteTalent = (talentId: number) => {
    setTalentPool(prev => prev.filter(t => t.id !== talentId));
  };

  const handleSendTalentToJob = (talentId: number, jobId: string) => {
    const talent = talentPool.find(t => t.id === talentId);
    if (!talent) return;

    const newCandidate: Candidate = {
        id: Date.now(),
        name: talent.name,
        age: talent.age,
        maritalStatus: 'Não informado',
        location: talent.city,
        experience: talent.experience,
        education: talent.education,
        skills: talent.skills,
        summary: `Talento do banco de dados com ${talent.experience}.`,
        jobId: jobId,
        fitScore: talent.potential,
        status: 'screening',
        applicationDate: new Date().toISOString(),
        source: 'Banco de Talentos',
        isArchived: false,
        gender: talent.gender,
        resume: {
            professionalExperience: [{ company: 'Informação não disponível', role: 'Informação não disponível', duration: talent.experience, description: talent.experience }],
            courses: [],
            availability: 'A confirmar',
            contact: { phone: 'Não informado', email: 'Não informado' },
            personalSummary: `Talento do banco de dados com ${talent.experience}.`,
        }
    };

    setCandidates(prev => [newCandidate, ...prev]);
    setTalentPool(prev => prev.filter(t => t.id !== talentId));
  };

  // Archive Management
  const handleRestoreAll = () => {
    setJobs(prev => prev.map(j => ({...j, status: 'active'})));
    setCandidates(prev => prev.map(c => ({...c, isArchived: false})));
    setTalentPool(prev => prev.map(t => ({...t, isArchived: false})));
  };

  const handleDeleteAllPermanently = () => {
    setJobs(prev => prev.filter(j => j.status !== 'archived'));
    setCandidates(prev => prev.filter(c => !c.isArchived));
    setTalentPool(prev => prev.filter(t => !t.isArchived));
  };

  // Candidate Import
  const handleAddCandidates = (newCandidates: Candidate[]) => {
    const existingIds = new Set(candidates.map(c => c.id));
    setCandidates(prev => [...prev, ...newCandidates.filter(nc => !existingIds.has(nc.id))]);
  };


  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <MainLayout
        user={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        jobs={jobs}
        candidates={candidates}
        talentPool={talentPool}
        users={users}
        onAddJob={handleAddJob}
        onUpdateJob={handleUpdateJob}
        onArchiveJob={handleArchiveJob}
        onRestoreJob={handleRestoreJob}
        onDeleteJob={handlePermanentDeleteJob}
        onUpdateCandidate={handleUpdateCandidate}
        onArchiveCandidate={handleArchiveCandidate}
        onRestoreCandidate={handleRestoreCandidate}
        onPermanentDeleteCandidate={handlePermanentDeleteCandidate}
        onInterviewScheduled={handleInterviewScheduled}
        onBulkInterviewScheduled={handleBulkInterviewScheduled}
        onBulkCancelInterviews={handleBulkCancelInterviews}
        onAddTalent={handleAddTalent}
        onUpdateTalent={handleUpdateTalent}
        onArchiveTalent={handleArchiveTalent}
        onRestoreTalent={handleRestoreTalent}
        onDeleteTalent={handlePermanentDeleteTalent}
        onSendTalentToJob={handleSendTalentToJob}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
        onUpdateUser={handleUpdateUser}
        onToggleAdminRole={handleToggleAdminRole}
        onRestoreAll={handleRestoreAll}
        onDeleteAllPermanently={handleDeleteAllPermanently}
        onAddCandidates={handleAddCandidates}
      />
      {activeReminder && (
        <ReminderToast
            reminder={activeReminder}
            onClose={() => setActiveReminder(null)}
        />
      )}
    </>
  );
}

export default App;