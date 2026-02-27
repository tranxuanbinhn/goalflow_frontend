import { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, applyTheme } from '../store/themeStore';
import { settingsAPI, authAPI } from '../services/api';
import { Sun, Moon, Lock } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [settings, setSettings] = useState({
    dailyGoal: 5,
    pomodoroWork: 25,
    pomodoroBreak: 5,
    soundEnabled: true,
    theme: 'dark',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateSettings(settings);
    } catch (error) {
      console.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignore
    }
    logout();
    window.location.href = '/login';
  };

  const handleThemeToggle = () => {
    toggleTheme();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    setSettings({ ...settings, theme: newTheme });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Customize your experience</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-black/[0.05] dark:bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Profile */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-2xl font-medium">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-text-primary font-medium">{user?.name}</p>
                <p className="text-text-secondary">{user?.email}</p>
              </div>
            </div>
          </GlassCard>

          {/* Appearance */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary">Theme</p>
                <p className="text-text-secondary text-sm">Switch between light and dark mode</p>
              </div>
              <button
                onClick={handleThemeToggle}
                className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 justify-end' 
                    : 'bg-primary-500 justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  {theme === 'dark' ? (
                    <Moon size={14} className="text-gray-700" />
                  ) : (
                    <Sun size={14} className="text-primary-500" />
                  )}
                </div>
              </button>
            </div>
          </GlassCard>

   
      
          {/* Preferences */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary">Sound Effects</p>
                  <p className="text-text-secondary text-sm">Play sounds on task completion</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-primary-500' : 'bg-black/[0.15] dark:bg-white/20'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Change Password */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Lock size={20} />
              Security
            </h2>
            
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="btn-secondary"
              >
                Change Password
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-field w-full"
                    placeholder="Confirm new password"
                  />
                </div>

                {passwordError && (
                  <p className="text-red-400 text-sm">{passwordError}</p>
                )}

                {passwordSuccess && (
                  <p className="text-green-400 text-sm">Password changed successfully!</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="btn-primary"
                  >
                    {changingPassword ? 'Changing...' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setPasswordError('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={handleLogout} className="btn-secondary text-red-400 hover:text-red-300">
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
