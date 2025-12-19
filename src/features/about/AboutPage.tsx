import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Satellite,
  Server,
  Database,
  LineChart,
  Mail,
  Info,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import TopHeader from "../layout/mobile/TopHeader";

interface MobileAboutPageProps {
  onBack: () => void;
  onMenuClick: () => void;
  isDarkMode?: boolean;
  onDarkModeToggle?: (isDark: boolean) => void;
}

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
  isDarkMode?: boolean;
}

function AccordionItem({
  title,
  children,
  isOpen,
  onClick,
  isDarkMode = false,
}: AccordionItemProps) {
  const colors = {
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb",
    primary: "#0284C7",
    text: isDarkMode ? "#e2e8f0" : "#334155",
    muted: isDarkMode ? "#64748b" : "#94a3b8",
  };

  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <button
        onClick={onClick}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: colors.primary,
          }}
        >
          {title}
        </span>
        {isOpen ? (
          <ChevronUp size={20} style={{ color: colors.primary }} />
        ) : (
          <ChevronDown size={20} style={{ color: colors.muted }} />
        )}
      </button>
      {isOpen && (
        <div
          style={{
            paddingBottom: "16px",
            fontSize: "14px",
            lineHeight: 1.7,
            color: colors.text,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function MobileAboutPage({
  onBack: _onBack,
  onMenuClick,
  isDarkMode = false,
  onDarkModeToggle,
}: MobileAboutPageProps) {
  const { t } = useLanguage();
  const [openAccordion, setOpenAccordion] = useState<string | null>("ndvi");

  // Dark mode colors
  const colors = {
    bg: isDarkMode ? "#1a1a2e" : "#fff",
    text: isDarkMode ? "#e2e8f0" : "#1e3a5f",
    textSecondary: isDarkMode ? "#cbd5e1" : "#475569",
    textMuted: isDarkMode ? "#94a3b8" : "#64748b",
    primary: "#0284C7",
    cardBg: isDarkMode
      ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)"
      : "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
    cardBorder: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
    checkBg: isDarkMode
      ? "linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(14, 165, 233, 0.2) 100%)"
      : "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
  };

  const objectives = [
    t("about.obj1"),
    t("about.obj2"),
    t("about.obj3"),
    t("about.obj4"),
    t("about.obj5"),
    t("about.obj6"),
  ];

  const technologies = [
    {
      icon: Satellite,
      title: t("about.tech1Title"),
      desc: t("about.tech1Desc"),
    },
    {
      icon: Server,
      title: t("about.tech2Title"),
      desc: t("about.tech2Desc"),
    },
    {
      icon: Database,
      title: t("about.tech3Title"),
      desc: t("about.tech3Desc"),
    },
    {
      icon: LineChart,
      title: t("about.tech4Title"),
      desc: t("about.tech4Desc"),
    },
  ];

  const handleAccordionClick = (accordionId: string) => {
    setOpenAccordion(openAccordion === accordionId ? null : accordionId);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: colors.bg,
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - Same as main page */}
      <TopHeader
        onMenuClick={onMenuClick}
        isDarkMode={isDarkMode}
        onDarkModeToggle={onDarkModeToggle}
      />

      {/* Content - with top padding for fixed header */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          marginTop: "60px",
        }}
      >
        {/* Title Section */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: colors.checkBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={18} style={{ color: colors.primary }} />
            </div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: colors.text,
                margin: 0,
              }}
            >
              {t("about.title")}
            </h1>
          </div>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: colors.text,
              marginBottom: "12px",
              lineHeight: 1.4,
            }}
          >
            {t("about.projectTitle")}
          </h2>

          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.7,
              color: colors.textSecondary,
              margin: 0,
            }}
          >
            {t("about.projectDesc")}
          </p>
        </div>

        {/* Objectives Section */}
        <div style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: colors.text,
              marginBottom: "16px",
            }}
          >
            {t("about.objectives")}
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {objectives.map((obj, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: colors.checkBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <Check size={12} style={{ color: colors.primary }} />
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: colors.textSecondary,
                  }}
                >
                  {obj}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Section */}
        <div style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: colors.text,
              marginBottom: "16px",
            }}
          >
            {t("about.technology")}
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {technologies.map((tech, index) => {
              const Icon = tech.icon;
              return (
                <div
                  key={index}
                  style={{
                    padding: "16px",
                    background: colors.cardBg,
                    borderRadius: "12px",
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <Icon size={20} style={{ color: colors.primary }} />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: colors.primary,
                      }}
                    >
                      {tech.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.6,
                      color: colors.textMuted,
                      margin: 0,
                    }}
                  >
                    {tech.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assessment Indices Section */}
        <div style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: colors.text,
              marginBottom: "12px",
            }}
          >
            {t("about.indices")}
          </h3>

          <AccordionItem
            title={t("about.ndviTitle")}
            isOpen={openAccordion === "ndvi"}
            onClick={() => handleAccordionClick("ndvi")}
            isDarkMode={isDarkMode}
          >
            {t("about.ndviDesc")}
          </AccordionItem>
          <AccordionItem
            title={t("about.eviTitle")}
            isOpen={openAccordion === "evi"}
            onClick={() => handleAccordionClick("evi")}
            isDarkMode={isDarkMode}
          >
            {t("about.eviDesc")}
          </AccordionItem>
          <AccordionItem
            title={t("about.gndviTitle")}
            isOpen={openAccordion === "gndvi"}
            onClick={() => handleAccordionClick("gndvi")}
            isDarkMode={isDarkMode}
          >
            {t("about.gndviDesc")}
          </AccordionItem>
          <AccordionItem
            title={t("about.ndwiTitle")}
            isOpen={openAccordion === "ndwi"}
            onClick={() => handleAccordionClick("ndwi")}
            isDarkMode={isDarkMode}
          >
            {t("about.ndwiDesc")}
          </AccordionItem>
          <AccordionItem
            title={t("about.saviTitle")}
            isOpen={openAccordion === "savi"}
            onClick={() => handleAccordionClick("savi")}
            isDarkMode={isDarkMode}
          >
            {t("about.saviDesc")}
          </AccordionItem>
          <AccordionItem
            title={t("about.vciTitle")}
            isOpen={openAccordion === "vci"}
            onClick={() => handleAccordionClick("vci")}
            isDarkMode={isDarkMode}
          >
            {t("about.vciDesc")}
          </AccordionItem>
        </div>

        {/* Team Section */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              padding: "16px",
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(146, 64, 14, 0.3) 0%, rgba(146, 64, 14, 0.2) 100%)"
                : "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
              borderRadius: "12px",
              border: isDarkMode
                ? "1px solid rgba(252, 211, 77, 0.3)"
                : "1px solid #FCD34D",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "18px" }}>👥</span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: isDarkMode ? "#FCD34D" : "#92400E",
                }}
              >
                {t("about.team")}
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: isDarkMode ? "#FDE68A" : "#78350F",
                margin: 0,
                marginBottom: "12px",
              }}
            >
              {t("about.teamDesc")}
            </p>
            <p
              style={{
                fontSize: "12px",
                lineHeight: 1.6,
                color: isDarkMode ? "#FCD34D" : "#92400E",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {t("about.support")}
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              padding: "16px",
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0.1) 100%)"
                : "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
              borderRadius: "12px",
              border: isDarkMode
                ? "1px solid rgba(125, 211, 252, 0.3)"
                : "1px solid #7DD3FC",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <Mail size={18} style={{ color: colors.primary }} />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: isDarkMode ? "#7DD3FC" : "#0369A1",
                }}
              >
                {t("about.contact")}
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: isDarkMode ? "#BAE6FD" : "#0369A1",
                margin: 0,
              }}
            >
              {t("about.contactDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
