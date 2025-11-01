import React, { useState, useRef } from 'react';
import { User } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Label from '../common/Label';
import { useToast } from '../../hooks/useToast';
import Icon from '../common/Icon';

interface ProfilePageProps {
    user: User;
    onUpdateUser: (updatedUser: Partial<User>) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ avatarUrl: reader.result as string });
        addToast({ type: 'success', message: 'Profile photo updated!' });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-card-foreground mb-8">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card className="text-center p-6">
            <div className="relative inline-block">
              <img src={user.avatarUrl} alt={user.name} className="h-36 w-36 rounded-full mb-4 mx-auto ring-4 ring-primary/20" />
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            <h2 className="text-3xl font-semibold mt-2">{user.name}</h2>
            <p className="text-muted-foreground text-lg">{user.role}</p>
            <p className="text-muted-foreground mt-1">{user.email}</p>
            <Button onClick={handleAvatarClick} variant="secondary" className="mt-4 w-full">
                <Icon name="camera" className="w-4 h-4 mr-2" />
                Change Photo
            </Button>
          </Card>
        </div>
        <div className="lg:col-span-2">
           <ProfileForms user={user} onUpdateUser={onUpdateUser} />
        </div>
      </div>
    </div>
  );
};


// Main component for forms
const ProfileForms: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    return (
        <Card bodyClassName="p-0">
            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-6 px-6">
                    <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-base transition-colors ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        Personal Information
                    </button>
                     <button onClick={() => setActiveTab('password')} className={`py-4 px-1 border-b-2 font-medium text-base transition-colors ${activeTab === 'password' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        Change Password
                    </button>
                </nav>
            </div>
             <div className="p-6">
              {activeTab === 'profile' && <ProfileInfoForm user={user} onUpdateUser={onUpdateUser} />}
              {activeTab === 'password' && <ChangePasswordForm />}
            </div>
        </Card>
    );
};


// Sub-component for profile info form
const ProfileInfoForm: React.FC<{ user: User, onUpdateUser: (updatedUser: Partial<User>) => void }> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const { addToast } = useToast();

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser({ name, email });
        addToast({ type: 'success', message: 'Profile updated successfully!' });
    };

    return (
        <form className="space-y-6" onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end pt-4">
                 <Button type="submit">Save Changes</Button>
            </div>
        </form>
    );
};

// Sub-component for change password form
const ChangePasswordForm: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { addToast } = useToast();
    
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
             addToast({ type: 'error', message: 'New password must be at least 8 characters.' });
             return;
        }
        if (newPassword !== confirmPassword) {
            addToast({ type: 'error', message: 'New passwords do not match.' });
            return;
        }
        // In real app, verify currentPassword
        console.log('Password changed');
        addToast({ type: 'success', message: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <form className="space-y-6" onSubmit={handlePasswordChange}>
            <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">Update Password</Button>
            </div>
        </form>
    );
};


export default ProfilePage;