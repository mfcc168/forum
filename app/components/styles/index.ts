// Shared styling utilities and constants for consistent design

export const pageStyles = {
  container: "min-h-screen",
  maxWidth: "max-w-7xl mx-auto px-4 py-8",
  loadingScreen: "flex items-center justify-center min-h-screen",
  loadingSpinner: "animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4",
} as const;

export const cardStyles = {
  minecraft: "minecraft-card overflow-hidden",
  panel: "minecraft-panel p-8",
  featured: "md:col-span-2 lg:col-span-3",
} as const;

export const buttonStyles = {
  minecraft: "minecraft-button",
  discord: "w-full bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center justify-center gap-3 py-3",
  category: "minecraft-button px-4 py-2 text-sm",
} as const;

export const gradientStyles = {
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600",
  blue: "bg-gradient-to-br from-blue-500 to-blue-600",
  purple: "bg-gradient-to-br from-purple-500 to-purple-600",
  orange: "bg-gradient-to-br from-orange-500 to-orange-600",
} as const;

export const textStyles = {
  heading: "text-2xl font-bold text-slate-800",
  subheading: "text-xl font-bold text-slate-800",
  body: "text-slate-600 leading-relaxed",
  muted: "text-slate-500",
} as const;