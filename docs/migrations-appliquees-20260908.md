# Migrations appliquées — 8 septembre 2026

Projet Supabase : `gylglwzlnncaqiyzcqci`.

| Version distante | Migration | Résultat |
| --- | --- | --- |
| 20260908065228 | customer_order_timeline | Appliquée |
| 20260908065237 | reliable_customer_tracking | Appliquée |
| 20260908065243 | persist_driver_availability | Appliquée |

Les fichiers locaux portent les versions réellement enregistrées par Supabase. La migration de suppression gouvernée des comptes était déjà appliquée et n’a pas été rejouée. Les différences historiques de versions locales/distantes préexistantes ne sont pas réparées globalement par cette opération.

## Contrôles effectués en base

Deux transactions de validation, toutes deux annulées par ROLLBACK :

- Commande et livraison fictives : parcours accepted → picked_up → in_progress → delivered ; vérification des statuts correspondants de la commande et de sa date de livraison.
- Refus de réouverture de la commande et de la livraison. Confirmation financière possible après remise, sans réouverture du suivi.
- Sous le rôle authenticated avec l’identité d’un livreur existant : upsert puis relecture de sa disponibilité, refus de modifier un autre livreur, parcours de livraison autorisé par les RLS.
- L’attribution conserve une disponibilité volontaire active ; une désactivation volontaire pendant la mission reste respectée après sa fin.

Aucune donnée de test n’a été conservée. Vérification statique du fichier livreur et compilation Vite/PWA réussies.

## LIV-01

Correction en base appliquée : `is_available` conserve le choix volontaire ; `current_delivery_id` représente l’occupation. Aucun délai d’inactivité arbitraire n’est activé et aucun ancien choix n’est modifié par la migration.

Correction d’interface locale : état inconnu pendant le chargement, lecture indépendante des livraisons, erreur explicite, vérification de la ligne renvoyée par l’écriture et protection contre une réponse de lecture ancienne.

La mise en production des fichiers React n’est pas effectuée par les migrations SQL. La vérification visuelle après actualisation/reconnexion reste à faire avec cette version de l’interface.

## Périmètre et sécurité

Cette opération valide le lot suivi client/livreur, pas tous les espaces de l’application. Le contrôle de sécurité Supabase ne présente aucune erreur et aucune nouvelle alerte après migration. Les 54 informations et 72 avertissements restants préexistaient au lot et restent à examiner dans l’audit global.

[Documentation des contrôles de sécurité Supabase](https://supabase.com/docs/guides/database/database-linter).
