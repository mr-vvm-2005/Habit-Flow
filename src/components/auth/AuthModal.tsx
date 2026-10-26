import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USER } from '../../services/localDemoStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }
        const res = await signUp(email.trim(), password, name.trim());
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to register');
          setIsLoading(false);
          return;
        }
      } else {
        const res = await signIn(email.trim(), password);
        if (!res.success) {
          setErrorMessage(res.error || 'Invalid email or password');
          setIsLoading(false);
          return;
        }
      }

      onClose();
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    await signIn(DEMO_USER.email, 'demopassword123');
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1B2420] rounded-2xl shadow-2xl border border-[#E6E8E0] dark:border-[#2D3D35] p-6">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#244C3A] flex items-center justify-center text-white font-bold text-sm">
              HF
            </div>
            <h2 className="text-xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6]">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 mt-3 bg-[#F8F7F2] dark:bg-[#222E29] rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#1B2420] text-[#244C3A] dark:text-[#8FBCA0] shadow-xs'
                : 'text-[#737B73] hover:text-[#252B27]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#1B2420] text-[#244C3A] dark:text-[#8FBCA0] shadow-xs'
                : 'text-[#737B73] hover:text-[#252B27]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[#737B73]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#737B73]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#737B73]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#737B73] hover:text-[#252B27] dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E6E8E0] dark:border-[#2D3D35]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#1B2420] px-2 text-[#737B73]">Or for testing</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          className="w-full py-2 bg-[#F8F7F2] dark:bg-[#222E29] hover:bg-[#DCE8DC]/50 dark:hover:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0] border border-[#E6E8E0] dark:border-[#2D3D35] rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C77B5B]" />
          Sign In with Demo Account (Instant Access)
        </button>
      </div>
    </div>
  );
};
