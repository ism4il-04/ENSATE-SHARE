import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
    title: "Conditions d'utilisation — ENSATE-SHARE",
    description: "Règles d'utilisation de la plateforme de partage de documents ENSATE-SHARE.",
};

const CONTACT_EMAIL = 'ade.ensa.tetouan@uae.ac.ma';

export default function ConditionsPage() {
    return (
        <LegalPage title="Conditions d'utilisation" lastUpdated="27 septembre 2026">
            <section>
                <h2>À quoi sert ENSATE-SHARE</h2>
                <p>
                    ENSATE-SHARE est une plateforme créée par et pour les étudiants de l&apos;ENSA Tétouan. Son
                    seul but est de <strong>faciliter le partage des documents pédagogiques entre
                    étudiants</strong> : cours, TD, TP et examens.
                </p>
                <p>
                    Aujourd&apos;hui, ces documents circulent souvent de façon dispersée : groupes de messagerie,
                    Drive personnels, captures d&apos;écran, fichiers renvoyés d&apos;une promotion à
                    l&apos;autre. ENSATE-SHARE les rassemble au même endroit,{' '}
                    <strong>classés par filière, année, semestre, module et type</strong>, pour que chacun
                    retrouve rapidement le bon document.
                </p>
                <p>
                    ENSATE-SHARE est gérée par l&apos;Association Des Etudiants (ADE). Ce n&apos;est pas un
                    service officiel de l&apos;ENSA Tétouan ni de l&apos;Université Abdelmalek Essaâdi, et elle ne
                    remplace pas les supports ni les consignes transmis par les enseignants.
                </p>
                <p>
                    En utilisant la plateforme, vous acceptez les présentes conditions.
                </p>
            </section>

            <section>
                <h2>Accès et comptes</h2>
                <ul>
                    <li>
                        La consultation des documents est réservée aux étudiants de l&apos;ENSA Tétouan, qui se
                        connectent avec leur compte Google universitaire (@etu.uae.ac.ma).
                    </li>
                    <li>
                        Les responsables (délégués chargés du dépôt) et les administrateurs sont désignés par
                        l&apos;ADE.
                    </li>
                    <li>
                        Votre compte est personnel : ne partagez pas votre accès et ne vous connectez pas pour
                        quelqu&apos;un d&apos;autre.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Utilisation des documents</h2>
                <ul>
                    <li>
                        Les documents sont destinés à un usage <strong>personnel et pédagogique</strong> :
                        réviser, préparer un TD, un TP ou un examen.
                    </li>
                    <li>
                        Il est interdit de les vendre, de les republier en masse sur un autre site ou une autre
                        application, ou de les utiliser à des fins commerciales.
                    </li>
                    <li>
                        Les documents restent la propriété de leurs auteurs (enseignants ou étudiants).
                        ENSATE-SHARE ne fait que faciliter leur accès entre étudiants.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Règles pour les responsables</h2>
                <p>Les responsables qui déposent des documents s&apos;engagent à :</p>
                <ul>
                    <li>déposer uniquement des documents pédagogiques en lien avec le module choisi ;</li>
                    <li>
                        bien les classer (semestre, module, type) et leur donner un nom ou un label clair, pour
                        que la plateforme reste organisée ;
                    </li>
                    <li>
                        ne pas déposer un document qu&apos;un enseignant a demandé de ne pas diffuser, ni un
                        contenu illicite, offensant ou sans rapport avec les études ;
                    </li>
                    <li>ne pas déposer de données personnelles (notes nominatives, copies d&apos;étudiants identifiables, etc.) ;</li>
                    <li>retirer ou corriger un document erroné dès qu&apos;ils le constatent.</li>
                </ul>
            </section>

            <section>
                <h2>Ce qui est interdit</h2>
                <ul>
                    <li>Tenter d&apos;accéder à un compte, une page ou une fonction qui ne vous est pas destinée</li>
                    <li>Contourner les protections de la plateforme ou perturber son fonctionnement</li>
                    <li>Télécharger l&apos;ensemble des documents de façon automatisée (robots, scripts)</li>
                    <li>Utiliser la plateforme pour autre chose que le partage de documents pédagogiques</li>
                </ul>
            </section>

            <section>
                <h2>Signalement, retrait et suspension</h2>
                <p>
                    Si un document vous semble erroné, mal classé, ou s&apos;il ne devrait pas être partagé
                    (notamment si vous en êtes l&apos;auteur), écrivez à{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Il sera examiné et, si nécessaire,
                    retiré dans les meilleurs délais.
                </p>
                <p>
                    En cas de non-respect de ces conditions, l&apos;ADE peut retirer un document, et suspendre ou
                    supprimer un compte.
                </p>
            </section>

            <section>
                <h2>Disponibilité et responsabilité</h2>
                <p>
                    ENSATE-SHARE est un projet étudiant bénévole. Les documents sont fournis tels quels, sans
                    garantie d&apos;exactitude ni d&apos;exhaustivité : en cas de doute, référez-vous aux supports
                    officiels de vos enseignants. La plateforme peut être temporairement indisponible, notamment
                    pour maintenance.
                </p>
            </section>

            <section>
                <h2>Données personnelles</h2>
                <p>
                    Les données collectées et vos droits sont décrits dans la{' '}
                    <Link href="/confidentialite">politique de confidentialité</Link>. Les informations sur
                    l&apos;éditeur et l&apos;hébergeur figurent dans les{' '}
                    <Link href="/mentions-legales">mentions légales</Link>.
                </p>
            </section>

            <section>
                <h2>Modifications et droit applicable</h2>
                <p>
                    Ces conditions peuvent évoluer avec la plateforme ; la date de dernière mise à jour est
                    indiquée en haut de la page. Elles sont soumises au droit marocain. Pour toute question :{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
            </section>
        </LegalPage>
    );
}
