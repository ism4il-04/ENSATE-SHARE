import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
    title: 'Politique de confidentialité — ENSATE-SHARE',
    description: 'Comment ENSATE-SHARE collecte, utilise et protège vos données personnelles.',
};

const CONTACT_EMAIL = 'ade.ensa.tetouan@uae.ac.ma';

export default function ConfidentialitePage() {
    return (
        <LegalPage title="Politique de confidentialité" lastUpdated="27 septembre 2026">
            <section>
                <p>
                    Cette politique explique quelles données personnelles ENSATE-SHARE collecte, pourquoi,
                    combien de temps elles sont conservées et quels sont vos droits, conformément à la
                    loi marocaine n° 09-08 relative à la protection des personnes physiques à l&apos;égard du
                    traitement des données à caractère personnel.
                </p>
            </section>

            <section>
                <h2>Responsable du traitement</h2>
                <p>
                    L&apos;<strong>Association Des Etudiants (ADE)</strong> de l&apos;ENSA Tétouan, éditrice du
                    site (voir les <Link href="/mentions-legales">mentions légales</Link>).
                    <br />
                    Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </p>
            </section>

            <section>
                <h2>Si vous visitez le site</h2>
                <p>
                    La page d&apos;accueil et les pages d&apos;information sont accessibles sans compte.
                </p>
                <ul>
                    <li>
                        <strong>Statistiques de fréquentation :</strong> nous utilisons Vercel Web Analytics et
                        Speed Insights pour compter les pages vues et mesurer la vitesse du site. Ces outils
                        produisent des statistiques anonymes et agrégées, sans cookie et sans suivi d&apos;un
                        visiteur d&apos;un site à l&apos;autre.
                    </li>
                    <li>
                        <strong>Journaux techniques :</strong> comme tout hébergeur, Vercel peut enregistrer
                        temporairement des informations techniques (adresse IP, date, page demandée) pour
                        assurer la sécurité et le bon fonctionnement du service.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Si vous êtes étudiant</h2>
                <p>
                    La consultation et le téléchargement des documents sont réservés aux étudiants de
                    l&apos;ENSA Tétouan. Vous vous connectez avec votre compte Google universitaire
                    (@etu.uae.ac.ma) ; votre compte ENSATE-SHARE est créé automatiquement à la première
                    connexion. Nous conservons :
                </p>
                <ul>
                    <li>Votre adresse email universitaire, votre nom et votre prénom, transmis par Google</li>
                    <li>La date de votre dernière connexion</li>
                    <li>Les parcours que vous choisissez d&apos;enregistrer (6 au maximum)</li>
                </ul>
                <p>
                    Nous ne recevons jamais votre mot de passe Google, et nous n&apos;enregistrons pas les
                    documents que vous consultez.
                </p>
                <p>
                    Les adresses @etu.uae.ac.ma étant communes à tous les établissements de l&apos;Université
                    Abdelmalek Essaâdi, l&apos;ADE peut enregistrer la liste des adresses universitaires des
                    étudiants de l&apos;ENSA Tétouan. Dans ce cas, seules les adresses de cette liste peuvent se
                    connecter.
                </p>
            </section>

            <section>
                <h2>Si vous êtes responsable ou administrateur</h2>
                <p>
                    Seuls les responsables de filière et les administrateurs ont un compte. Les comptes sont
                    créés par un administrateur ; il n&apos;est pas possible de s&apos;inscrire soi-même.
                </p>
                <h3>Données du compte</h3>
                <ul>
                    <li>Nom, prénom et adresse email</li>
                    <li>Année et filière dont vous êtes responsable</li>
                    <li>
                        Mot de passe : il est stocké uniquement sous forme chiffrée (hachage bcrypt) et
                        n&apos;est jamais lisible, même par les administrateurs
                    </li>
                </ul>
                <h3>Journal d&apos;activité</h3>
                <p>
                    Pour la sécurité et la traçabilité du service, les actions effectuées depuis un compte
                    sont enregistrées : connexions et déconnexions (date, adresse IP, méthode de connexion),
                    dépôts, modifications et suppressions de documents, et modifications des comptes et de la
                    structure des filières. Ce journal n&apos;est consultable que par les administrateurs.
                </p>
                <h3>Tentatives de connexion échouées</h3>
                <p>
                    Pour bloquer les tentatives de piratage, l&apos;adresse email saisie et l&apos;adresse IP
                    sont enregistrées après un échec de connexion. Ces données sont supprimées automatiquement
                    au bout de 15 minutes.
                </p>
                <h3>Connexion avec Google</h3>
                <p>
                    Si vous choisissez « Se connecter avec Google », Google nous transmet votre adresse email
                    et confirme qu&apos;elle est vérifiée. Nous l&apos;utilisons uniquement pour retrouver votre
                    compte. Nous ne recevons jamais votre mot de passe Google.
                </p>
                <h3>Documents déposés</h3>
                <p>
                    Les documents déposés sont publics : ils sont stockés sur Google Drive et accessibles à
                    toute personne disposant du lien. Le nom et le prénom de la personne qui a déposé un
                    document peuvent y être associés.
                </p>
            </section>

            <section>
                <h2>Pourquoi ces données sont utilisées</h2>
                <ul>
                    <li>Réserver l&apos;accès aux documents aux étudiants de l&apos;ENSA Tétouan</li>
                    <li>Vous permettre d&apos;accéder directement à vos parcours enregistrés</li>
                    <li>Permettre aux responsables de se connecter et de gérer les documents de leur filière</li>
                    <li>Protéger la plateforme contre les accès non autorisés et les abus</li>
                    <li>Garder une trace des modifications pour pouvoir corriger une erreur ou un incident</li>
                </ul>
                <p>
                    Vos données ne sont jamais vendues, ni utilisées à des fins publicitaires, ni partagées
                    avec des tiers en dehors des prestataires techniques ci-dessous.
                </p>
            </section>

            <section>
                <h2>Prestataires techniques et lieu de stockage</h2>
                <p>
                    Les données sont traitées par les prestataires suivants, qui peuvent les stocker hors du
                    Maroc (notamment aux États-Unis et en Europe) :
                </p>
                <ul>
                    <li><strong>Vercel Inc.</strong> : hébergement du site et du serveur</li>
                    <li><strong>MongoDB, Inc.</strong> (MongoDB Atlas) : base de données des comptes, des parcours enregistrés et du journal</li>
                    <li><strong>Google LLC</strong> : stockage des documents (Google Drive) et connexion avec Google</li>
                </ul>
            </section>

            <section>
                <h2>Durée de conservation</h2>
                <ul>
                    <li>
                        Données du compte (étudiants, responsables et administrateurs) : tant que le compte existe ;
                        elles sont effacées quand le compte est supprimé, sur simple demande
                    </li>
                    <li>Tentatives de connexion échouées : 15 minutes</li>
                    <li>
                        Session de connexion : 30 jours pour les étudiants ; pour les responsables, jusqu&apos;à
                        la fermeture du navigateur (24 heures maximum), ou 30 jours s&apos;ils cochent « Rester
                        connecté »
                    </li>
                    <li>
                        Journal d&apos;activité : conservé pour la sécurité et la traçabilité du service ; vous
                        pouvez demander la suppression des entrées qui vous concernent
                    </li>
                </ul>
            </section>

            <section>
                <h2>Cookies</h2>
                <p>
                    ENSATE-SHARE n&apos;utilise aucun cookie publicitaire ni de suivi. Un seul cookie est
                    déposé, et uniquement lorsque vous vous connectez : le cookie de session{' '}
                    <code className="px-1 rounded bg-cream-200 text-atlas-800">token</code>. Il est
                    indispensable pour rester connecté, n&apos;est pas lisible par les scripts de la page et
                    est supprimé à la déconnexion.
                </p>
                <p>
                    Le bouton « Se connecter avec Google » est fourni par Google, qui
                    peut déposer ses propres cookies selon sa{' '}
                    <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer">
                        politique de confidentialité
                    </a>.
                </p>
            </section>

            <section>
                <h2>Sécurité</h2>
                <p>
                    Les échanges avec le site sont chiffrés (HTTPS), les mots de passe sont hachés, les
                    tentatives de connexion sont limitées et l&apos;accès aux fonctions d&apos;administration
                    est réservé aux comptes autorisés.
                </p>
            </section>

            <section>
                <h2>Vos droits</h2>
                <p>
                    Conformément à la loi n° 09-08, vous disposez d&apos;un droit d&apos;accès, de
                    rectification et d&apos;opposition au traitement de vos données. Pour les exercer, ou pour
                    toute question, écrivez à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
                <p>
                    Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission
                    Nationale de contrôle de la protection des Données à caractère Personnel (CNDP) :{' '}
                    <a href="https://www.cndp.ma" target="_blank" rel="noopener noreferrer">www.cndp.ma</a>.
                </p>
            </section>

            <section>
                <h2>Modifications</h2>
                <p>
                    Cette politique peut être mise à jour, par exemple lors de l&apos;ajout d&apos;une
                    fonctionnalité. La date de dernière mise à jour est indiquée en haut de la page.
                </p>
            </section>
        </LegalPage>
    );
}
