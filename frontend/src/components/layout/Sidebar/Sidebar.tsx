import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarItem } from "./SidebarItem";
import { navigation } from "./navigation";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-950 p-6">
      <SidebarHeader />

      <nav className="mt-8 flex flex-col gap-2">
        {navigation.map((item, index) => (
          <SidebarItem
            key={item.title}
            title={item.title}
            icon={item.icon}
            active={index === 0}
          />
        ))}
      </nav>

      <SidebarFooter />
    </aside>
  );
}