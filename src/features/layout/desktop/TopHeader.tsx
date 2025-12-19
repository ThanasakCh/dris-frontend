import { useState, useEffect } from "react";
import { PanelLeft, Menu, Moon, Sun, LogOut } from "lucide-react";
import profileImage from "../../../assets/profile.jpg";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";

interface DesktopTopHeaderProps {
  onMenuClick: () => void;
  isDarkMode?: boolean;
  onDarkModeToggle?: (isDark: boolean) => void;
}

export default function DesktopTopHeader({
  onMenuClick,
  isDarkMode = false,
  onDarkModeToggle,
}: DesktopTopHeaderProps) {
  const [isDark, setIsDark] = useState(isDarkMode);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    if (onDarkModeToggle) {
      onDarkModeToggle(newDarkMode);
    }
  };

  const buttonStyle = {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgb(51, 51, 51)",
    fontSize: "18px",
    marginRight: "10px",
    transition: "background 0.2s",
  };

  return (
    <header
      style={{
        position: "fixed",
        top: "0px",
        left: "0px",
        right: "0px",
        height: "60px",
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        padding: "0px 20px",
        zIndex: 1025,
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 1001,
        }}
      >
        {/* Desktop Sidebar Toggle - shows on screens >= 1024px */}
        {isDesktop && (
          <button
            type="button"
            title="Toggle Sidebar"
            style={buttonStyle}
            onClick={onMenuClick}
          >
            <PanelLeft
              className="w-[18px] h-[18px]"
              style={{ pointerEvents: "none" }}
            />
          </button>
        )}

        {/* Mobile Menu Toggle - shows on screens < 1024px */}
        {!isDesktop && (
          <button
            type="button"
            title="Toggle Menu"
            style={buttonStyle}
            onClick={onMenuClick}
          >
            <Menu
              className="w-[18px] h-[18px]"
              style={{ pointerEvents: "none" }}
            />
          </button>
        )}
      </div>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 1001,
        }}
      >
        {/* Language Switch */}
        <button
          type="button"
          title="Switch to Thai"
          style={{ ...buttonStyle, marginLeft: "10px", marginRight: "0px" }}
          onClick={toggleLanguage}
        >
          <span
            style={{ fontSize: "14px", fontWeight: 500, pointerEvents: "none" }}
          >
            {language}
          </span>
        </button>

        {/* Theme Switch */}
        <button
          type="button"
          title="Switch to Dark Mode"
          style={{ ...buttonStyle, marginLeft: "10px", marginRight: "0px" }}
          onClick={toggleTheme}
        >
          {isDark ? (
            <Sun
              className="w-[18px] h-[18px]"
              style={{ pointerEvents: "none" }}
            />
          ) : (
            <Moon
              className="w-[18px] h-[18px]"
              style={{ pointerEvents: "none" }}
            />
          )}
        </button>

        {/* Profile Dropdown */}
        <div style={{ marginLeft: "10px" }} className="relative dropdown">
          <button
            className="flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
          >
            <img
              src={profileImage}
              alt="Profile"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </button>

          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                color: "inherit",
                boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 15px",
                borderRadius: "12px",
                padding: "0px",
                minWidth: "220px",
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  background: "transparent",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <h6
                  className="mb-1"
                  style={{
                    color: "rgb(30, 41, 59)",
                    fontWeight: 600,
                    margin: 0,
                    fontSize: "14px",
                  }}
                >
                  {user?.name || "ผู้ใช้งาน"}
                </h6>
                <small
                  style={{ color: "rgb(100, 116, 139)", fontSize: "12px" }}
                >
                  {user?.email || ""}
                </small>
              </div>
              <button
                className="w-full text-left flex items-center gap-2 hover:bg-black/5 transition-colors"
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  color: "rgb(30, 41, 59)",
                  borderRadius: "0px 0px 12px 12px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={logout}
              >
                <LogOut size={18} />
                <span style={{ fontSize: "14px" }}>{t("header.logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
