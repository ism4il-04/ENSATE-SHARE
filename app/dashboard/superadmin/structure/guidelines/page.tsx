'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Info, FolderTree } from 'lucide-react';

export default function StructureGuidelinesPage() {
    return (
        <div className="min-h-screen bg-cream-100">
            <div className="max-w-4xl mx-auto px-6 py-8 sm:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/dashboard/superadmin/structure"
                        className="inline-flex items-center gap-2 text-atlas-600 hover:text-atlas-800 mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Retour à la structure
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-cream-300 shadow-sm flex items-center justify-center shrink-0">
                            <FolderTree className="w-6 h-6 text-accent-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-atlas-800 tracking-tight">
                                Guide d'édition de la structure
                            </h1>
                            <p className="text-atlas-600 text-sm mt-0.5">
                                Bonnes pratiques pour éviter les conflits avec Google Drive
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="card border border-accent-200 bg-accent-50/50 mb-8">
                    <div className="flex items-start gap-3">
                        <Info className="text-accent-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-atlas-800 mb-1">
                                Synchronisation automatique avec Google Drive
                            </h3>
                            <p className="text-sm text-atlas-700">
                                Lorsque vous modifiez la structure académique, les dossiers correspondants dans Google Drive sont automatiquement mis à jour. Suivez ces recommandations pour garantir une synchronisation sans erreur.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Do's Section */}
                <section className="card border border-green-200 bg-green-50/30 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="text-green-600" size={24} />
                        <h2 className="text-xl font-bold text-atlas-800">À faire</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-green-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="text-green-600" size={18} />
                                Traiter les modules comme des clés stables
                            </h3>
                            <p className="text-sm text-atlas-700 mb-2">
                                Lorsque vous souhaitez renommer un module, modifiez <strong>un seul nom de module à la fois</strong> dans un semestre.
                            </p>
                            <p className="text-sm text-atlas-600">
                                Le système détectera automatiquement le renommage et mettra à jour tous les fichiers associés ainsi que le dossier correspondant dans Google Drive.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-green-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="text-green-600" size={18} />
                                Garder les noms de modules uniques dans un semestre
                            </h3>
                            <p className="text-sm text-atlas-700">
                                Dans un même semestre <code className="text-xs bg-cream-100 px-1.5 py-0.5 rounded">(cycle, année, semestre)</code>, évitez d'avoir deux modules différents avec exactement le même nom. La logique des dossiers Drive suppose qu'un nom de module correspond à un seul dossier.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-green-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="text-green-600" size={18} />
                                Supprimer les modules uniquement lorsqu'ils sont vraiment supprimés
                            </h3>
                            <p className="text-sm text-atlas-700 mb-2">
                                Supprimer un module de la structure lorsqu'il n'y a plus de fichiers associés déclenchera :
                            </p>
                            <ul className="text-sm text-atlas-600 list-disc list-inside space-y-1 ml-2">
                                <li>La suppression du dossier du module dans Google Drive</li>
                                <li>Le nettoyage des dossiers parents vides (semestre/année/filière/cycle)</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-green-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="text-green-600" size={18} />
                                Maintenir les noms de filière/année/semestre stables une fois utilisés
                            </h3>
                            <p className="text-sm text-atlas-700">
                                Changer ces noms modifie également le chemin des dossiers dans Google Drive. Si vous devez les renommer, planifiez-le soigneusement.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Don'ts Section */}
                <section className="card border border-red-200 bg-red-50/30 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <XCircle className="text-red-600" size={24} />
                        <h2 className="text-xl font-bold text-atlas-800">À éviter</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-red-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <XCircle className="text-red-600" size={18} />
                                Ne pas renommer plusieurs modules à la fois dans le même semestre
                            </h3>
                            <p className="text-sm text-atlas-700 mb-2">
                                Si vous modifiez <strong>plusieurs noms de modules en une seule fois</strong>, le système peut ne pas être capable de déterminer quel ancien nom correspond à quel nouveau nom.
                            </p>
                            <p className="text-sm text-atlas-600">
                                Conséquence : les dossiers Drive peuvent ne pas être renommés automatiquement, ou certains changements peuvent être traités comme "suppression + ajout", laissant d'anciens dossiers Drive orphelins si des fichiers existent encore.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-red-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <XCircle className="text-red-600" size={18} />
                                Ne pas réutiliser un nom de module existant pour un autre module
                            </h3>
                            <p className="text-sm text-atlas-700 mb-2">
                                Exemple : renommer <code className="text-xs bg-cream-100 px-1.5 py-0.5 rounded">"Algo 1"</code> en <code className="text-xs bg-cream-100 px-1.5 py-0.5 rounded">"Algo 2"</code> alors qu'un autre module s'appelle déjà <code className="text-xs bg-cream-100 px-1.5 py-0.5 rounded">"Algo 2"</code>.
                            </p>
                            <p className="text-sm text-atlas-600">
                                Cela créera des conflits dans la base de données et dans les noms de dossiers Drive. La vérification de sécurité refusera le renommage dans ce cas.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-red-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <XCircle className="text-red-600" size={18} />
                                Ne pas supprimer un module qui contient encore des fichiers importants
                            </h3>
                            <p className="text-sm text-atlas-700 mb-2">
                                Si vous supprimez un module de la structure <strong>et</strong> que ce module n'a plus de fichiers, son dossier Drive sera supprimé.
                            </p>
                            <p className="text-sm text-atlas-600">
                                Si vous supprimez accidentellement un nom de module de la structure alors que des fichiers existent encore, nous laissons le dossier Drive et la base de données intacts, mais vous aurez alors des fichiers qui ne correspondent plus proprement à la structure visible.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-red-100">
                            <h3 className="font-semibold text-atlas-800 mb-2 flex items-center gap-2">
                                <XCircle className="text-red-600" size={18} />
                                Ne pas réorganiser massivement et renommer en une seule opération
                            </h3>
                            <p className="text-sm text-atlas-700 mb-2">
                                Réorganiser seul est acceptable (nous ignorons l'ordre), renommer un module est acceptable.
                            </p>
                            <p className="text-sm text-atlas-600">
                                Faire les deux massivement en même temps rend difficile la détection de quels modules ont été renommés vs supprimés vs ajoutés.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Best Practices */}
                <section className="card border border-cream-300/60 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="text-gold-600" size={24} />
                        <h2 className="text-xl font-bold text-atlas-800">Bonnes pratiques</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-accent-700 font-bold text-xs">1</span>
                            </div>
                            <div>
                                <p className="text-sm text-atlas-800 font-medium">Renommer un module à la fois</p>
                                <p className="text-xs text-atlas-600 mt-1">
                                    Modifiez un seul nom de module par semestre, sauvegardez, puis passez au suivant si nécessaire.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-accent-700 font-bold text-xs">2</span>
                            </div>
                            <div>
                                <p className="text-sm text-atlas-800 font-medium">Vérifier les fichiers avant suppression</p>
                                <p className="text-xs text-atlas-600 mt-1">
                                    Avant de supprimer un module, vérifiez qu'il n'y a plus de fichiers associés dans la page "Tous les fichiers".
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-accent-700 font-bold text-xs">3</span>
                            </div>
                            <div>
                                <p className="text-sm text-atlas-800 font-medium">Tester avec un module de test</p>
                                <p className="text-xs text-atlas-600 mt-1">
                                    Pour les opérations complexes, testez d'abord avec un module de test pour comprendre le comportement.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div className="flex justify-center mt-8">
                    <Link
                        href="/dashboard/superadmin/structure"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Retour à la structure
                    </Link>
                </div>
            </div>
        </div>
    );
}
