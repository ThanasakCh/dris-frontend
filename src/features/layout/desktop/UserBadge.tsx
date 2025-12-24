import { Bell, User, Sun, Moon, Satellite } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface DesktopHeaderProps {
  userName?: string;
  userRole?: string;
  children?: React.ReactNode;
  currentStyle?: string;
  onStyleChange?: (style: string) => void;
  profileUrl?: string;
}

export default function DesktopHeader({
  userName,
  userRole,
  children,
  currentStyle,
  onStyleChange,
  profileUrl,
}: DesktopHeaderProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const displayName = userName || t("user.defaultName");
  const displayRole = userRole || t("user.farmer");

  const handleThemeToggle = () => {
    if (!onStyleChange || !currentStyle) return;

    // Cycle: satellite -> voyager (light) -> dark -> satellite
    let newStyle = "satellite";
    if (currentStyle === "satellite") newStyle = "light";
    else if (currentStyle === "light") newStyle = "dark";
    else newStyle = "satellite";

    onStyleChange(newStyle);
  };

  return (
    <div className="absolute top-5 right-5 z-20 flex gap-3 pointer-events-auto">
      {/* Additional Controls */}
      {children}

      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-green-600 transition-colors border border-gray-200/50 text-sm font-bold"
        title={t("header.switchLanguage")}
      >
        {language === "TH" ? "EN" : "TH"}
      </button>

      {/* Theme Toggle */}
      {currentStyle && onStyleChange && (
        <button
          onClick={handleThemeToggle}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-green-600 transition-colors border border-gray-200/50"
          title={
            currentStyle === "dark"
              ? t("map.satellite")
              : currentStyle === "light"
              ? t("header.darkMode")
              : t("header.lightMode")
          }
        >
          {currentStyle === "dark" ? (
            <Satellite size={20} />
          ) : currentStyle === "light" ? (
            <Moon size={20} />
          ) : (
            <Sun size={20} />
          )}
        </button>
      )}

      {/* User Profile */}
      <div className="bg-white/90 backdrop-blur-sm p-1 pr-4 rounded-full shadow-lg flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform border border-gray-200/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 p-0.5">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {profileUrl ? (
              <img
                src={profileUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-green-600" />
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-800">{displayName}</span>
          <span className="text-[10px] text-gray-500">{displayRole}</span>
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
