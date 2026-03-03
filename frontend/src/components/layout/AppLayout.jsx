import { Outlet } from 'react-router-dom'

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

 function AppLayout() {

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <div className="flex-1 pl-56 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default AppLayout