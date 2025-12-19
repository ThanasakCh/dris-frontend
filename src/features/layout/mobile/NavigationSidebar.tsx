import { useEffect, useState } from "react";
import { ChevronLeft, Home, Info, MapPin } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: "health" | "about";
  onNavigate: (page: "health" | "about") => void;
  isDarkMode?: boolean;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  activeItem = "health",
  onNavigate,
  isDarkMode = false,
}: MobileSidebarProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  // Dark mode colors
  const colors = {
    bg: isDarkMode ? "#1a1a2e" : "#fff",
    headerBorder: isDarkMode
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.05)",
    text: isDarkMode ? "#e2e8f0" : "rgb(51, 51, 51)",
    textMuted: isDarkMode ? "#94a3b8" : "rgb(108, 117, 125)",
    primary: "rgb(13, 110, 253)",
    primaryBg: isDarkMode
      ? "rgba(13, 110, 253, 0.2)"
      : "rgba(13, 110, 253, 0.1)",
    buttonBg: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.03)",
    buttonColor: isDarkMode ? "#e2e8f0" : "rgb(51, 51, 51)",
    footerBorder: isDarkMode
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.05)",
  };

  const menuItems = [
    {
      id: "health" as const,
      label: t("sidebar.healthTracking"),
      icon: Home,
    },
    {
      id: "about" as const,
      label: t("sidebar.about"),
      icon: Info,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 4000,
          opacity: isAnimating ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Sidebar Panel - navbar-wrapper */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          backgroundColor: colors.bg,
          zIndex: 4001,
          transform: isAnimating ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* m-header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.headerBorder}`,
          }}
        >
          {/* b-brand */}
          <div style={{ flex: 1, textDecoration: "none" }}>
            <h4
              style={{
                fontSize: "16px",
                color: colors.primary,
                fontWeight: 700,
                margin: 0,
              }}
            >
              DRIS Project
            </h4>
            <span
              style={{
                display: "inline-block",
                marginTop: "4px",
                fontSize: "9px",
                background: isDarkMode
                  ? "rgba(13, 110, 253, 0.3)"
                  : "rgba(13, 110, 253, 0.15)",
                color: colors.primary,
                border: `1px solid rgba(13, 110, 253, ${
                  isDarkMode ? "0.4" : "0.2"
                })`,
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              v1.0 MVP
            </span>
          </div>
          {/* sidebar-collapse-btn */}
          <button
            title="Toggle Menu"
            onClick={onClose}
            style={{
              background: colors.buttonBg,
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              transition: "background 0.2s",
              color: colors.buttonColor,
            }}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* navbar-content */}
        <div style={{ padding: "12px 0" }}>
          {/* pc-navbar */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id} style={{ marginBottom: "4px" }}>
                  {/* pc-link */}
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 20px",
                      textDecoration: "none",
                      color: colors.text,
                      background: isActive ? colors.primaryBg : "transparent",
                      borderLeft: isActive
                        ? `3px solid ${colors.primary}`
                        : "3px solid transparent",
                      borderTop: "none",
                      borderRight: "none",
                      borderBottom: "none",
                      transition: "0.2s",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 400,
                      width: "100%",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {/* pc-micon */}
                    <span
                      style={{
                        marginRight: "12px",
                        display: "flex",
                        alignItems: "center",
                        color: isActive ? colors.primary : colors.textMuted,
                      }}
                    >
                      <Icon size={20} />
                    </span>
                    {/* pc-mtext */}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer - Location Info */}
          <div
            style={{
              padding: "20px",
              marginTop: "20px",
              borderTop: `1px solid ${colors.footerBorder}`,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: colors.textMuted,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <MapPin size={14} />
              </div>
              <div>Drought Monitoring</div>
              <div style={{ marginTop: "4px", fontSize: "10px" }}>
                Northern Thailand
              </div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />
      </div>
    </>
  );
}
