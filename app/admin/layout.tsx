/**
 * Dedicated light theme shell for admin — does not alter the public storefront.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-app-scope min-h-full flex-1">{children}</div>;
}
