# ShellSpell Kubernetes Deployment

This directory contains the production-ready Kubernetes manifests ported from `docker-compose.yml`.

## Architecture Overview

```
                          Internet / Clients
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Kubernetes Ingress  │ ◄── cert-manager (Let's Encrypt TLS)
                     │ (L7 Load Balancer)    │
                     └──────────┬────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │ /api                                          │ /
        ▼                                               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│ Service: shellspell-backend   │       │ Service: shellspell-frontend  │
│ (ClusterIP, Round-Robin LB)   │       │ (ClusterIP, Round-Robin LB)   │
└───────────────┬───────────────┘       └───────────────┬───────────────┘
                │                                       │
        ┌───────┴───────┐                       ┌───────┴───────┐
        ▼               ▼                       ▼               ▼
┌──────────────┐ ┌──────────────┐       ┌──────────────┐ ┌──────────────┐
│ backend pod  │ │ backend pod  │       │ frontend pod │ │ frontend pod │
└───────┬──────┘ └───────┬──────┘       └──────────────┘ └──────────────┘
        │                │
        └───────┬────────┘
                │
                ▼
┌───────────────────────────────┐
│ Service: shellspell-db (5432) │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ StatefulSet: shellspell-db    │
│  - postgres:15-alpine         │
│  - PersistentVolume (2Gi PVC) │
└───────────────────────────────┘
```

## Directory Manifests

| File | Kind | Description |
|---|---|---|
| [`namespace.yaml`](./namespace.yaml) | `Namespace` | Dedicated `shellspell` namespace |
| [`secret.yaml`](./secret.yaml) | `Secret` | Sensitive credentials (`POSTGRES_PASSWORD`, `JWT_SECRET`, datasource credentials) |
| [`configmap.yaml`](./configmap.yaml) | `ConfigMap` | Application configurations (`SPRING_DATASOURCE_URL`, `JWT_EXPIRATION_MS`, etc.) |
| [`db-statefulset.yaml`](./db-statefulset.yaml) | `StatefulSet` | PostgreSQL 15 database with automated PVC storage and readiness/liveness probes |
| [`db-service.yaml`](./db-service.yaml) | `Service` | Internal ClusterIP services (`shellspell-db` and alias `db`) |
| [`backend-deployment.yaml`](./backend-deployment.yaml) | `Deployment` | Spring Boot REST API (2 replicas, DB wait initContainer, startup/readiness/liveness probes) |
| [`backend-service.yaml`](./backend-service.yaml) | `Service` | Internal ClusterIP services (`shellspell-backend` and alias `backend`) |
| [`frontend-nginx-config.yaml`](./frontend-nginx-config.yaml) | `ConfigMap` | Custom Nginx config supporting SPA routing, SSE streaming, and HTTP port 80 |
| [`frontend-deployment.yaml`](./frontend-deployment.yaml) | `Deployment` | Nginx SPA frontend (2 replicas, health probes) |
| [`frontend-service.yaml`](./frontend-service.yaml) | `Service` | Internal ClusterIP service (`shellspell-frontend`) |
| [`ingress.yaml`](./ingress.yaml) | `Ingress` | Ingress load balancer configured with `cert-manager` for automated TLS |
| [`kustomization.yaml`](./kustomization.yaml) | `Kustomization` | Bundles and manages all resources for atomic deployment |

---

## Ingress & cert-manager Configuration

The Ingress is configured in [`ingress.yaml`](./ingress.yaml) as a simple Layer 7 load balancer:
- **cert-manager Integration**: Automatically requests and renews valid TLS certificates from Let's Encrypt using the `cert-manager.io/cluster-issuer: letsencrypt-prod-cluster-issuer` annotation (can be switched to `letsencrypt-staging-cluster-issuer` for testing).
- **Path-Based Load Balancing**:
  - `/api` requests are load balanced directly to the `shellspell-backend` service (port 8080).
  - All other requests (`/`) are load balanced directly to the `shellspell-frontend` service (port 80).
- **Backend & Frontend Pod Balancing**: Both backend and frontend deployments run with multiple replicas (`replicas: 2`). Their respective Services specify `sessionAffinity: None`, ensuring requests are evenly distributed across all healthy pods via round-robin.

### Customizing Domain Name
In [`ingress.yaml`](./ingress.yaml), update `shellspell.ygg.dedyn.io` to your desired domain:
```yaml
spec:
  tls:
    - hosts:
        - your-domain.com
      secretName: shellspell-tls
  rules:
    - host: your-domain.com
      http: ...
```

---

## Deployment Instructions

### Prerequisites
1. A running Kubernetes cluster (v1.24+).
2. `kubectl` CLI configured to communicate with your cluster.
3. `cert-manager` installed and configured with a `ClusterIssuer` (e.g. `letsencrypt-prod-cluster-issuer`).
4. An Ingress controller (e.g., Traefik or NGINX Ingress).

### 1. Deploy all manifests using Kustomize (Recommended)
```bash
kubectl apply -k k8s/
```

Alternatively, apply standard YAML manifests directly:
```bash
kubectl apply -f k8s/
```

### 2. Verify Deployment Status
Check the status of all workloads:
```bash
kubectl get all -n shellspell
```

Check PersistentVolumeClaim binding:
```bash
kubectl get pvc -n shellspell
```

Check Ingress and cert-manager certificate issuance:
```bash
kubectl get ingress -n shellspell
kubectl get certificate -n shellspell
kubectl describe certificate shellspell-tls -n shellspell
```

### 3. Teardown
To remove the application and all associated resources:
```bash
kubectl delete -k k8s/
```
*(Note: To retain the database volume, delete workloads individually rather than the PVC).*
