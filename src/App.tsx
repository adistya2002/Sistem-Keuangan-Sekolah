import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { ScrollControls } from './components/layout/ScrollControls';
import { LoginScreen } from './components/auth/LoginScreen';

// Code-splitting via React.lazy for instant initial load
const CashLedgerModule = lazy(() => import('./components/cash/CashLedgerModule').then(m => ({ default: m.CashLedgerModule })));
const SppPaymentModule = lazy(() => import('./components/spp/SppPaymentModule').then(m => ({ default: m.SppPaymentModule })));
const ArrearsModule = lazy(() => import('./components/arrears/ArrearsModule').then(m => ({ default: m.ArrearsModule })));
const RapbsModule = lazy(() => import('./components/rapbs/RapbsModule').then(m => ({ default: m.RapbsModule })));
const ReportsModule = lazy(() => import('./components/reports/ReportsModule').then(m => ({ default: m.ReportsModule })));
const ReceiptsListModule = lazy(() => import('./components/receipts/ReceiptsListModule').then(m => ({ default: m.ReceiptsListModule })));
const MasterDataModule = lazy(() => import('./components/master/MasterDataModule').then(m => ({ default: m.MasterDataModule })));
const TutorialModule = lazy(() => import('./components/tutorial/TutorialModule').then(m => ({ default: m.TutorialModule })));
const SecurityModule = lazy(() => import('./components/security/SecurityModule').then(m => ({ default: m.SecurityModule })));
const SwitchUserModal = lazy(() => import('./components/auth/SwitchUserModal').then(m => ({ default: m.SwitchUserModal })));
const ReceiptModal = lazy(() => import('./components/receipts/ReceiptModal').then(m => ({ default: m.ReceiptModal })));

// Lightweight module loading fallback
const ModuleLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-12">
    <div className="w-10 h-10 border-3 border-[#E9E3D8] border-t-[#059669] rounded-full animate-spin"></div>
    <p className="mt-3 text-xs font-semibold text-[#8D8271]">Memuat modul data...</p>
  </div>
);

const AppContent: React.FC = () => {
  const { 
    currentTab, 
    activeReceipt,
    closeReceiptModal,
    isAuthenticated
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);

  // If user is not authenticated, show authorization login portal
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A4238] flex flex-col font-sans antialiased selection:bg-[#D4A373]/20 selection:text-[#2D2821]">
      
      {/* Top Header */}
      <Header 
        className="no-print"
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
      />

      {/* Body Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onCloseMobile={() => setIsSidebarOpen(false)} 
          onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full lg:pl-68">
          <Suspense fallback={<ModuleLoadingFallback />}>
            {(currentTab === 'dashboard' || currentTab === 'DASHBOARD') && <DashboardModule />}
            {(currentTab === 'cash' || currentTab === 'CASH_LEDGER') && <CashLedgerModule />}
            {(currentTab === 'spp' || currentTab === 'SPP_PAYMENT') && <SppPaymentModule />}
            {(currentTab === 'arrears' || currentTab === 'ARREARS_TRACKER') && <ArrearsModule />}
            {(currentTab === 'rapbs' || currentTab === 'RAPBS') && <RapbsModule />}
            {(currentTab === 'reports' || currentTab === 'REPORTS') && <ReportsModule />}
            {(currentTab === 'receipts' || currentTab === 'RECEIPTS') && <ReceiptsListModule />}
            {(currentTab === 'master' || currentTab === 'MASTER_DATA') && <MasterDataModule />}
            {(currentTab === 'guide' || currentTab === 'TUTORIAL') && <TutorialModule />}
            {(currentTab === 'security' || currentTab === 'SECURITY') && <SecurityModule />}
          </Suspense>

          {/* Global App Footer */}
          <footer className="mt-12 pt-6 border-t border-[#D9D1C2]/60 text-center text-xs text-[#8D8271] no-print">
            &copy; {new Date().getFullYear()} SIKEU App • Sistem Keuangan Terpadu TK, KB & Rumah Qur'an Thoriqul Jannah Sinjai | by Integral for ERP
          </footer>
        </main>
      </div>

      {/* Global Modals */}
      <Suspense fallback={null}>
        {isSwitchUserOpen && (
          <SwitchUserModal 
            isOpen={isSwitchUserOpen} 
            onClose={() => setIsSwitchUserOpen(false)} 
          />
        )}

        {activeReceipt && (
          <ReceiptModal 
            payment={activeReceipt} 
            onClose={closeReceiptModal} 
          />
        )}
      </Suspense>

      {/* Floating Scroll Navigation with Up & Down Arrows */}
      <ScrollControls />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
