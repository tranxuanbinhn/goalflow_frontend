import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebarStore } from '../../store/sidebarStore';

export default function Layout() {
  const { isExpanded } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />
      <Header />
      <main 
        className={`
          pt-16 min-h-screen transition-all duration-300 ease-in-out
          ${isExpanded ? 'ml-56' : 'ml-[72px]'}
        `}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
