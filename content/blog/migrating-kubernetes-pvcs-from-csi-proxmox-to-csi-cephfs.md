---
title: 'Migrating Kubernetes PVCs from csi-proxmox to csi-cephfs'
description: "My journey moving from Proxmox VMs to CephFS as my k8s primary data storage."
date: 2025-04-16
categories: ['Kubernetes', 'Proxmox']
sitemap:
  lastmod: 2025-04-16
---

For a while now, I’ve been using [`csi-proxmox`](https://github.com/sergelogvinov/proxmox-csi-plugin) to provision Kubernetes PersistentVolumeClaims (PVCs) using virtual disks on my Proxmox nodes. It’s a solid setup for basic storage needs—especially if you're already deep in the Proxmox ecosystem, but I wanted more flexibility as my homelab grew.

Specifically, I was looking for a way to:

- Support **multi-node** read/write volumes
- Improve **resilience** and **availability**
- Simplify **storage management** with a shared backend

That’s when I started experimenting with **CephFS**. After getting it working inside my Proxmox cluster, I integrated it with Kubernetes using the `csi-cephfs` driver, and now I’m gradually migrating my workloads over to it. I am starting off with a single node cluster (I know, I know. This is not the best way to handle it.), but it's getting me started on the process and I'll be moving towards a real quorum soon!

Let me walk you through what that looks like, with a real example of how I migrated data from a `csi-proxmox` volume to a `csi-cephfs` volume using a simple pod-based approach.

## Why I'm Migrating to CephFS

Here's a quick overview of why I’m moving my PVCs to CephFS:

- ✅ **ReadWriteMany (RWX)** support — pods across nodes can share the same volume
- ✅ **Backups and snapshots** are easier to manage with Ceph
- ✅ No more VM disk sprawl tied to specific nodes
- ✅ Ceph already runs inside Proxmox, so no extra infra required

That being said, most of my workloads (especially StatefulSets) still had PVCs tied to the old `csi-proxmox` StorageClass.

I needed a way to safely migrate that data.

## The Migration Process

Here’s the overall flow I followed for each PVC migration:

1. Create a **new CephFS-based PVC**
2. Launch a pod that mounts both the **old** and **new** PVCs
3. Use `rsync` inside the pod to copy the data
4. Update the application to point to the new PVC
5. Clean up the old storage resources

Let’s break that down with a real example.

## Example: Migrating My Tautulli PVC

I have the [Tautulli](https://github.com/Tautulli/Tautulli) app running in Kubernetes, and its persistent data was on a `csi-proxmox` backed PVC. I wanted to move this to CephFS without losing anything or dealing with complicated downtime.

### Step 1: Create a New PVC for CephFS

First, I created a new PVC using my CephFS-backed StorageClass. Here's a sample YAML:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: tautulli-cephfs
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
  storageClassName: csi-cephfs-sc
```

### Step 2: Launch a Migration Pod

To copy data between PVCs, I created a pod that mounts both volumes and gives me an interactive shell:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pvc-migrator
spec:
  containers:
    - name: migrator
      image: ubuntu:22.04
      command: ["/bin/bash", "-c", "sleep infinity"]
      volumeMounts:
        - name: old-pvc
          mountPath: /mnt/old
        - name: new-pvc
          mountPath: /mnt/new
  volumes:
    - name: old-pvc
      persistentVolumeClaim:
        claimName: tautulli-data
    - name: new-pvc
      persistentVolumeClaim:
        claimName: tautulli-cephfs
  restartPolicy: Never
```

Then I connected to it:

```bash
kubectl exec -it pvc-migrator -- bash
```

And inside the container, I ran:

```bash
rsync -a /mnt/old/ /mnt/new/
```

This preserved file permissions, symlinks, and ownership during the migration.

### Step 3: Point Tautulli to the New PVC

After confirming the data was in place, I updated the Deployment to use `tautulli-cephfs` instead of `tautulli-data`. In my case, this meant updating the `persistence.volumeClaimName` inside my Helm values and pushing that change through ArgoCD.

### Step 4: Cleanup

Once I verified everything was working as expected, I deleted the migration pod:

```bash
kubectl delete pod pvc-migrator
```

Then I cleaned up the old PVC and its corresponding Proxmox disk.

## A Gotcha: “Volume already bound to a different claim”

At one point, I accidentally deleted a PVC without deleting its associated PV. When I tried to recreate it, I got this error:

> volume "pv-tautulli" already bound to a different claim

The fix: manually edit the PV and update the UID for the claim to the UID on the PVC, like so:

```bash
kubectl edit pv pv-tautulli
```

Then delete or reapply your PVC. Problem solved.

The only small thing I'll note here that was different for me - instead of applying and deleting the pods manually, I continued to push them through git and used ArgoCD to sync the changes. I did this mostly for historical purposes and so I could remember how I did the full process and in what order, but either process works great for this purpose.

## Conclusion

Migrating from `csi-proxmox` to `csi-cephfs` has been a surprisingly smooth process once I nailed down this pattern. Using a simple data-copy pod made it safe and predictable, and CephFS has been a huge upgrade in flexibility.

I still have a few more workloads to migrate, but so far I’m really happy with how this is turning out.

If you’re managing your own Proxmox + Kubernetes setup and want more modern storage workflows, I definitely recommend giving CephFS a look.

You can follow my ongoing homelab experiments on [GitHub](https://github.com/calebsmithdev), or keep an eye on [my blog repo](https://github.com/calebsmithdev/personal-site-nuxt) for future updates. I'm publishing all my blog posts in Markdown using [Nuxt Content](https://content.nuxt.com/), so feel free to browse the source as well.
