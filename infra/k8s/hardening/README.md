# Endurecimiento de Kubernetes (revisar antes de activar)

Estos manifests cierran hallazgos de la auditoría de seguridad (junio 2026) que
**NO** se aplican automáticamente porque un error de configuración puede tumbar
producción. Revisa, prueba en staging y luego añádelos a
`infra/k8s/base/kustomization.yaml` (o a un overlay).

## Contenido

| Archivo | Hallazgo | Riesgo al activar |
|---|---|---|
| `securitycontext-patch.yaml` | Pods corren como root (sin `securityContext`) | Bajo. Todas las imágenes ya usan `USER node` (UID 1000); `moderation-service` se corrigió en su Dockerfile. Verifica que ningún proceso escriba fuera de `/tmp`. |
| `rbac.yaml` | Pods usan la ServiceAccount `default` con acceso amplio al API server | Bajo, pero requiere añadir `serviceAccountName` a los deployments. |
| `networkpolicy.yaml` | Sin segmentación de red (cualquier pod habla con cualquier pod) | **Alto**. Es default-deny. Si las etiquetas/puertos no calzan exactamente con tus servicios, se corta el tráfico interno. Probar en staging. |

## Cómo activar (tras revisar)

1. Aplica `securitycontext-patch.yaml` como patch estratégico en kustomize:
   ```yaml
   # en kustomization.yaml
   patches:
     - path: hardening/securitycontext-patch.yaml
       target:
         kind: Deployment
   ```
2. `rbac.yaml`: añade `serviceAccountName: piums-app` al `spec.template.spec` de
   cada deployment (o vía patch).
3. `networkpolicy.yaml`: aplícalo **último** y observa logs. Requiere un CNI que
   soporte NetworkPolicy (DOKS/Cilium lo soporta).

## Pendiente manual (no es manifest)

- **Tags de imagen `:latest`** en `deployments.yaml`: migrar a versión fija
  (`:v1.2.3`) para builds reproducibles y rollback. Cambiar `imagePullPolicy` a
  `IfNotPresent`.
- **INF-M2 (cifrado de Secrets en reposo / etcd)**: en DigitalOcean DOKS el
  plano de control (etcd) es gestionado y cifrado por el proveedor — confirmar en
  su documentación y cerrar el hallazgo, o habilitar un KMS/sealed-secrets si se
  requiere control propio.
- **Rate limiting a nivel ingress**: añadir anotaciones
  `nginx.ingress.kubernetes.io/limit-rps` y `limit-connections` en
  `infra/k8s/base/ingress.yaml`.
