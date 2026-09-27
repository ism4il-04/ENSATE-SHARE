import { redirect } from 'next/navigation';

// The staff login moved to the home page; keep old bookmarks working
export default function LegacyLoginPage() {
    redirect('/#parcours');
}
