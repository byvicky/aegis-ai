import {
  Bot,
  History,
  LayoutDashboard,
  SearchCode,
  Settings,
  ShieldAlert,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "New Analysis",
    icon: SearchCode,
    path: "/analysis",
  },
  {
    title: "History",
    icon: History,
    path: "/history",
  },
  {
    title: "Vulnerabilities",
    icon: ShieldAlert,
    path: "/vulnerabilities",
  },
  {
    title: "AI Advisor",
    icon: Bot,
    path: "/advisor",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];