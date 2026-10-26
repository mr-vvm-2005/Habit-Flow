import React from 'react';
import { X, ExternalLink, Database, Key, ShieldCheck, Check } from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  isConfigured,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1B2420] rounded-2xl shadow-xl border border-[#E6E8E0] dark:border-[#2D3D35] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E8E0] dark:border-[#2D3D35]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#DCE8DC] dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6]">
                Supabase Backend Configuration
              </h2>
              <p className="text-sm text-[#737B73] dark:text-[#A0AAA0]">
                Status: {isConfigured ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" /> Connected Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    Local Demo Mode (Ready to connect)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm text-[#252B27] dark:text-[#EDECE6]">
          <div className="p-4 rounded-xl bg-[#F8F7F2] dark:bg-[#222E29] border border-[#E6E8E0] dark:border-[#2D3D35]">
            <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#244C3A] dark:text-[#8FBCA0]" />
              Quick 3-Minute Setup Instructions
            </h3>
            <p className="text-[#737B73] dark:text-[#A0AAA0]">
              HabitFlow uses Supabase for managed PostgreSQL, Row Level Security (RLS), and Authentication. Follow these simple steps:
            </p>
          </div>

          <ol className="space-y-4 list-decimal list-inside">
            <li className="p-3 rounded-lg border border-[#E6E8E0] dark:border-[#2D3D35]">
              <strong className="text-[#244C3A] dark:text-[#8FBCA0]">Create a Supabase Project:</strong>
              <div className="mt-1 text-[#737B73] dark:text-[#A0AAA0]">
                Go to{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#244C3A] dark:text-[#8FBCA0] underline font-medium inline-flex items-center gap-0.5"
                >
                  supabase.com <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                and create a free organization and project.
              </div>
            </li>

            <li className="p-3 rounded-lg border border-[#E6E8E0] dark:border-[#2D3D35]">
              <strong className="text-[#244C3A] dark:text-[#8FBCA0]">Run the SQL Schema:</strong>
              <div className="mt-1 text-[#737B73] dark:text-[#A0AAA0]">
                Open the Supabase Dashboard &rarr; <strong>SQL Editor</strong> &rarr; Click <strong>New Query</strong>. Paste the complete contents of <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">supabase/schema.sql</code> and click <strong>Run</strong>.
              </div>
            </li>

            <li className="p-3 rounded-lg border border-[#E6E8E0] dark:border-[#2D3D35]">
              <strong className="text-[#244C3A] dark:text-[#8FBCA0]">Copy API Credentials:</strong>
              <div className="mt-1 text-[#737B73] dark:text-[#A0AAA0]">
                Go to <strong>Project Settings &rarr; API</strong>. Copy your <strong>Project URL</strong> and <strong>anon (public) key</strong>.
              </div>
            </li>

            <li className="p-3 rounded-lg border border-[#E6E8E0] dark:border-[#2D3D35]">
              <strong className="text-[#244C3A] dark:text-[#8FBCA0]">Save to .env:</strong>
              <div className="mt-1 text-[#737B73] dark:text-[#A0AAA0]">
                Create a <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">.env</code> file in your project root with:
                <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key`}
                </pre>
              </div>
            </li>
          </ol>

          <div className="p-3 rounded-lg bg-[#DCE8DC]/40 dark:bg-[#284435]/40 border border-[#7FA58A]/30 flex items-start gap-2.5">
            <Key className="w-5 h-5 text-[#244C3A] dark:text-[#8FBCA0] shrink-0 mt-0.5" />
            <div className="text-xs text-[#252B27] dark:text-[#EDECE6]">
              <strong>Security reminder:</strong> Never paste your secret <code className="font-mono">service_role</code> key in the frontend. Only the public <code className="font-mono">anon</code> publishable key belongs in client-side variables.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
