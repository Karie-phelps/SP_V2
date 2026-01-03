"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MenuIcon, User, Settings, LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
    setMenuOpen(false);
  };

  const handleProfile = () => {
    router.push("/profile");
    setMenuOpen(false);
  };

  const handleSettings = () => {
    router.push("/settings");
    setMenuOpen(false);
  };

  return (
    <>
      <header className="absolute z-20 top-0 md:p-6h-14 w-full rounded-2xl flex">
        <div className="bg-white w-full m-2 p-3 flex items-center justify-between rounded-2xl font-(--font-mono) border border-gray-300 shadow-sm">
          <a href="/dashboard" className="w-28 md:w-32">
            <Image
              src={"/pandiwa-logo-text-p.svg"}
              alt="Logo"
              width={100}
              height={20}
              priority
              className="transition-all duration-300"
            />
          </a>
          <div className="flex items-center gap-2 md:gap-6">
            {/* Desktop: Full avatar with name */}
            <div className="hidden sm:flex flex-row gap-2 items-center justify-center">
              <Avatar className="w-8 h-8 md:w-10 md:h-10 relative ring-2 ring-blue-500 shadow-[0_0_12px_3px_rgba(13,81,125,0.5)]">
                <AvatarImage
                  alt="Student Avatar"
                  className="object-cover"
                  src={user?.avatar_url}
                />
                <AvatarFallback className="bg-blue-900 text-white text-xs md:text-sm">
                  {user?.first_name?.[0]?.toUpperCase() || "U"}
                  {user?.last_name?.[0]?.toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <span className="font-bold text-sm md:text-base text-blue-950">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-xs text-blue-700 hidden md:block">
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Mobile: Avatar only */}
            <div className="sm:hidden">
              <Avatar className="w-8 h-8 relative ring-2 ring-blue-500 shadow-[0_0_12px_3px_rgba(13,81,125,0.5)]">
                <AvatarImage
                  alt="Student Avatar"
                  className="object-cover"
                  src={user?.avatar_url}
                />
                <AvatarFallback className="bg-blue-900 text-white text-xs">
                  {user?.first_name?.[0]?.toUpperCase() || "U"}
                  {user?.last_name?.[0]?.toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6 text-blue-950" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ scale: 0.5, opacity: 0, rotate: 45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: -45 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MenuIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-950" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-100 bg-black/20 md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-16 md:top-20 right-4 md:right-8 z-100 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-56"
            >
              <div className="py-2">
                {/* Profile Option */}
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    Profile
                  </span>
                </button>

                {/* Settings Option */}
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    Settings
                  </span>
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-gray-200"></div>

                {/* Logout Option */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                    <LogOut className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                    Logout
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
