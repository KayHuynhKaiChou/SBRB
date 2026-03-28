import React from 'react';
import { Typography } from 'antd';
import { RiBarChartBoxLine } from 'react-icons/ri';

const { Title, Text } = Typography;

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/** Split-screen auth layout: brand panel left, form panel right */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #D72A44 0%, #8B1429 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(-30%, 30%)' }}
        />

        <div className="relative z-10 text-center text-white max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
            >
              <RiBarChartBoxLine size={32} color="white" />
            </div>
            <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
              SBRB
            </Title>
          </div>

          <Title level={3} style={{ color: 'white', margin: '0 0 16px', fontWeight: 600 }}>
            Smart Business Reporting Builder
          </Title>

          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.6 }}>
            Xây dựng báo cáo kinh doanh thông minh. Phân tích dữ liệu trực quan và ra quyết định nhanh hơn.
          </Text>

          {/* Feature bullets */}
          <div className="mt-10 text-left space-y-4">
            {[
              'Kéo-thả widget báo cáo linh hoạt',
              'Kết nối nhiều nguồn dữ liệu',
              'Chia sẻ và cộng tác theo nhóm',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.25)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{feat}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 bg-white min-h-screen overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <RiBarChartBoxLine size={24} color="#D72A44" />
          <Title level={3} style={{ color: '#D72A44', margin: 0, fontWeight: 800 }}>SBRB</Title>
        </div>

        <div className="w-full max-w-md">
          {/* Form header */}
          <div className="mb-8">
            <Title level={3} style={{ margin: '0 0 6px', fontWeight: 700, color: '#111827' }}>
              {title}
            </Title>
            {subtitle && (
              <Text style={{ color: '#6B7280', fontSize: 15 }}>{subtitle}</Text>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
