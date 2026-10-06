# ShellSpell Kubernetes

Simplified Kubernetes manifests using CloudNativePG (CNPG) and cert-manager.

## Architecture

- **PostgreSQL Database ([`db.yaml`](./db.yaml)):** Managed by CloudNativePG (`Cluster` resource). Automatically handles storage provisioning, failover, and provides `db-rw:5432` for primary read-write traffic.
- **Backend & Frontend Workloads ([`deployment.yaml`](./deployment.yaml)):** Deployments and internal ClusterIP services for the Spring Boot REST backend and Nginx frontend.
- **Ingress Load Balancer ([`ingress.yaml`](./ingress.yaml)):** Layer 7 Ingress routing external traffic with `cert-manager` Let's Encrypt TLS automation.

## Manifests

| File | Description |
|---|---|
| [`db.yaml`](./db.yaml) | CloudNativePG PostgreSQL Cluster (`db`) and application credentials secret |
| [`deployment.yaml`](./deployment.yaml) | Backend and frontend Deployments, ConfigMap, and internal Services |
| [`ingress.yaml`](./ingress.yaml) | Ingress load balancer with Let's Encrypt TLS via `cert-manager` |

## Deploy

```bash
# Apply all manifests to the cluster
kubectl apply -f k8s/
```

## Verify

```bash
# Check CloudNativePG cluster status
kubectl get cluster.postgresql.cnpg.io -n shellspell

# Check all workloads, services, and ingress
kubectl get all,ingress -n shellspell
```

## Teardown

```bash
kubectl delete -f k8s/
```
