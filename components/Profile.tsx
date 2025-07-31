
import React, { useState, useEffect, useRef } from 'react';
import { Teammate } from '../types';
import { Card } from './ui/Card';
import { ICONS } from '../constants';
import { Modal } from './ui/Modal';

interface ProfileProps {
  currentUser: Teammate;
  onUpdateProfile: (teammate: Teammate) => void;
  onChangePassword: (teammateId: string, oldPass: string, newPass: string) => { success: boolean, message: string };
  onRequestRoleChange: (newRole: string, justification: string) => void;
  roles: string[];
}

export const Profile: React.FC<ProfileProps> = ({ currentUser, onUpdateProfile, onChangePassword, onRequestRoleChange, roles }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [profileData, setProfileData] = useState<Teammate>(currentUser);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [infoMessage, setInfoMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleChangeData, setRoleChangeData] = useState({ newRole: '', justification: '' });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileData(currentUser);
  }, [currentUser]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedProfile = { ...profileData, avatar: reader.result as string };
        setProfileData(updatedProfile);
        onUpdateProfile(updatedProfile);
        setInfoMessage({ type: 'success', text: 'Profile picture updated!' });
        setTimeout(() => setInfoMessage({ type: '', text: '' }), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileData);
    setInfoMessage({ type: 'success', text: 'Profile updated successfully!' });
    setTimeout(() => setInfoMessage({ type: '', text: '' }), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (passwordData.new !== passwordData.confirm) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (!passwordData.new) {
       setPasswordMessage({ type: 'error', text: 'New password cannot be empty.' });
       return;
    }
    const result = onChangePassword(currentUser.id, passwordData.current, passwordData.new);
    if (result.success) {
      setPasswordMessage({ type: 'success', text: result.message });
      setPasswordData({ current: '', new: '', confirm: '' });
    } else {
      setPasswordMessage({ type: 'error', text: result.message });
    }
  };

  const handleRoleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestRoleChange(roleChangeData.newRole, roleChangeData.justification);
    setInfoMessage({ type: 'success', text: 'Role change requested. Pending CEO approval.' });
    setRoleModalOpen(false);
    setRoleChangeData({ newRole: '', justification: ''});
    setTimeout(() => setInfoMessage({ type: '', text: '' }), 4000);
  };

  const assignableRoles = roles.filter(r => r !== 'CEO' && r !== currentUser.role);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-white mb-6">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center">
            <div className="relative w-32 h-32 mx-auto group">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt={profileData.name} className="w-full h-full rounded-full object-cover border-4 border-gray-700" />
              ) : (
                <div className="w-full h-full bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-5xl border-4 border-gray-700">
                  {profileData.name.charAt(0)}
                </div>
              )}
              <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {ICONS.edit}
              </button>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            </div>
            <h2 className="text-2xl font-bold text-white mt-4">{profileData.name}</h2>
            <p className="text-gray-400">{profileData.role}</p>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <Card>
            <div className="border-b border-gray-700">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('info')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                  Personal Info
                </button>
                <button onClick={() => setActiveTab('security')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'security' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                  Security
                </button>
                 <button onClick={() => setActiveTab('role')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'role' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                  Role Management
                </button>
              </nav>
            </div>

            <div className="py-6">
              {activeTab === 'info' && (
                <form onSubmit={handleInfoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                      <input type="text" name="name" value={profileData.name} onChange={handleInfoChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                      <input type="email" name="email" value={profileData.email || ''} onChange={handleInfoChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                      <input type="tel" name="phone" value={profileData.phone || ''} onChange={handleInfoChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Join Date</label>
                      <input type="text" value={new Date(profileData.joinDate).toLocaleDateString()} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-400" readOnly disabled />
                    </div>
                  </div>
                  <div className="flex items-center justify-end pt-4 space-x-4">
                    {infoMessage.text && <p className={`${infoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'} text-sm`}>{infoMessage.text}</p>}
                    <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-lg">Save Changes</button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                  <h3 className="text-lg font-medium leading-6 text-white">Change password</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                    <input type="password" name="current" value={passwordData.current} onChange={handlePasswordChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                    <input type="password" name="new" value={passwordData.new} onChange={handlePasswordChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                    <input type="password" name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                  </div>
                   <div className="flex items-center justify-end pt-4 space-x-4">
                    {passwordMessage.text && <p className={`${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'} text-sm`}>{passwordMessage.text}</p>}
                    <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-lg">Update Password</button>
                  </div>
                </form>
              )}

              {activeTab === 'role' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium leading-6 text-white">Designation</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Current Role</label>
                        <p className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-200">{currentUser.role}</p>
                    </div>
                     <div className="flex items-center justify-end pt-4 space-x-4">
                        {infoMessage.text && <p className={`${infoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'} text-sm`}>{infoMessage.text}</p>}
                        <button onClick={() => setRoleModalOpen(true)} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-lg" disabled={currentUser.role === 'CEO'}>
                            Request Role Change
                        </button>
                     </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      <Modal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Request Role Change">
        <form onSubmit={handleRoleChangeSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Role</label>
                <select 
                    name="newRole" 
                    value={roleChangeData.newRole} 
                    onChange={e => setRoleChangeData(p => ({...p, newRole: e.target.value}))}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600" 
                    required
                >
                    <option value="" disabled>Select new role</option>
                    {assignableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Justification</label>
                <textarea 
                    name="justification"
                    value={roleChangeData.justification}
                    onChange={e => setRoleChangeData(p => ({...p, justification: e.target.value}))}
                    placeholder="Explain why this role change is needed..." 
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 min-h-[100px]" 
                    required 
                ></textarea>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Submit Request</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};