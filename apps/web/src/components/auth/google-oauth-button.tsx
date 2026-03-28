import React from 'react';
import { Button } from 'antd';

interface GoogleOAuthButtonProps {
  label?: string;
}

/** Redirects to backend Google OAuth endpoint */
export function GoogleOAuthButton({ label = 'Đăng nhập với Google' }: GoogleOAuthButtonProps) {
  const handleClick = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <Button
      block
      size="large"
      onClick={handleClick}
      style={{
        height: 44,
        borderRadius: 8,
        border: '1.5px solid #E5E7EB',
        fontWeight: 500,
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      icon={
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
          />
        </svg>
      }
    >
      {label}
    </Button>
  );
}
