import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Home, Search, Send, MessageSquare, Bookmark, User, ShieldCheck, Newspaper, Sparkles,
  Bell, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import { DashboardTab } from './dashboard/DashboardTab';
import { DiscoverTab } from './dashboard/DiscoverTab';
import { RequestsTab } from './dashboard/RequestsTab';
import { MessagesTab } from './dashboard/MessagesTab';
import { SavedTab } from './dashboard/SavedTab';
import { ProfileTab } from './dashboard/ProfileTab';
import { AlumniDashboard } from './dashboard/AlumniDashboard';
import { ReferralNewsPanel } from './dashboard/ReferralNewsPanel';
import { CareerIntelligenceTab } from './dashboard/CareerIntelligenceTab';
import { API_BASE_URL } from '../config';
import AppLayout from './Layout';
import Sidebar from './Sidebar';
import { MobileSidebar } from './MobileSidebar';


const getNextResetDate = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const day = nextMonth.getDate();
  const month = nextMonth.toLocaleString('en-US', { month: 'long' });
  const year = nextMonth.getFullYear();
  return `${day} ${month} ${year}`;
};

export const getGreeting = () => {
  try {
    const hr = parseInt(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }),
      10
    );
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  } catch (err) {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }
};

interface DashboardPageProps {
  id: number;
  role: 'seeker' | 'alumni';
  name: string;
  college?: string;
  company?: string;
  isProfileComplete?: boolean;
  onOpenOnboarding?: () => void;
  onLogout: () => void;
}

type ActiveTab = 'dashboard' | 'network' | 'my_referrals' | 'messages' | 'saved' | 'profile' | 'accounting' | 'referral_board' | 'career_intelligence';

export const DashboardPage: React.FC<DashboardPageProps> = ({ id, role, name, college = '', company = '', isProfileComplete = true, onOpenOnboarding, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const savedTab = localStorage.getItem('seekerActiveTab');
    return (savedTab as ActiveTab) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('seekerActiveTab', activeTab);
  }, [activeTab]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [requestSuccessData, setRequestSuccessData] = useState<any | null>(null);
  const [referralTrigger, setReferralTrigger] = useState(0);

  // Profile data (Screen 6)
  const [profileName, setProfileName] = useState(name);
  const [profileCollege, setProfileCollege] = useState(college);
  const [profileYear, setProfileYear] = useState('');
  const [profileBranch, setProfileBranch] = useState('');
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [newCompanyInput, setNewCompanyInput] = useState('');
  
  // Set requested skills list
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  
  // Skill Details state for 3D Globe attributes
  const [skillDetails, setSkillDetails] = useState<{
    [key: string]: { proficiency: number; type: 'technical' | 'soft' | 'domain' }
  }>({});

  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumesHistory, setResumesHistory] = useState<any[]>([]);
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [referralCreditsRemaining, setReferralCreditsRemaining] = useState(5);
  const [monthlyReferralLimit, setMonthlyReferralLimit] = useState(5);
  const [isOutOfCreditsModalOpen, setIsOutOfCreditsModalOpen] = useState(false);

  // Discover state (Screen 2)
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [privacyCollegeOnly, setPrivacyCollegeOnly] = useState(true);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [aiMatchToggle, setAiMatchToggle] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState<any | null>(null);
  const [savedAlumniIds, setSavedAlumniIds] = useState<number[]>([]);

  // Request flow modal states (Screen 3)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [profileTargetRole, setProfileTargetRole] = useState('Software Engineer');
  const [timeline, setTimeline] = useState('Actively looking');
  const [pitchMessage, setPitchMessage] = useState('');
  const [aiTipWarning, setAiTipWarning] = useState('');
  const [alumniForRequest, setAlumniForRequest] = useState<any | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<any | null>(null);
  const [trackerFilter, setTrackerFilter] = useState<'All' | 'Pending' | 'Accepted' | 'Declined' | 'Hired'>('All');

  // Seeker Tracker lists & conversations
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<{ [key: number]: { id?: number, sender: 'seeker' | 'alumni', text: string, time: string }[] }>({});
  
  // Chat input and meeting scheduler
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('');

  // Alumni dashboard lists
  const [requests, setRequests] = useState<any[]>([]);
  const [referralsSentCount, setReferralsSentCount] = useState(0);

  // Alumni List (Loaded from DB)
  const [alumniNetwork, setAlumniNetwork] = useState<any[]>([]);

  // Alumni active tab tracking
  const [alumniActiveTab, setAlumniActiveTab] = useState<string>(() => {
    return localStorage.getItem('alumniActiveTab') || 'overview';
  });

  // State synchronization refs for persistent socket listener
  const activeChatIdRef = useRef(activeChatId);
  const activeTabRef = useRef(activeTab);
  const alumniActiveTabRef = useRef(alumniActiveTab);
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    alumniActiveTabRef.current = alumniActiveTab;
  }, [alumniActiveTab]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Fetch functions
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        setProfileName(data.name);
        setProfileCollege(data.college);
        if (data.role === 'seeker') {
          setProfileYear(data.year || '3rd Year');
          setProfileBranch(data.branch || 'CSE');
          setBio(data.bio || '');
          setGithubUrl(data.githubUrl || '');
          setLinkedinUrl(data.linkedinUrl || '');
          setSkills(data.skills || []);
          setSkillDetails(data.skillDetails || {});
          setTargetCompanies(data.targetCompanies || []);
          setProfileTargetRole(data.targetRole || 'Software Engineer');
          setResumeUploaded(data.resumeUploaded);
          setResumeName(data.resumeName || '');
          setResumesHistory(data.resumesHistory || []);
          setReferralCreditsRemaining(data.referralCreditsRemaining !== undefined ? data.referralCreditsRemaining : 5);
          setMonthlyReferralLimit(data.monthlyReferralLimit !== undefined ? data.monthlyReferralLimit : 5);
        } else {
          setReferralsSentCount(data.referralsSentCount);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, []);

  const fetchAlumni = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/alumni`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        const formatted = list.map((a: any) => {
          const initials = a.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          const colors = [
            'from-blue-500 to-indigo-650',
            'from-purple-500 to-pink-500',
            'from-emerald-500 to-teal-600',
            'from-rose-500 to-pink-600',
            'from-amber-500 to-orange-600',
            'from-teal-500 to-emerald-600'
          ];
          const colorIdx = a.id % colors.length;
          return {
            ...a,
            initials,
            color: colors[colorIdx]
          };
        });
        setAlumniNetwork(formatted);
      }
    } catch (err) {
      console.error("Error fetching alumni:", err);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      if (role === 'seeker') {
        const res = await fetch(`${API_BASE_URL}/api/requests/seeker`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((r: any) => ({
            id: r.id,
            alumniId: r.alumniId,
            alumniName: r.alumni.name,
            company: r.alumni.company,
            role: r.targetRole,
            location: r.location || 'Remote',
            date: new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ago',
            createdAt: r.createdAt,
            status: r.status,
            message: r.pitchMessage,
            rating: r.rating,
            ratingFeedback: r.ratingFeedback
          }));
          setRequestsList(formatted);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/requests/alumni`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((r: any) => {
            const resumeNameVal = r.seeker?.resumeName || r.resumeName || '';
            const isResumeUploaded = Boolean(resumeNameVal || r.seeker?.resumeUploaded || r.resumeUploaded);
            const reqDateStr = r.createdAt 
              ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
              : (r.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
            return {
              id: r.id,
              studentName: r.seeker?.name || 'Student',
              class: `${r.seeker?.branch || ''} ${r.seeker?.year || '3rd Year'}, ${r.seeker?.college || ''}`.trim(),
              company: company,
              role: r.targetRole,
              location: r.location || 'Remote',
              score: '94% Match',
              message: r.pitchMessage,
              status: r.status,
              seekerId: r.seekerId || r.seeker?.id,
              date: reqDateStr,
              createdAt: r.createdAt || new Date().toISOString(),
              resumeName: resumeNameVal,
              resumeUploaded: isResumeUploaded,
              seeker: r.seeker
            };
          });
          setRequests(formatted);
        }
      }
    } catch (err) {
      console.error("Error loading requests:", err);
    }
  }, [role, company]);

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }, []);

  const fetchChatHistory = useCallback(async (partnerId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/history/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((m: any) => ({
          id: m.id,
          sender: m.senderId === id ? 'seeker' as const : 'alumni' as const,
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setChatMessages(prev => ({
          ...prev,
          [partnerId]: formatted
        }));
      }
    } catch (err) {
      console.error("Error loading message history:", err);
    }
  }, [id]);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error("Error loading unread count:", err);
    }
  }, []);

  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUnreadCount(0);
        fetchNotifications();
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUnreadCount();
        fetchNotifications();
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleNotificationNavigation = (notif: any) => {
    markNotificationAsRead(notif.id);
    const actionUrl = notif.actionUrl || '';
    
    if (role === 'alumni') {
      if (actionUrl.includes('tab=inbox')) {
        setAlumniActiveTab('inbox');
      } else if (actionUrl.includes('tab=messages') || notif.type === 'message_received') {
        setAlumniActiveTab('messages');
        if (notif.metadata?.senderId) {
          setActiveChatId(notif.metadata.senderId);
        } else if (notif.metadata?.seekerId) {
          setActiveChatId(notif.metadata.seekerId);
        }
      } else if (actionUrl.includes('tab=my_referrals')) {
        setAlumniActiveTab('my_referrals');
      } else if (actionUrl.includes('tab=leaderboard')) {
        setAlumniActiveTab('leaderboard');
      } else {
        setAlumniActiveTab('overview');
      }
    } else {
      // Seeker navigation
      if (actionUrl.includes('tab=referral_board')) {
        setActiveTab('referral_board');
      } else if (actionUrl.includes('tab=my_referrals')) {
        setActiveTab('my_referrals');
      } else if (actionUrl.includes('tab=messages') || notif.type === 'message_received') {
        setActiveTab('messages');
        if (notif.metadata?.senderId) {
          setActiveChatId(notif.metadata.senderId);
        } else if (notif.metadata?.alumniId) {
          setActiveChatId(notif.metadata.alumniId);
        }
      } else if (actionUrl.includes('tab=leaderboard')) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  // Load all initial data on mount
  useEffect(() => {
    fetchProfile();
    fetchAlumni();
    fetchRequests();
    fetchConversations();
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchProfile, fetchAlumni, fetchRequests, fetchConversations, fetchNotifications, fetchUnreadCount]);

  // Background polling to auto-refresh data periodically (robust fallback/sync)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfile();
      fetchRequests();
      fetchConversations();
      fetchNotifications();
      fetchUnreadCount();
      if (activeChatId !== null) {
        fetchChatHistory(activeChatId);
      }
    }, 10000); // sync every 10 seconds

    return () => clearInterval(interval);
  }, [fetchProfile, fetchRequests, fetchConversations, fetchNotifications, fetchUnreadCount, activeChatId, fetchChatHistory]);

  // Trigger history fetching when activeChatId changes
  useEffect(() => {
    if (activeChatId !== null) {
      fetchChatHistory(activeChatId);

      // Find and mark unread message notifications from this activeChatId as read
      const unreadNotifsFromSender = notificationsRef.current.filter((notif: any) => 
        !notif.isRead && 
        notif.type === 'message_received' && 
        notif.metadata && 
        Number(notif.metadata.senderId) === activeChatId
      );

      if (unreadNotifsFromSender.length > 0) {
        const token = localStorage.getItem('token');
        Promise.all(unreadNotifsFromSender.map((notif: any) => 
          fetch(`${API_BASE_URL}/api/notifications/${notif.id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )).then(() => {
          fetchUnreadCount();
          fetchNotifications();
        }).catch(err => console.error("Error clearing notifications for chat:", err));
      }
    }
  }, [activeChatId, fetchChatHistory, fetchUnreadCount, fetchNotifications]);

  // Connect Socket.IO
  useEffect(() => {
    const socketInstance = io(API_BASE_URL, {
      query: { userId: id }
    });

    socketInstance.on('message', (msg: any) => {
      // Find partner ID from msg
      const partnerId = msg.senderId === id ? msg.receiverId : msg.senderId;

      setChatMessages(prev => {
        const currentList = prev[partnerId] || [];
        if (currentList.some((m: any) => m.id === msg.id)) {
          return prev;
        }
        const formattedMsg = {
          id: msg.id,
          sender: msg.senderId === id ? 'seeker' as const : 'alumni' as const,
          text: msg.text,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...prev,
          [partnerId]: [...currentList, formattedMsg]
        };
      });

      // Reload conversations listing
      fetchConversations();
      // Reload requests to see status changes if system message triggers it
      fetchRequests();
    });

    socketInstance.on('new_request', (reqData: any) => {
      if (role === 'alumni') {
        setRequests(prev => {
          if (prev.some((r: any) => r.id === reqData.id)) {
            return prev;
          }
          const resumeNameVal = reqData.resumeName || reqData.seeker?.resumeName || '';
          const normalizedReq = {
            ...reqData,
            resumeName: resumeNameVal,
            resumeUploaded: Boolean(resumeNameVal || reqData.resumeUploaded || reqData.seeker?.resumeUploaded),
            date: reqData.date || (reqData.createdAt ? new Date(reqData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
            createdAt: reqData.createdAt || new Date().toISOString()
          };
          return [normalizedReq, ...prev];
        });
      }
    });

    socketInstance.on('request_status_update', (data: any) => {
      if (role === 'seeker') {
        setRequestsList(prev => prev.map(r => r.id === data.id ? { ...r, status: data.status } : r));
      }
    });

    socketInstance.on('notification', (notif: any) => {
      // Suppress notification if talking live with the sender
      const currentActiveTab = role === 'alumni' ? alumniActiveTabRef.current : activeTabRef.current;
      const isTalkingLive = currentActiveTab === 'messages' && 
                           notif.type === 'message_received' && 
                           notif.metadata && 
                           Number(notif.metadata.senderId) === activeChatIdRef.current;

      if (isTalkingLive) {
        // Silently mark as read on the backend
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error("Error marking live notification as read:", err));
        
        return;
      }

      fetchUnreadCount();
      fetchNotifications();
      setActiveToast(notif);
      if (notif.type === 'new_referral') {
        setReferralTrigger(prev => prev + 1);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [id, role, fetchConversations, fetchRequests, fetchNotifications, fetchUnreadCount]);

  // Auto-clear active toast notifications after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Auto-clear referral request success toast after 5 seconds
  useEffect(() => {
    if (requestSuccessData) {
      const timer = setTimeout(() => {
        setRequestSuccessData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [requestSuccessData]);

  // Seeker submits referral request
  const submitReferralRequest = async () => {
    if (!alumniForRequest) return;
    if (referralCreditsRemaining <= 0) {
      setIsOutOfCreditsModalOpen(true);
      setIsRequestModalOpen(false);
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alumniId: alumniForRequest.id,
          targetRole,
          timeline,
          pitchMessage,
          location: 'Remote'
        })
      });
      if (res.ok) {
        setReferralCreditsRemaining(prev => Math.max(0, prev - 1));
        fetchRequests();
        setIsRequestModalOpen(false);
        setActiveTab('my_referrals');
        setRequestSuccessData({
          alumniName: alumniForRequest.name,
          company: alumniForRequest.company,
          role: targetRole
        });
      }
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  };

  // Seeker sends chat message
  const handleSendMessage = async () => {
    if (!newMessageText.trim() || activeChatId === null) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeChatId,
          text: newMessageText
        })
      });
      if (res.ok) {
        const data = await res.json();
        const formattedMsg = {
          id: data.id,
          sender: 'seeker' as const,
          text: newMessageText,
          time: 'Now'
        };
        setChatMessages(prev => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), formattedMsg]
        }));
        setNewMessageText('');
        fetchConversations();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Seeker schedules call
  const handleScheduleCall = async (topic?: string, duration?: string) => {
    if (activeChatId === null) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeChatId,
          date: scheduledDate,
          time: scheduledTime,
          topic,
          duration
        })
      });
      if (res.ok) {
        const data = await res.json();
        const callMsg = {
          id: data.id,
          sender: 'seeker' as const,
          text: data.text,
          time: 'Now'
        };
        setChatMessages(prev => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), callMsg]
        }));
        setIsSchedulerOpen(false);
        fetchConversations();
      }
    } catch (err) {
      console.error("Error scheduling call:", err);
    }
  };

  // Profile Save helper
  const handleSaveProfile = async (updatedFields: any) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        setProfileName(data.name);
        setProfileCollege(data.college);
        if (data.role === 'seeker') {
          setProfileYear(data.year);
          setProfileBranch(data.branch);
          setBio(data.bio);
          setGithubUrl(data.githubUrl);
          setLinkedinUrl(data.linkedinUrl);
          setSkills(data.skills);
          setSkillDetails(data.skillDetails);
          setTargetCompanies(data.targetCompanies);
          setProfileTargetRole(data.targetRole || 'Software Engineer');
          setResumeUploaded(data.resumeUploaded);
          setResumeName(data.resumeName);
          setResumesHistory(data.resumesHistory || []);
          setReferralCreditsRemaining(data.referralCreditsRemaining !== undefined ? data.referralCreditsRemaining : 5);
          setMonthlyReferralLimit(data.monthlyReferralLimit !== undefined ? data.monthlyReferralLimit : 5);
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handleSetResumeNameAndUploaded = async (name: string, uploaded: boolean) => {
    setResumeName(name);
    setResumeUploaded(uploaded);
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          college: profileCollege,
          year: profileYear,
          branch: profileBranch,
          bio,
          githubUrl,
          linkedinUrl,
          skills,
          skillDetails,
          targetCompanies,
          targetRole: profileTargetRole,
          resumeUploaded: uploaded,
          resumeName: name
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        setResumesHistory(data.resumesHistory || []);
      }
    } catch (err) {
      console.error("Error auto-saving resume name:", err);
    }
  };

  // Wrapped edit mode toggler to auto-save to DB
  const toggleEditMode = (mode: boolean) => {
    if (isEditMode && !mode) {
      handleSaveProfile({
        name: profileName,
        college: profileCollege,
        year: profileYear,
        branch: profileBranch,
        bio,
        githubUrl,
        linkedinUrl,
        skills,
        skillDetails,
        targetCompanies,
        targetRole: profileTargetRole,
        resumeUploaded,
        resumeName,
        resumesHistory
      });
    }
    setIsEditMode(mode);
  };

  // Alumni updates request status (refer/info/decline/accept)
  const handleAction = async (requestId: number, action: 'referred' | 'info' | 'declined' | 'accepted') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });
      if (res.ok) {
        fetchRequests();
        fetchProfile(); // update referrals metrics count
      }
    } catch (err) {
      console.error("Error processing request action:", err);
    }
  };

  const handleAddCompany = () => {
    if (newCompanyInput.trim() && !targetCompanies.includes(newCompanyInput.trim())) {
      setTargetCompanies([...targetCompanies, newCompanyInput.trim()]);
      setNewCompanyInput('');
    }
  };

  const handleRemoveCompany = (c: string) => {
    setTargetCompanies(targetCompanies.filter(item => item !== c));
  };

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      const name = newSkillInput.trim();
      setSkills([...skills, name]);
      setSkillDetails(prev => ({
        ...prev,
        [name]: { proficiency: 3, type: 'technical' }
      }));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (s: string) => {
    setSkills(skills.filter(item => item !== s));
    setSkillDetails(prev => {
      const copy = { ...prev };
      delete copy[s];
      return copy;
    });
  };

  // Seeker writes request note AI Pitch Validation
  useEffect(() => {
    if (pitchMessage.trim().length === 0) {
      setAiTipWarning('');
    } else if (pitchMessage.trim().length < 60) {
      setAiTipWarning('🚨 Message is too generic or short. Mention a specific project or achievement to improve response rate.');
    } else if (!pitchMessage.toLowerCase().includes('project') && !pitchMessage.toLowerCase().includes('build')) {
      setAiTipWarning('💡 AI Suggestion: Mentioning a specific technical project or link to GitHub would make this request 2x more compelling.');
    } else {
      setAiTipWarning('');
    }
  }, [pitchMessage]);

  // Derived Profile Completion Percentage
  const getProfileCompletion = () => {
    let score = 30; // base
    if (resumeUploaded) score += 20;
    if (targetCompanies.length >= 3) score += 20;
    if (skills.length >= 4) score += 25;
    if (bio.length > 20) score += 5;
    return score;
  };

  // Seeker: Filtered Alumni List (Discover Screen)
  const getFilteredAlumni = () => {
    let list = [...alumniNetwork];
    
    const targetCollege = profileCollege || college;
    if (targetCollege) {
      list = list.filter(a => a.college.toLowerCase() === targetCollege.toLowerCase());
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.company.toLowerCase().includes(q) || 
        a.role.toLowerCase().includes(q) || 
        a.college.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q)
      );
    }
    
    if (selectedCompanyFilter !== 'All') {
      list = list.filter(a => a.company === selectedCompanyFilter);
    }
    
    if (selectedRoleFilter !== 'All') {
      list = list.filter(a => a.role.toLowerCase().includes(selectedRoleFilter.toLowerCase()));
    }
    
    if (availabilityFilter === 'Available Now') {
      list = list.filter(a => a.available || a.availability === 'Available Now');
    } else if (availabilityFilter === 'Open to chat') {
      list = list.filter(a => a.available || a.availability === 'Available Now');
    }

    if (aiMatchToggle) {
      list.sort((a, b) => b.match - a.match);
    }

    return list;
  };

  // Open referral request modal
  const openRequestModal = (alumni: any) => {
    if (referralCreditsRemaining <= 0) {
      setIsOutOfCreditsModalOpen(true);
      return;
    }
    setAlumniForRequest(alumni);
    setPitchMessage('');
    setIsRequestModalOpen(true);
  };

  if (role === 'seeker') {
    const seekerSidebarItems = [
      { id: 'dashboard',      label: 'Dashboard',      icon: Home,          badge: null },
      { id: 'referral_board', label: 'Referral Board', icon: Newspaper,     badge: null },
      { id: 'network',        label: 'Network',        icon: Search,        badge: null },
      { id: 'my_referrals',   label: 'My Referrals',  icon: Send,          badge: null },
      { id: 'career_intelligence', label: 'AI Coach',  icon: Sparkles,      badge: null },
      { id: 'messages',       label: 'Messages',       icon: MessageSquare, badge: null },
      { id: 'saved',          label: 'Saved',          icon: Bookmark,      badge: savedAlumniIds.length > 0 ? savedAlumniIds.length : null },
      { id: 'accounting',     label: 'Accounting',     icon: ShieldCheck,   badge: null },
    ];

    const seekerBottomNavItems = [
      { id: 'dashboard',      label: 'Home',       icon: Home },
      { id: 'referral_board', label: 'Board',      icon: Newspaper },
      { id: 'network',        label: 'Search',     icon: Search },
      { id: 'my_referrals',   label: 'Referrals',  icon: Send },
      { id: 'career_intelligence', label: 'AI Coach',  icon: Sparkles },
      { id: 'messages',       label: 'Chat',       icon: MessageSquare },
      { id: 'saved',          label: 'Saved',      icon: Bookmark },
      { id: 'accounting',     label: 'Security',   icon: ShieldCheck },
      { id: 'profile',        label: 'Profile',    icon: User },
    ];

    const referralCredits = {
      remaining: referralCreditsRemaining,
      limit: monthlyReferralLimit,
      nextResetDate: getNextResetDate(),
    };

    return (
      <AppLayout
        sidebar={
          <Sidebar
            items={seekerSidebarItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab as any}
            role="seeker"
            profileName={profileName}
            profileCollegeOrCompany={profileCollege}
            onLogout={onLogout}
            referralCredits={referralCredits}
          />
        }
        mobileNav={
          <MobileSidebar
            items={seekerBottomNavItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab as any}
            role="seeker"
          />
        }
      >
        <div className="flex flex-col relative z-20 w-full min-h-full">
          <header className="border-b border-white/[0.055] bg-[#050508]/85 backdrop-blur-xl shrink-0 sticky top-0 z-20 w-full">
            <div className="px-4 md:px-8 py-4 flex items-center justify-between text-left w-full max-w-[1440px] xl:max-w-[1600px] 3xl:max-w-[2000px] 4xl:max-w-[2400px] mx-auto">
              <div className="min-w-0">
                <h2 className="font-sora text-white text-sm font-extrabold leading-tight truncate max-w-[180px] xs:max-w-[250px] sm:max-w-[400px] md:max-w-none">
                  {activeTab === 'dashboard'      && <>{`${getGreeting()}, ${profileName.split(' ')[0]} 👋`}</>}
                  {activeTab === 'referral_board' && 'Referral Board'}
                  {activeTab === 'network'        && 'Discover Network'}
                  {activeTab === 'my_referrals'   && 'My Referrals'}
                  {activeTab === 'career_intelligence' && 'AI Career Coach'}
                  {activeTab === 'messages'       && 'Outreach Messages'}
                  {activeTab === 'saved'          && 'Saved Mentors'}
                  {activeTab === 'accounting'     && 'Accounting'}
                  {activeTab === 'profile'        && 'My Profile'}
                </h2>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5 truncate max-w-[180px] xs:max-w-[250px] sm:max-w-[400px] md:max-w-none">{profileCollege} · Seeker Dashboard</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsNotificationDrawerOpen(true);
                    fetchNotifications();
                    fetchUnreadCount();
                  }}
                  className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-350 hover:text-white hover:border-white/20 transition duration-200 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-purple-500 text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {/* Profile completion badge removed */}
              </div>
            </div>
          </header>
          <div className="flex-1 p-6 md:p-8 w-full max-w-[1440px] xl:max-w-[1600px] 3xl:max-w-[2000px] 4xl:max-w-[2400px] mx-auto">
            {activeTab === 'career_intelligence' && (
              <CareerIntelligenceTab currentUser={currentUser} fetchProfile={fetchProfile} />
            )}
            {activeTab === 'dashboard' && (
              <>
                {!isProfileComplete && (
                  <div className="mb-6 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-medium text-slate-350 leading-relaxed text-left">
                        Your onboarding profile is incomplete. Complete it now to build trust and unlock career referrals.
                      </span>
                    </div>
                    <button
                      onClick={onOpenOnboarding}
                      className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-black uppercase tracking-wider transition shrink-0 shadow-lg shadow-yellow-500/10 cursor-pointer"
                    >
                      Complete Profile
                    </button>
                  </div>
                )}
                <DashboardTab
                  requestsList={requestsList}
                  savedAlumniIds={savedAlumniIds}
                  alumniNetwork={alumniNetwork}
                  setActiveTab={setActiveTab as any}
                  openRequestModal={openRequestModal}
                />
              </>
            )}
            {activeTab === 'referral_board' && (
              <ReferralNewsPanel
                seekerId={id}
                resumeName={resumeName}
                alumniNetwork={alumniNetwork}
                setSelectedAlumni={setSelectedAlumni}
                setActiveTab={setActiveTab as any}
                fetchProfile={fetchProfile}
                fetchRequests={fetchRequests}
                refreshTrigger={referralTrigger}
                requestsList={requestsList}
              />
            )}
            {activeTab === 'network' && (
              <DiscoverTab
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                availabilityFilter={availabilityFilter}
                setAvailabilityFilter={setAvailabilityFilter}
                aiMatchToggle={aiMatchToggle}
                setAiMatchToggle={setAiMatchToggle}
                savedAlumniIds={savedAlumniIds}
                setSavedAlumniIds={setSavedAlumniIds}
                openRequestModal={openRequestModal}
                getFilteredAlumni={getFilteredAlumni}
                alumniNetwork={alumniNetwork}
                selectedAlumni={selectedAlumni}
                setSelectedAlumni={setSelectedAlumni}
                isRequestModalOpen={isRequestModalOpen}
                setIsRequestModalOpen={setIsRequestModalOpen}
                alumniForRequest={alumniForRequest}
                targetRole={targetRole}
                setTargetRole={setTargetRole}
                timeline={timeline}
                setTimeline={setTimeline}
                pitchMessage={pitchMessage}
                setPitchMessage={setPitchMessage}
                aiTipWarning={aiTipWarning}
                resumeName={resumeName}
                submitReferralRequest={submitReferralRequest}
                selectedCompanyFilter={selectedCompanyFilter}
                setSelectedCompanyFilter={setSelectedCompanyFilter}
                selectedRoleFilter={selectedRoleFilter}
                setSelectedRoleFilter={setSelectedRoleFilter}
                setActiveTab={setActiveTab as any}
                setActiveChatId={setActiveChatId}
                referralCreditsRemaining={referralCreditsRemaining}
                monthlyReferralLimit={monthlyReferralLimit}
                requestsList={requestsList}
              />
            )}
            {activeTab === 'my_referrals' && (
              <RequestsTab
                trackerFilter={trackerFilter}
                setTrackerFilter={setTrackerFilter}
                requestsList={requestsList}
                expandedRequest={expandedRequest}
                setExpandedRequest={setExpandedRequest}
                resumeName={resumeName}
                setActiveTab={setActiveTab as any}
                setActiveChatId={setActiveChatId}
                setSelectedCompanyFilter={setSelectedCompanyFilter}
                fetchRequests={fetchRequests}
                alumniNetwork={alumniNetwork}
                setSelectedAlumni={setSelectedAlumni}
              />
            )}
            {activeTab === 'accounting' && (
              <div className="space-y-6 text-left animate-fade-in-up">
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
                  <h3 className="font-sora text-white font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                    Seeker Billing & Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div>
                        <span className="block text-xs font-bold text-white font-space-grotesk">Verification Status</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Academic domain verification level</span>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-space-grotesk">
                        ● VERIFIED STUDENT DOMAIN
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div>
                        <span className="block text-xs font-bold text-white font-space-grotesk">Active Plan</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Free student placement program</span>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-[9px] font-black bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-widest font-space-grotesk">
                        NIC ESSENTIALS
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div>
                        <span className="block text-xs font-bold text-white font-space-grotesk">Network Transparency Settings</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Prioritize matching scores on search view</span>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-[9px] font-black bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 uppercase tracking-widest font-space-grotesk">
                        ACTIVE (RESTRICT OFF)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'messages' && (
              <MessagesTab
                activeChatId={activeChatId}
                setActiveChatId={setActiveChatId}
                chatMessages={chatMessages}
                newMessageText={newMessageText}
                setNewMessageText={setNewMessageText}
                handleSendMessage={handleSendMessage}
                isSchedulerOpen={isSchedulerOpen}
                setIsSchedulerOpen={setIsSchedulerOpen}
                scheduledDate={scheduledDate}
                setScheduledDate={setScheduledDate}
                scheduledTime={scheduledTime}
                setScheduledTime={setScheduledTime}
                handleScheduleCall={handleScheduleCall}
                alumniNetwork={alumniNetwork}
                conversations={conversations}
                role={role}
                requestsList={requestsList}
              />
            )}
            {activeTab === 'saved' && (
              <SavedTab
                savedAlumniIds={savedAlumniIds}
                alumniNetwork={alumniNetwork}
                setSavedAlumniIds={setSavedAlumniIds}
                openRequestModal={openRequestModal}
                setSelectedAlumni={setSelectedAlumni}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab
                currentUser={currentUser}
                fetchProfile={fetchProfile}
                isEditMode={isEditMode}
                setIsEditMode={toggleEditMode as any}
                profileName={profileName}
                setProfileName={setProfileName}
                profileCollege={profileCollege}
                setProfileCollege={setProfileCollege}
                profileYear={profileYear}
                setProfileYear={setProfileYear}
                profileBranch={profileBranch}
                setProfileBranch={setProfileBranch}
                bio={bio}
                setBio={setBio}
                githubUrl={githubUrl}
                setGithubUrl={setGithubUrl}
                linkedinUrl={linkedinUrl}
                setLinkedinUrl={setLinkedinUrl}
                skills={skills}
                newSkillInput={newSkillInput}
                setNewSkillInput={setNewSkillInput}
                handleAddSkill={handleAddSkill}
                handleRemoveSkill={handleRemoveSkill}
                skillDetails={skillDetails}
                setSkillDetails={setSkillDetails}
                targetCompanies={targetCompanies}
                newCompanyInput={newCompanyInput}
                setNewCompanyInput={setNewCompanyInput}
                handleAddCompany={handleAddCompany}
                handleRemoveCompany={handleRemoveCompany}
                userId={id}
                resumeUploaded={resumeUploaded}
                setResumeUploaded={(uploaded) => handleSetResumeNameAndUploaded(resumeName, uploaded)}
                resumeName={resumeName}
                setResumeName={(name) => handleSetResumeNameAndUploaded(name, true)}
                resumesHistory={resumesHistory}
                setResumesHistory={setResumesHistory}
                targetRole={profileTargetRole}
                setTargetRole={setProfileTargetRole}
                setSkills={setSkills}
                setTargetCompanies={setTargetCompanies}

                hoveredSkill={hoveredSkill}
                setHoveredSkill={setHoveredSkill}
                privacyCollegeOnly={privacyCollegeOnly}
                setPrivacyCollegeOnly={setPrivacyCollegeOnly}
                savedAlumniIds={savedAlumniIds}
                requestsList={requestsList}
                getProfileCompletion={getProfileCompletion}
                onLogout={onLogout}
              />
            )}
          </div>
        </div>

        {/* ── Notification Drawer (Right Side Slide-out) ── */}
        {isNotificationDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setIsNotificationDrawerOpen(false)}
            />
            {/* Drawer Body */}
            <div className="relative w-full max-w-sm h-full bg-[#08080d]/95 border-l border-white/[0.08] backdrop-blur-xl shadow-2xl flex flex-col z-10 animate-slide-in-right p-6 text-left">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <h3 className="font-sora text-sm font-extrabold text-white">Notifications</h3>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider transition-colors mr-2 cursor-pointer"
                    >
                      Read All
                    </button>
                  )}
                  <button 
                    onClick={() => setIsNotificationDrawerOpen(false)}
                    className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white border border-white/5 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-8 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-20 space-y-2 text-slate-550">
                    <Bell className="w-8 h-8 mx-auto text-slate-600 opacity-40 animate-pulse" />
                    <p className="text-xs font-semibold">All caught up!</p>
                    <p className="text-[10px] text-slate-650">No new notifications at this time.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnread = !notif.isRead;
                    // Icon mapping
                    const iconMap: Record<string, string> = {
                      new_referral: '💼',
                      referral_received: '📬',
                      referral_accepted: '✅',
                      referral_declined: '❌',
                      referral_referred: '🎉',
                      referral_info: '💬',
                      meeting_scheduled: '📅',
                      system: '🔔',
                      referral_rated: '⭐',
                    };
                    const typeIcon = iconMap[notif.type] || '🔔';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          handleNotificationNavigation(notif);
                          setIsNotificationDrawerOpen(false);
                        }}
                        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left relative overflow-hidden group ${
                          isUnread
                            ? 'bg-purple-500/5 border-purple-500/15 hover:border-purple-500/25'
                            : 'bg-white/2 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {isUnread && (
                          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-purple-400" />
                        )}
                        <div className="flex gap-3">
                          <span className="text-base shrink-0 select-none mt-0.5">{typeIcon}</span>
                          <div className="space-y-1">
                            <h4 className="font-sora text-xs font-bold text-white group-hover:text-purple-300 transition-colors leading-tight">
                              {notif.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-normal font-medium">
                              {notif.message}
                            </p>
                            <span className="block text-[8px] text-slate-550 font-medium">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Floating Toast Popup (Top Right Corner) ── */}
        {activeToast && (
          <div 
            onClick={() => {
              handleNotificationNavigation(activeToast);
              setActiveToast(null);
            }}
            className="fixed top-6 right-6 z-[60] w-72 bg-[#09090f]/95 border border-purple-500/30 backdrop-blur-md rounded-xl p-3 shadow-[0_8px_32px_rgba(168,85,247,0.2)] flex items-center justify-between gap-3 animate-slide-in-right cursor-pointer hover:border-purple-500/50 transition-all duration-300 select-none group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm shrink-0">{activeToast.type === 'new_referral' ? '💼' : '🔔'}</span>
              <div className="min-w-0">
                <span className="block text-[9px] font-bold text-purple-400 uppercase tracking-wide leading-none">
                  {activeToast.type === 'new_referral' ? 'New Referral Live' : activeToast.title}
                </span>
                <span className="block text-[11px] font-semibold text-white truncate mt-1 leading-tight group-hover:text-purple-300 transition-colors">
                  {activeToast.type === 'new_referral' && activeToast.metadata
                    ? `${activeToast.metadata.role} @ ${activeToast.metadata.company}`
                    : activeToast.message}
                </span>
              </div>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ── Referral Request Success Toast (Downside) ── */}
        {requestSuccessData && (
          <div className="fixed bottom-6 right-6 z-[60] max-w-sm w-full bg-[#09090f]/90 border border-purple-500/30 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-slide-up flex items-center gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-sora text-xs font-bold text-white">Referral Request Sent!</h4>
              <p className="text-[10px] text-slate-400 truncate">
                Requested {requestSuccessData.role} from {requestSuccessData.alumniName} at {requestSuccessData.company}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequestSuccessData(null)}
              className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Out of Credits Modal */}
        {isOutOfCreditsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div 
              className="w-full max-w-md bg-[#07070a] border border-red-500/20 p-6 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.1)] relative text-left animate-modal-scale-in"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsOutOfCreditsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white border border-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center space-y-4 pt-2">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-sora text-sm font-extrabold text-white uppercase tracking-wider">
                    Referral Credits Exhausted
                  </h3>
                  <p className="text-[11px] text-slate-450 leading-relaxed max-w-xs mx-auto">
                    You have utilized all of your <strong className="text-white">{monthlyReferralLimit}/{monthlyReferralLimit} monthly referral credits</strong>. Submitting new requests is locked until the next billing cycle.
                  </p>
                </div>
                
                <div className="p-3.5 rounded-xl bg-red-950/10 border border-red-500/10 text-left space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">Reset Cycle</span>
                    <span className="text-red-400 font-bold font-mono">{getNextResetDate()}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 leading-normal border-t border-white/5 pt-2">
                    Credits prevent platform spam and ensure alumni receive high-quality requests. You can still message existing accepted contacts or view active alumni.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOutOfCreditsModalOpen(false);
                      setActiveTab('messages');
                    }}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-650 hover:opacity-95 text-white font-sora font-bold text-[10px] uppercase tracking-wider transition shadow-md"
                  >
                    Go to Chats
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOutOfCreditsModalOpen(false)}
                    className="py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-350 hover:text-white font-sora font-bold text-[10px] uppercase tracking-wider transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  // -- RENDER ALUMNI PORTAL --
  return (
    <AlumniDashboard
      name={profileName}
      college={profileCollege}
      company={company}
      onLogout={onLogout}
      referralsSentCount={referralsSentCount}
      requests={requests}
      handleAction={handleAction}
      activeChatId={activeChatId}
      setActiveChatId={setActiveChatId}
      chatMessages={chatMessages}
      newMessageText={newMessageText}
      setNewMessageText={setNewMessageText}
      handleSendMessage={handleSendMessage}
      isSchedulerOpen={isSchedulerOpen}
      setIsSchedulerOpen={setIsSchedulerOpen}
      scheduledDate={scheduledDate}
      setScheduledDate={setScheduledDate}
      scheduledTime={scheduledTime}
      setScheduledTime={setScheduledTime}
      handleScheduleCall={handleScheduleCall}
      conversations={conversations}
      alumniNetwork={alumniNetwork}
      currentUser={currentUser}
      fetchProfile={fetchProfile}
      onTabChange={setAlumniActiveTab}
      isProfileComplete={isProfileComplete}
      onOpenOnboarding={onOpenOnboarding}
      unreadCount={unreadCount}
      onOpenNotifications={() => {
        setIsNotificationDrawerOpen(true);
        fetchNotifications();
      }}
    />
  );
};
