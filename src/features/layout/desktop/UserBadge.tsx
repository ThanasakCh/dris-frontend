import { Bell, User } from "lucide-react";

interface DesktopHeaderProps {
  userName?: string;
  userRole?: string;
}

export default function DesktopHeader({
  userName = "ผู้ใช้งาน",
  userRole = "เกษตรกร",
}: DesktopHeaderProps) {
  return (
    <div className="absolute top-5 right-20 z-20 flex gap-3">
      {/* User Profile */}
      <div className="bg-white/90 backdrop-blur-sm p-1 pr-4 rounded-full shadow-lg flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform border border-gray-200/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 p-0.5">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
            <User size={18} className="text-green-600" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-800">{userName}</span>
          <span className="text-[10px] text-gray-500">{userRole}</span>
        </div>
      </div>

      {/* Notification Bell */}
      <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-green-500 relative transition-colors border border-gray-200/50">
        <Bell size={20} />
        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
      </button>
    </div>
  );
}
