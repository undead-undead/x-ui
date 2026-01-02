import { Sidebar } from './components/Sidebar';
import { Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './views/LoginPage';
import { Dialog } from './components/Dialog';
import { Toaster } from 'react-hot-toast';

// 性能优化：使用 lazy 懒加载弹窗组件，减少首屏加载时间
const AddInboundModal = lazy(() => import('./components/AddInboundModal').then(module => ({ default: module.AddInboundModal })));
const BackupModal = lazy(() => import('./components/BackupModal').then(module => ({ default: module.BackupModal })));
const LogsModal = lazy(() => import('./components/LogsModal').then(m => ({ default: m.LogsModal })));
const QRCodeModal = lazy(() => import('./components/QRCodeModal').then(m => ({ default: m.QRCodeModal })));

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toaster position="top-center" />
      {!isAuthenticated ? (
        <LoginPage key="auth-login" />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>

          {/* 弹窗挂载 - 使用 Suspense 包裹懒加载组件 */}
          <Suspense fallback={null}>
            <AddInboundModal />
            <BackupModal />
            <LogsModal />
            <QRCodeModal />
          </Suspense>
        </div>
      )}

      {/* 全局对话框 - 始终保留，确保在注销切换状态时不会被卸载 */}
      <Dialog />
    </div>
  );
}

export default App;