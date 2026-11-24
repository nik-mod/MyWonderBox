import type {Metadata} from 'next';
import { connection } from 'next/server';
import './admin.css';
export const metadata:Metadata={title:'ადმინისტრირება',robots:{index:false,follow:false}};
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return <div className="admin-root">{children}</div>;
}
