import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale";
import { format } from "date-fns";
import {
  ArrowLeft,
  UserPlus,
  User,
  AtSign,
  Calendar,
  Mail,
  Lock,
  Info,
  CheckCircle,
  LogIn,
  ArrowRightCircle,
} from "lucide-react";
import logoImage from "../../assets/icons/logo.png";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  // Registration form state
  const [regData, setRegData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    date_of_birth: "",
  });

  // Login form state
  const [loginData, setLoginData] = useState({
    username_or_email: "",
    password: "",
  });

  // UI state
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (
      !regData.name ||
      !regData.username ||
      !regData.email ||
      !regData.password
    ) {
      setRegError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (regData.password.length < 6) {
      setRegError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setIsLoading(true);
      await register(regData);
      setRegSuccess("สร้างบัญชีสำเร็จ! กำลังเข้าสู่ระบบ…");

      setTimeout(() => {
        const from = location.state?.from?.pathname || "/map";
        navigate(from, { replace: true });
      }, 1000);
    } catch (error: any) {
      setRegError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginData.username_or_email || !loginData.password) {
      setLoginError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setIsLoading(true);
      await login(loginData.username_or_email, loginData.password);

      const from = location.state?.from?.pathname || "/map";
      navigate(from, { replace: true });
    } catch (error: any) {
      setLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div className="bg-gray-50 font-sans antialiased relative h-screen overflow-hidden">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-60 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="fixed right-0 top-0 w-1/2 h-full bg-gradient-to-l from-gray-100/50 to-transparent z-0 pointer-events-none"></div>

      {/* Navbar */}
      <nav
        className="fixed w-full z-50"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <button
              onClick={handleBackHome}
              className="flex items-center gap-3 group relative z-10"
            >
              <img
                src={logoImage}
                alt="Grovi Logo"
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg shadow-lg group-hover:scale-105 transition"
              />
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg lg:text-xl text-primary-900 leading-none">
                  GROVI
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Crop Monitoring Platform
                </span>
              </div>
            </button>

            {/* Back Button */}
            <button
              onClick={handleBackHome}
              className="group flex items-center gap-2 lg:gap-3 px-1 py-1 pr-3 lg:pr-4 text-xs lg:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-primary-200 hover:text-primary-700 hover:shadow-md transition-all duration-300 relative z-10"
            >
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors text-gray-500 group-hover:text-primary-600">
                <ArrowLeft className="w-3 h-3 lg:w-4 lg:h-4 transition-transform group-hover:-translate-x-0.5" />
              </div>
              <span>กลับหน้าหลัก</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="h-full pt-16 lg:pt-20 pb-4 flex items-center justify-center relative z-10">
        {/* Auth Card */}
        <div className="w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col lg:flex-row max-h-[calc(100vh-100px)]">
          {/* Register Section (Left) */}
          <div className="lg:w-7/12 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col justify-center overflow-y-auto">
            <div className="mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-display font-bold text-primary-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 lg:w-6 lg:h-6 text-secondary-500" />
                ลงทะเบียนผู้ใช้ใหม่
              </h2>
              <p className="text-gray-500 text-xs lg:text-sm mt-1">
                กรอกข้อมูลเพื่อเริ่มต้นใช้งานระบบติดตามแปลงเกษตร
              </p>
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4"
              onSubmit={handleRegister}
            >
              <div className="col-span-2">
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="เช่น ธนศักดิ์ ไชยลังกา"
                    value={regData.name}
                    onChange={(e) =>
                      setRegData({ ...regData, name: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative group">
                    <AtSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="ตัวอย่าง thanasak"
                      value={regData.username}
                      onChange={(e) =>
                        setRegData({ ...regData, username: e.target.value })
                      }
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    วันเดือนปีเกิด
                  </label>
                  <div className="relative group flex">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors z-10" />
                    <DatePicker
                      selected={
                        regData.date_of_birth
                          ? new Date(regData.date_of_birth)
                          : null
                      }
                      onChange={(date: Date | null) => {
                        if (date) {
                          setRegData({
                            ...regData,
                            date_of_birth: format(date, "yyyy-MM-dd"),
                          });
                        }
                      }}
                      locale={th}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันเกิด"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      maxDate={new Date()}
                      disabled={isLoading}
                      wrapperClassName="w-full"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition text-sm text-gray-600"
                      calendarClassName="rounded-lg shadow-lg border border-gray-200"
                      todayButton="วันนี้"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={regData.email}
                    onChange={(e) =>
                      setRegData({ ...regData, email: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={regData.password}
                    onChange={(e) =>
                      setRegData({ ...regData, password: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition text-sm"
                  />
                </div>
                <p className="text-[10px] lg:text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  ระบบจะคำนวณอายุอัตโนมัติและบันทึกในโปรไฟล์
                </p>
              </div>

              {regError && (
                <div className="col-span-2 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="col-span-2 text-green-600 text-sm bg-green-50 p-2 rounded-lg">
                  {regSuccess}
                </div>
              )}

              <div className="col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-display font-bold py-2.5 rounded-xl shadow-lg shadow-secondary-600/20 hover:shadow-xl hover:shadow-secondary-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                  {isLoading ? "กำลังสร้างบัญชี..." : "สร้างบัญชีผู้ใช้งาน"}
                </button>
              </div>
            </form>
          </div>

          {/* Login Section (Right) */}
          <div className="lg:w-5/12 p-6 lg:p-10 bg-gray-50/30 flex flex-col justify-center">
            <div className="mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl font-display font-bold text-primary-900 flex items-center gap-2">
                <LogIn className="w-5 h-5 lg:w-6 lg:h-6 text-primary-500" />
                เข้าสู่ระบบ
              </h2>
              <p className="text-gray-500 text-xs lg:text-sm mt-1">
                สำหรับผู้ที่มีบัญชีอยู่แล้ว
              </p>
            </div>

            <form className="space-y-4 lg:space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                  Username หรือ Email
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
                    value={loginData.username_or_email}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        username_or_email: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="กรอกรหัสผ่าน"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition text-sm"
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <a
                    href="#"
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              {loginError && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-900 hover:bg-primary-800 text-white font-display font-bold py-2.5 rounded-xl shadow-lg shadow-primary-900/20 hover:shadow-xl hover:shadow-primary-900/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-2 lg:bottom-4 text-center w-full z-10 text-gray-400 text-[10px] lg:text-xs">
          © 2025 Grovi Geo-Informatics Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
