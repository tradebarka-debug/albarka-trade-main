Mise à jour du 8 septembre 2026 : migrations appliquées après autorisation ; tests transactionnels de statut et de disponibilité réussis. Voir docs/migrations-appliquees-20260908.md. Le protocole initial ci-dessous reste utile pour la vérification des interfaces.

# Validation du suivi client

Les migrations restent locales et ne doivent pas être appliquées avant la fin des modifications convenues.

- `node --test tests/orderTracking.test.cjs` : chronologie, statuts historiques du livreur, commande terminée, réponses anciennes, position périmée et estimation.
- `tests/customerTracking.readonly.sql` : cinq assertions avec des données fictives, uniquement en lecture. Vérifie la file d’attente, la correspondance des statuts et la confidentialité des coordonnées du livreur. Exécuté contre le schéma existant, sans appliquer de migration.
- La compilation Vite/PWA est vérifiée avec `npm run build`.

Après application des migrations dans un environnement de test, vérifier le parcours complet avec deux sessions (client et livreur) :

1. Passer une précommande en étant connecté. Retrouver son numéro dans le suivi du même compte sur un autre navigateur.
2. Confirmer les disponibilités, le paiement et la préparation. Observer le suivi sans cliquer sur Actualiser.
3. Attribuer un livreur. Vérifier son nom et son téléphone avec le compte du client ; un autre compte ou un invité ne doit pas recevoir ces coordonnées.
4. Accepter, récupérer, partir et livrer depuis l’espace livreur. Le client doit recevoir chaque changement. Le partage GPS est volontaire, limité à la livraison courante et à une position datant de moins de deux minutes.
5. Marquer une livraison terminée depuis la gestion des commandes. Elle doit aussi être terminée dans l’espace livreur. Tenter de revenir à un état antérieur doit échouer en base, y compris depuis une ancienne page encore ouverte.
6. Confirmer si nécessaire un paiement à la livraison après la remise : la confirmation financière reste possible sans rouvrir le suivi.
7. Couper puis rétablir le réseau. Les dernières données restent affichées, puis se rafraîchissent automatiquement. Changer de compte : aucun historique du compte précédent ne doit rester affiché.

Limites connues : les anciennes commandes sans `customer_id` ne sont pas attribuées automatiquement sur la seule base d’un téléphone non vérifié. L’estimation d’arrivée n’apparaît que si le service de livraison fournit `estimated_delivery_minutes` et que le trajet a démarré. Les déclencheurs et la diffusion temps réel ne sont pas encore testés de bout en bout, car les migrations ne sont pas appliquées.
