import { useState, useMemo, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { ArrowRight, ArrowLeft, Check, Sparkles, Plus, X, Briefcase, UploadCloud } from 'lucide-react';

interface OnboardingPageProps {
  session: {
    id: number;
    role: 'seeker' | 'alumni';
    name: string;
    college?: string;
    company?: string;
    email?: string;
  };
  onComplete: (updatedUser: any) => void;
  onSkip?: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ session, onComplete, onSkip }) => {
  if (!session) return null;
  const isSeeker = session.role === 'seeker';
  const themeAccent = isSeeker ? 'purple' : 'emerald';

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // --- Seeker Fields State ---
  const [seekerName, setSeekerName] = useState(session.name || '');
  const [seekerCollege, setSeekerCollege] = useState(session.college || '');
  const [seekerBranch, setSeekerBranch] = useState('');
  const [seekerGradYear, setSeekerGradYear] = useState('2026');
  
  // Seeker Resume
  const [resumeMode, setResumeMode] = useState<'upload' | 'link'>('upload');
  const [seekerResume, setSeekerResume] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [seekerLinkedIn, setSeekerLinkedIn] = useState('');
  const [seekerDomain, setSeekerDomain] = useState('Software Engineering');
  const [seekerSkills, setSeekerSkills] = useState<string[]>(['React', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');
  const [seekerTargetRoles, setSeekerTargetRoles] = useState<string[]>(['Frontend Developer']);
  const [newRole, setNewRole] = useState('');
  const [seekerBio, setSeekerBio] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<Array<{ name: string; githubUrl: string; liveUrl: string }>>([
    { name: 'Project 1', githubUrl: '', liveUrl: '' }
  ]);

  // --- Alumni Fields State ---
  const [alumniCompany, setAlumniCompany] = useState(session.company || '');
  const [alumniRole, setAlumniRole] = useState('');
  const [alumniExperience, setAlumniExperience] = useState('3-5 years');
  const [alumniWorkEmail, setAlumniWorkEmail] = useState('');
  const [alumniLinkedIn, setAlumniLinkedIn] = useState('');
  const [alumniAvailability, setAlumniAvailability] = useState<boolean>(true); // true = Open to Mentorship, false = Referrals Only
  const [alumniBio, setAlumniBio] = useState('');
  const [alumniHours, setAlumniHours] = useState('Weekends, 10:00 AM - 2:00 PM IST');
  const [preferredReferrals, setPreferredReferrals] = useState<string[]>([]);
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [alumniExpertise, setAlumniExpertise] = useState<string[]>(['Resume Review', 'System Design']);
  const [newExpertiseInput, setNewExpertiseInput] = useState('');

  // Handle Seeker Portfolio Links (dual link fields)
  const addPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, { name: `Project ${portfolioLinks.length + 1}`, githubUrl: '', liveUrl: '' }]);
  };

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  const updatePortfolioLink = (index: number, key: 'name' | 'githubUrl' | 'liveUrl', value: string) => {
    const updated = [...portfolioLinks];
    updated[index][key] = value;
    setPortfolioLinks(updated);
  };

  // Seeker Resume Upload handler
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf') {
        setError('Please upload a PDF format resume.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB.');
        return;
      }

      setError(null);
      setIsUploadingFile(true);
      setUploadedFileName(file.name);

      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('resume', file);

        const res = await fetch(`${API_BASE_URL}/api/users/resume/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!res.ok) {
          throw new Error('Upload failed. Please try again.');
        }

        const data = await res.json();
        if (data.resumeName) {
          setSeekerResume(data.resumeName);
        }

        // AI Autofill fields!
        if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
          setSeekerSkills(data.skills);
        }
        if (data.bio) {
          setSeekerBio(data.bio);
        }
        if (data.targetRole) {
          const roles = typeof data.targetRole === 'string' 
            ? data.targetRole.split(',').map((r: string) => r.trim())
            : data.targetRole;
          setSeekerTargetRoles(roles);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error uploading file.');
        setUploadedFileName('');
        setSeekerResume('');
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  // Seeker Tags helpers
  const addSkill = () => {
    if (newSkill.trim() && !seekerSkills.includes(newSkill.trim())) {
      setSeekerSkills([...seekerSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSeekerSkills(seekerSkills.filter(s => s !== skill));
  };

  const addRole = () => {
    if (newRole.trim() && !seekerTargetRoles.includes(newRole.trim())) {
      setSeekerTargetRoles([...seekerTargetRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const removeRole = (r: string) => {
    setSeekerTargetRoles(seekerTargetRoles.filter(item => item !== r));
  };

  // Alumni Preferred Companies helpers
  const addPreferredCompany = () => {
    if (newCompanyInput.trim() && !preferredReferrals.includes(newCompanyInput.trim())) {
      setPreferredReferrals([...preferredReferrals, newCompanyInput.trim()]);
      setNewCompanyInput('');
    }
  };

  const removePreferredCompany = (comp: string) => {
    setPreferredReferrals(preferredReferrals.filter(c => c !== comp));
  };

  // Alumni Expertise tags helpers
  const addExpertise = () => {
    if (newExpertiseInput.trim() && !alumniExpertise.includes(newExpertiseInput.trim())) {
      setAlumniExpertise([...alumniExpertise, newExpertiseInput.trim()]);
      setNewExpertiseInput('');
    }
  };

  const removeExpertise = (exp: string) => {
    setAlumniExpertise(alumniExpertise.filter(e => e !== exp));
  };

  // Step validation
  const isStepValid = useMemo(() => {
    if (isSeeker) {
      if (step === 1) {
        return !!seekerName.trim() && !!seekerCollege.trim() && !!seekerBranch.trim() && !!seekerGradYear.trim();
      }
      if (step === 2) {
        return !!seekerResume.trim() && !!seekerLinkedIn.trim();
      }
      if (step === 3) {
        return seekerSkills.length > 0 && !!seekerBio.trim();
      }
    } else {
      if (step === 1) {
        return !!alumniCompany.trim() && !!alumniRole.trim() && !!alumniWorkEmail.trim();
      }
      if (step === 2) {
        return alumniExpertise.length > 0;
      }
      if (step === 3) {
        return !!alumniBio.trim() && !!alumniLinkedIn.trim();
      }
    }
    return false;
  }, [
    step, isSeeker, seekerName, seekerCollege, seekerBranch, seekerGradYear, seekerResume, seekerLinkedIn, seekerSkills, seekerBio,
    alumniCompany, alumniRole, alumniWorkEmail, alumniExpertise, alumniBio, alumniLinkedIn
  ]);

  // Submit profile to backend
  const handleSubmit = async () => {
    if (!isStepValid) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const payload: any = {
        isProfileComplete: true
      };

      if (isSeeker) {
        payload.name = seekerName;
        payload.college = seekerCollege;
        payload.branch = seekerBranch;
        payload.year = `${seekerGradYear} Batch`;
        payload.resumeName = seekerResume;
        payload.resumeUploaded = true;
        payload.linkedinUrl = seekerLinkedIn;
        payload.primaryDomain = seekerDomain;
        payload.skills = seekerSkills;
        payload.bio = seekerBio;
        payload.targetRole = seekerTargetRoles.join(', ');
        
        // Save dual portfolio links as formatted string list
        payload.projects = portfolioLinks
          .filter(l => l.name.trim() !== '')
          .map(l => `${l.name} (GitHub: ${l.githubUrl || 'N/A'}, Demo: ${l.liveUrl || 'N/A'})`);
      } else {
        payload.company = alumniCompany;
        payload.jobTitle = alumniRole;
        payload.experience = alumniExperience;
        payload.companyEmail = alumniWorkEmail;
        payload.linkedinUrl = alumniLinkedIn;
        payload.canHelpWith = alumniExpertise;
        payload.availability = alumniAvailability ? 'Open to Mentorship' : 'Referrals Only';
        payload.bio = alumniBio;
        payload.preferredContactHours = alumniHours;
        
        // Preferred companies saved to targetCompanies list
        payload.targetCompanies = preferredReferrals.length > 0 ? preferredReferrals : [alumniCompany];
      }

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to complete onboarding profile.');
      }

      const updatedUser = await res.json();
      onComplete(updatedUser);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const accentColorClass = themeAccent === 'purple' ? 'text-purple-400' : 'text-emerald-400';
  const accentBorderClass = themeAccent === 'purple' ? 'border-purple-500/30 focus:border-purple-500' : 'border-emerald-500/30 focus:border-emerald-500';
  const accentBgClass = themeAccent === 'purple' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20';
  const accentBgMutedClass = themeAccent === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
  const accentGlowClass = themeAccent === 'purple' ? 'shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'shadow-[0_0_20px_rgba(16,185,129,0.15)]';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 py-8 overlay-animate-in">
      
      {/* Inline styles for custom entrance animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes onboardingZoomIn {
          from { transform: scale(0.95); opacity: 0; filter: blur(4px); }
          to { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
        @keyframes overlayFadeIn {
          from { background-color: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); }
          to { background-color: rgba(2, 2, 5, 0.65); backdrop-filter: blur(16px); }
        }
        .onboarding-animate-in {
          animation: onboardingZoomIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .overlay-animate-in {
          animation: overlayFadeIn 0.45s ease-out forwards;
        }
      `}} />

      <div className={`w-full max-w-xl bg-[#07070f]/95 border border-white/10 rounded-2xl p-6 md:p-8 relative font-sora text-white ${accentGlowClass} onboarding-animate-in`}>
        
        {/* Onboarding Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">NEXTINCAMPUS</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${accentBgMutedClass}`}>
              {isSeeker ? 'Seeker' : 'Alumni'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {onSkip && (
              <button 
                type="button"
                onClick={onSkip}
                className="text-[10px] font-bold text-slate-400 hover:text-white transition-all mr-2 animate-pulse"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>

        {/* Setup Wizard Steps */}
        <div>
          {/* Progress Tracker */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">STEP {step} OF 3</span>
              <span className="text-xs font-bold text-slate-300">
                {step === 1 && 'Basic Identity'}
                {step === 2 && (isSeeker ? 'Referral Assets' : 'Match Preferences')}
                {step === 3 && 'Pitch & Profile Bio'}
              </span>
            </div>
            
            {/* Step Progress Line */}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? (themeAccent === 'purple' ? 'bg-purple-500' : 'bg-emerald-500') : 'bg-white/5'} flex-1`} />
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? (themeAccent === 'purple' ? 'bg-purple-500' : 'bg-emerald-500') : 'bg-white/5'} flex-1`} />
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 3 ? (themeAccent === 'purple' ? 'bg-purple-500' : 'bg-emerald-500') : 'bg-white/5'} flex-1`} />
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: Academic & Basic Identity (Seeker) OR Verification & Professional Identity (Alumni) */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="mb-2">
                <h2 className="text-base md:text-lg font-black flex items-center gap-1.5">
                  <Sparkles className={accentColorClass} size={16} />
                  <span>Tell us about yourself</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Let's set up your profile identity.</p>
              </div>

              {isSeeker ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                    <input 
                      type="text"
                      value={seekerName}
                      onChange={(e) => setSeekerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">College / University</label>
                    <input 
                      type="text"
                      value={seekerCollege}
                      onChange={(e) => setSeekerCollege(e.target.value)}
                      placeholder="e.g. KIIT University"
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Degree & Branch</label>
                      <input 
                        type="text"
                        value={seekerBranch}
                        onChange={(e) => setSeekerBranch(e.target.value)}
                        placeholder="e.g. B.Tech in CSE"
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                      />
                    </div>
                    
                    {/* Writable and Choosable Graduation Year with Datalist */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Graduation Year</label>
                      <input 
                        type="text"
                        list="grad-years"
                        value={seekerGradYear}
                        onChange={(e) => setSeekerGradYear(e.target.value)}
                        placeholder="Select or Type"
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                      />
                      <datalist id="grad-years">
                        <option value="2025" />
                        <option value="2026" />
                        <option value="2027" />
                        <option value="2028" />
                        <option value="2029" />
                      </datalist>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Company</label>
                      <input 
                        type="text"
                        value={alumniCompany}
                        onChange={(e) => setAlumniCompany(e.target.value)}
                        placeholder="e.g. Google"
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Designation / Role</label>
                      <input 
                        type="text"
                        value={alumniRole}
                        onChange={(e) => setAlumniRole(e.target.value)}
                        placeholder="e.g. Senior SWE"
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Years of Experience</label>
                    <select 
                      value={alumniExperience}
                      onChange={(e) => setAlumniExperience(e.target.value)}
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    >
                      <option value="0-2 years">0-2 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Email (Mandatory Verification)</label>
                    <input 
                      type="email"
                      value={alumniWorkEmail}
                      onChange={(e) => setAlumniWorkEmail(e.target.value)}
                      placeholder="e.g. name@company.com"
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                    <p className="text-[9px] text-slate-500 leading-normal">
                      We verify work emails to maintain a secure and trusted community. Stale or personal emails are rejected.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: The Seeker "Referral Arsenal" OR Alumni Preferences */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="mb-2">
                <h2 className="text-base md:text-lg font-black flex items-center gap-1.5">
                  <Briefcase className={accentColorClass} size={16} />
                  <span>{isSeeker ? 'Referral Arsenal' : 'Preferences & Support'}</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isSeeker ? 'Provide links or files that verify your skills and project work.' : 'Let seekers know how you can refer or support them.'}
                </p>
              </div>

              {isSeeker ? (
                <>
                  {/* Seeker PDF Resume Uploader */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Seeker Resume (PDF)</label>
                      <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setResumeMode('upload')}
                          className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all ${resumeMode === 'upload' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                          Upload PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setResumeMode('link')}
                          className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all ${resumeMode === 'link' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                          Paste Link
                        </button>
                      </div>
                    </div>

                    {resumeMode === 'upload' ? (
                      /* Drag/Click to Upload Area */
                      <div 
                        onClick={() => !isUploadingFile && fileInputRef.current?.click()}
                        className={`p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[110px] cursor-pointer select-none bg-slate-950/40 ${isUploadingFile ? 'border-purple-500/50 bg-purple-950/5' : 'border-white/10 hover:border-purple-500/30'}`}
                      >
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleResumeFileUpload}
                          disabled={isUploadingFile}
                          accept=".pdf"
                          className="hidden"
                        />
                        
                        {isUploadingFile ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-6 h-6 rounded-full border-2 border-t-purple-500 border-r-purple-500 border-b-white/10 border-l-white/10 animate-spin" />
                            <span className="text-[10px] font-bold text-purple-400 animate-pulse">AI extracting skills & pitch...</span>
                          </div>
                        ) : seekerResume ? (
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <Check className="w-6 h-6 text-emerald-400 bg-emerald-500/10 p-1 rounded-full border border-emerald-500/20" />
                            <span className="text-[11px] font-bold text-white max-w-[280px] truncate">{uploadedFileName || 'Resume uploaded'}</span>
                            <span className="text-[9px] text-slate-500 font-medium">Click to upload a different PDF</span>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-7 h-7 mb-1 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-300">Click to browse or drop your resume</span>
                            <span className="text-[8px] text-slate-500 mt-0.5">PDF format up to 5MB</span>
                          </>
                        )}
                      </div>
                    ) : (
                      /* URL input */
                      <input 
                        type="url"
                        value={seekerResume}
                        onChange={(e) => setSeekerResume(e.target.value)}
                        placeholder="e.g. https://drive.google.com/file/d/..."
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LinkedIn Profile URL</label>
                    <input 
                      type="url"
                      value={seekerLinkedIn}
                      onChange={(e) => setSeekerLinkedIn(e.target.value)}
                      placeholder="e.g. https://linkedin.com/in/username"
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Domain</label>
                    <select 
                      value={seekerDomain}
                      onChange={(e) => setSeekerDomain(e.target.value)}
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Product Management">Product Management</option>
                      <option value="Design">Design</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  {/* Portfolio links with dual URLs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portfolio & Projects</label>
                      <button 
                        type="button" 
                        onClick={addPortfolioLink}
                        className={`text-[9px] font-bold uppercase flex items-center gap-1 ${accentColorClass}`}
                      >
                        <Plus size={11} /> Add project
                      </button>
                    </div>

                    {portfolioLinks.map((link, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2 relative">
                        {portfolioLinks.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removePortfolioLink(idx)}
                            className="absolute top-2.5 right-2.5 p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                          >
                            <X size={12} />
                          </button>
                        )}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-slate-500">Project Title</label>
                          <input 
                            type="text"
                            value={link.name}
                            onChange={(e) => updatePortfolioLink(idx, 'name', e.target.value)}
                            placeholder="e.g. NextInCampus Dashboard"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-slate-500">GitHub Repository Link</label>
                            <input 
                              type="url"
                              value={link.githubUrl}
                              onChange={(e) => updatePortfolioLink(idx, 'githubUrl', e.target.value)}
                              placeholder="e.g. https://github.com/..."
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-slate-500">Live Demo Link</label>
                            <input 
                              type="url"
                              value={link.liveUrl}
                              onChange={(e) => updatePortfolioLink(idx, 'liveUrl', e.target.value)}
                              placeholder="e.g. https://my-project.com"
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Preferred referral companies (Tag input) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Companies you can refer to</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newCompanyInput}
                        onChange={(e) => setNewCompanyInput(e.target.value)}
                        placeholder="e.g. Google, Amazon, Microsoft"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPreferredCompany())}
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${accentBorderClass} transition-all`}
                      />
                      <button 
                        type="button" 
                        onClick={addPreferredCompany}
                        className={`px-3 py-2 rounded-lg text-white font-bold text-xs ${accentBgClass}`}
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {preferredReferrals.length === 0 ? (
                        <span className="text-[9px] text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          Defaults to current company ({alumniCompany || 'None'})
                        </span>
                      ) : (
                        preferredReferrals.map(c => (
                          <span key={c} className={`text-[9px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${accentBgMutedClass}`}>
                            <span>{c}</span>
                            <button type="button" onClick={() => removePreferredCompany(c)}>
                              <X size={9} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Areas of expertise (Tag input) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Areas of Expertise (Mentorship / Guidance)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newExpertiseInput}
                        onChange={(e) => setNewExpertiseInput(e.target.value)}
                        placeholder="e.g. System Design, Resume Review"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${accentBorderClass} transition-all`}
                      />
                      <button 
                        type="button" 
                        onClick={addExpertise}
                        className={`px-3 py-2 rounded-lg text-white font-bold text-xs ${accentBgClass}`}
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {alumniExpertise.map(e => (
                        <span key={e} className={`text-[9px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${accentBgMutedClass}`}>
                          <span>{e}</span>
                          <button type="button" onClick={() => removeExpertise(e)}>
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Mentorship availability toggle */}
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between mt-2">
                    <div className="space-y-0.5">
                      <label className="text-xs font-black text-white">Mentorship Availability</label>
                      <p className="text-[9px] text-slate-500">
                        {alumniAvailability 
                          ? 'Seekers can request meetings.' 
                          : 'Referrals Only.'}
                      </p>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setAlumniAvailability(!alumniAvailability)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${alumniAvailability ? (themeAccent === 'purple' ? 'bg-purple-600' : 'bg-emerald-600') : 'bg-white/10'}`}
                    >
                      <span 
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alumniAvailability ? 'translate-x-4' : 'translate-x-0'}`} 
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Seeker Pitch & Skills OR Alumni Impact Bio */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="mb-2">
                <h2 className="text-base md:text-lg font-black flex items-center gap-1.5">
                  <Sparkles className={accentColorClass} size={16} />
                  <span>Stand out from the crowd</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isSeeker ? 'Showcase your tech stack and introduce yourself.' : 'Share your professional background and contact preferences.'}
                </p>
              </div>

              {isSeeker ? (
                <>
                  {/* Tag input for skills */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Technical Skills</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="e.g. React, Node.js, Python"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${accentBorderClass} transition-all`}
                      />
                      <button 
                        type="button" 
                        onClick={addSkill}
                        className={`px-3 py-2 rounded-lg text-white font-bold text-xs ${accentBgClass}`}
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {seekerSkills.map(s => (
                        <span key={s} className={`text-[9px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${accentBgMutedClass}`}>
                          <span>{s}</span>
                          <button type="button" onClick={() => removeSkill(s)}>
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tag input for target roles */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Roles</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="e.g. Frontend Developer"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${accentBorderClass} transition-all`}
                      />
                      <button 
                        type="button" 
                        onClick={addRole}
                        className={`px-3 py-2 rounded-lg text-white font-bold text-xs ${accentBgClass}`}
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {seekerTargetRoles.map(r => (
                        <span key={r} className={`text-[9px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${accentBgMutedClass}`}>
                          <span>{r}</span>
                          <button type="button" onClick={() => removeRole(r)}>
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 150-Word Elevator Pitch Bio */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Elevator Pitch (150 Words max)</label>
                    <textarea 
                      value={seekerBio}
                      onChange={(e) => setSeekerBio(e.target.value)}
                      rows={3}
                      placeholder="I am a full-stack developer passionate about building scalable AI platforms..."
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LinkedIn Profile URL</label>
                    <input 
                      type="url"
                      value={alumniLinkedIn}
                      onChange={(e) => setAlumniLinkedIn(e.target.value)}
                      placeholder="e.g. https://linkedin.com/in/username"
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                  </div>

                  {/* Alumni Professional Journey (100 words) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Professional Journey / Background</label>
                    <textarea 
                      value={alumniBio}
                      onChange={(e) => setAlumniBio(e.target.value)}
                      rows={3}
                      placeholder="KIIT University alumnus. Currently leading cloud scaling services at Google..."
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                  </div>

                  {/* Preferred contact hours */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preferred Contact Hours / Timezone</label>
                    <input 
                      type="text"
                      value={alumniHours}
                      onChange={(e) => setAlumniHours(e.target.value)}
                      placeholder="e.g. Weekends, 10:00 AM - 2:00 PM IST"
                      className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 ${themeAccent === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-emerald-500'} ${accentBorderClass} transition-all`}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            {step > 1 ? (
              <button 
                type="button" 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-all font-bold uppercase"
              >
                <ArrowLeft size={12} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button 
                type="button" 
                onClick={() => isStepValid && setStep(step + 1)}
                disabled={!isStepValid}
                className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all duration-200 ${isStepValid ? (themeAccent === 'purple' ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-emerald-600 text-white hover:bg-emerald-500') : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'}`}
              >
                <span>Continue</span>
                <ArrowRight size={12} />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={!isStepValid || isSubmitting || isUploadingFile}
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-200 ${isStepValid && !isSubmitting && !isUploadingFile ? (themeAccent === 'purple' ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-emerald-600 text-white hover:bg-emerald-500') : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    <span>Complete Profile</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
