import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
    title: 'Mentions légales — ENSATE-SHARE',
    description: "Informations légales sur l'éditeur et l'hébergement d'ENSATE-SHARE.",
};

const CONTACT_EMAIL = 'ade.ensa.tetouan@uae.ac.ma';

export default function MentionsLegalesPage() {
    return (
        <LegalPage title="Mentions légales" lastUpdated="27 septembre 2026">
            <section>
                <h2>Éditeur du site</h2>
                <p>
                    ENSATE-SHARE est une plateforme de partage de documents académiques éditée par
                    l&apos;<strong>Association Des Etudiants (ADE)</strong> de l&apos;École Nationale des
                    Sciences Appliquées de Tétouan (ENSA Tétouan), Université Abdelmalek Essaâdi, Tétouan, Maroc.
                </p>
                <ul className="mt-3">
                    <li>
                        Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                    </li>
                    <li>Responsable de la publication : le bureau de l&apos;Association Des Etudiants (ADE)</li>
                </ul>
            </section>

            <section>
                <h2>Hébergement</h2>
                <p>Le site et son serveur sont hébergés par :</p>
                <p>
                    <strong>Vercel Inc.</strong>
                    <br />
                    440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
                    <br />
                    <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
                </p>
                <p>Services techniques utilisés par la plateforme :</p>
                <ul>
                    <li>Base de données : MongoDB Atlas (MongoDB, Inc.)</li>
                    <li>Stockage des documents : Google Drive (Google LLC)</li>
                    <li>Connexion avec Google : Google Identity Services (Google LLC)</li>
                </ul>
            </section>

            <section>
                <h2>Objet du site</h2>
                <p>
                    ENSATE-SHARE permet aux étudiants de l&apos;ENSA Tétouan de consulter et de télécharger
                    des documents pédagogiques (cours, TD, TP, examens) classés par filière, année, semestre
                    et module. Les documents sont déposés par des responsables désignés par l&apos;ADE.
                    La consultation est libre et ne nécessite pas de compte.
                </p>
                <p>
                    ENSATE-SHARE est une initiative étudiante. Ce n&apos;est pas un service officiel de
                    l&apos;ENSA Tétouan ni de l&apos;Université Abdelmalek Essaâdi.
                </p>
            </section>

            <section>
                <h2>Propriété intellectuelle</h2>
                <p>
                    Les documents pédagogiques partagés restent la propriété de leurs auteurs respectifs
                    (enseignants ou étudiants). Ils sont mis à disposition uniquement pour un usage personnel
                    et pédagogique. Toute reproduction ou diffusion à des fins commerciales est interdite.
                </p>
                <p>
                    Le nom ENSATE-SHARE, son logo et la conception du site appartiennent à l&apos;Association
                    Des Etudiants (ADE) de l&apos;ENSA Tétouan.
                </p>
                <h3>Signaler un contenu</h3>
                <p>
                    Si vous êtes l&apos;auteur d&apos;un document et que vous ne souhaitez pas qu&apos;il soit
                    partagé, ou si un contenu vous paraît illicite ou erroné, écrivez-nous à{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Le document concerné sera
                    examiné et retiré si nécessaire dans les meilleurs délais.
                </p>
            </section>

            <section>
                <h2>Responsabilité</h2>
                <p>
                    Les documents sont fournis tels quels, sans garantie d&apos;exactitude ni
                    d&apos;exhaustivité. L&apos;ADE ne peut être tenue responsable d&apos;une erreur dans un
                    document ni d&apos;une indisponibilité temporaire du service.
                </p>
            </section>

            <section>
                <h2>Données personnelles</h2>
                <p>
                    Le traitement des données personnelles est décrit dans la{' '}
                    <Link href="/confidentialite">politique de confidentialité</Link>.
                </p>
            </section>

            <section>
                <h2>Droit applicable</h2>
                <p>Les présentes mentions légales sont soumises au droit marocain.</p>
            </section>
        </LegalPage>
    );
}
