import Link from 'next/link';

// Footer links to the legal pages, shared by every public page
export default function LegalFooterLinks() {
    return (
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-atlas-500">
            <Link href="/mentions-legales" className="hover:text-accent-600 transition-colors">
                Mentions légales
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/confidentialite" className="hover:text-accent-600 transition-colors">
                Politique de confidentialité
            </Link>
        </nav>
    );
}
