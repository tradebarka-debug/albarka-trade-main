# Préparation de l’audit global

Date : 8 septembre 2026.

Le contrôle fonctionnel est déclaré terminé par le demandeur pour les espaces PDG, gérant, caissier, comptable, cuisinier, livreur et suivi client. Cela ne constitue pas encore une validation technique globale. Les constats détaillés des autres espaces devront être rapprochés de leurs comptes rendus ; ils ne sont pas inventés dans ce document.

## LIV-01 — Disponibilité du livreur perdue après actualisation

Priorité : élevée. Mise à jour : correction en base appliquée et tests transactionnels réussis ; correction React locale préparée. Voir migrations-appliquees-20260908.md. Le constat initial est conservé ci-dessous.

Scénario signalé : le livreur active « Je suis disponible », puis actualise la page. L’interface le présente de nouveau comme indisponible.

Constat dans le code local actuel :

- `DriverDashboard.tsx` écrit `is_available: true` avec un `upsert` lors de l’activation.
- Il relit `is_available` et `current_delivery_id` depuis `driver_status` au chargement et lors des actualisations.
- L’état React est initialisé à `false`, mais aucune écriture Supabase à `false` n’est effectuée au simple chargement.
- En cas d’erreur de lecture de la disponibilité OU des livraisons, la valeur initiale peut rester affichée. Un état inconnu doit être distingué d’une indisponibilité confirmée.
- La désactivation utilise `update` sans vérifier qu’une ligne a effectivement été modifiée. Les écritures devront retourner la ligne enregistrée, puis mettre à jour l’affichage à partir de cette réponse.
- La disponibilité, l’occupation par une livraison et la fraîcheur GPS sont actuellement liées. Les déclencheurs observés en lecture seule lors de la vérification précédente mettent le livreur indisponible à l’attribution puis disponible à la fin. Il faut distinguer son choix volontaire de sa capacité immédiate à recevoir une livraison.

Plan de correction et de validation :

1. Reproduire avec une session de livreur et vérifier la valeur réellement enregistrée avant et après actualisation, reconnexion et ouverture sur un second appareil.
2. Vérifier les autorisations SQL et RLS SELECT, INSERT et UPDATE pour la ligne `driver_id = auth.uid()`, ainsi que la clé de conflit de l’upsert. Les politiques observées précédemment autorisent ces opérations sur la ligne du livreur ; leur fonctionnement effectif reste à tester avec son rôle.
3. Charger la disponibilité indépendamment du résultat de la lecture des livraisons. Afficher un état de chargement ou d’erreur plutôt que déduire `false` d’un échec réseau.
4. Vérifier la ligne renvoyée après chaque écriture et éviter qu’une ancienne requête de lecture écrase le résultat d’une activation récente.
5. Conserver le choix du livreur jusqu’à sa désactivation explicite. Une mission en cours peut empêcher une nouvelle attribution sans effacer ce choix.
6. Définir séparément toute éventuelle expiration pour inactivité : durée, activité prise en compte et information du livreur. Aucune durée n’est décidée ni activée à ce stade. Le seuil GPS de deux minutes du suivi client concerne uniquement l’affichage d’une position récente.
7. Tester activation → actualisation → reconnexion ; désactivation → actualisation ; erreur réseau/RLS ; lecture concurrente ; attribution puis fin de livraison. Une actualisation seule ne doit jamais modifier la disponibilité persistée.

## Suivi client — corrections locales préparées

Chronologie complète, historique du compte, notifications temps réel, coordonnées du livreur protégées, position récente, estimation conditionnelle, file d’attente explicite et protection des commandes terminées.

Validation déjà effectuée : 27 tests de logique, 5 assertions SQL en lecture seule, vérification statique ciblée et compilation Vite/PWA. Le protocole complémentaire est décrit dans `tests/customer-tracking-validation.md`.

## Passage à l’audit final

Consolider les constats de chaque espace, attribuer une priorité et un statut, vérifier les droits par rôle et dérouler le parcours précommande → paiement → préparation → livraison → comptabilisation. Distinguer les corrections locales des corrections déployées et des résultats effectivement validés.

Après autorisation du demandeur, les trois migrations du suivi et de la disponibilité ont été appliquées le 8 septembre 2026. Voir migrations-appliquees-20260908.md pour le périmètre exact et les validations restantes.