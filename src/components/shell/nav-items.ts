import { PRIMARY_NAV } from "@/config/navigation";

export async function getVisibleNavItems(role: "ADMIN" | "USER" | null) {
  return PRIMARY_NAV.filter((item) => {
    if (item.adminOnly && role !== "ADMIN") {
      return false;
    }
    return true;
  });
}
