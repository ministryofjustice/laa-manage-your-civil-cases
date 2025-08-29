# MCC Staging CCA Access: Platform Layer Primer

## Overview
This primer will help you understand the platform layer technologies and codebase components involved in enabling MCC (Manage Your Civil Cases) Staging to access the CCA (Civil Case API) Staging environment via Kubernetes network policies.

## Problem Statement Clarification
**Key Insight**: This ticket is about ensuring MCC **staging** environment can access CCA **staging** environment. This is likely a network configuration issue preventing staging-to-staging communication.

## Environment Layout Investigation

### Understanding the Kubernetes Configuration Repository
**Repository**: `cloud-platform-environments`
**Purpose**: Contains namespace definitions and network policies for all MOJ Cloud Platform services

**Key Questions to Answer**:
1. What namespaces exist for MCC and CCA?
   - `laa-manage-your-civil-cases-staging`
   - `laa-civil-case-api-staging` (or similar)
2. What network policies currently exist between these namespaces?
3. Are there separate staging and production CCA environments?

## Immediate Debugging Strategy

### Step 1: Confirm Network Connectivity (Priority #1)
**Goal**: Determine if this is a network policy issue or an authentication issue

**Method**: Shell into Kubernetes pods to test direct network connectivity

### Step 2: Required Setup for Pod Access

#### A. **Kubernetes Credentials**
**What you need**:
- Cloud Platform kubeconfig file
- Access to MOJ Cloud Platform cluster
- Appropriate RBAC permissions for the namespaces

**How to get credentials**:
1. Access the Cloud Platform user guide
2. Follow authentication setup for MOJ developers
3. Download kubeconfig for the cluster hosting MCC/CCA

#### B. **Lens Setup**
**Tool**: Lens (Kubernetes IDE)
**Benefits**: 
- Visual pod management
- Easy shell access to pods
- Real-time resource monitoring
- Network policy visualization

**Setup Steps**:
1. Install Lens desktop application
2. Import Cloud Platform kubeconfig
3. Navigate to staging namespaces
4. Access pod shells directly through UI

### Step 3: Network Connectivity Tests

#### A. **Identify Target Pods**
```bash
# List MCC staging pods
kubectl get pods -n laa-manage-your-civil-cases-staging

# List CCA staging pods
kubectl get pods -n laa-civil-case-api-staging
```

#### B. **Shell into MCC Staging Pod**
```bash
# Via kubectl
kubectl exec -it -n laa-manage-your-civil-cases-staging [mcc-pod-name] -- /bin/bash

# Via Lens: Right-click pod → Shell
```

#### C. **Test Network Connectivity**
```bash
# From inside MCC staging pod, test CCA staging service:

# Test 1: Basic connectivity
ping cca-service.laa-civil-case-api-staging.svc.cluster.local

# Test 2: HTTP connectivity  
curl -v http://cca-service.laa-civil-case-api-staging.svc.cluster.local/health

# Test 3: Check DNS resolution
nslookup cca-service.laa-civil-case-api-staging.svc.cluster.local

# Test 4: Port connectivity
telnet cca-service.laa-civil-case-api-staging.svc.cluster.local 80
```

## Technologies Involved

### 1. **Kubernetes Network Policies**
- **What**: Kubernetes-native way to control traffic flow between pods/namespaces
- **Where**: `cloud-platform-environments` repository
- **Purpose**: Allow/deny network communication between different application namespaces

### 2. **Cloud Platform (Ministry of Justice)**
- **What**: MOJ's Kubernetes-based hosting platform
- **Documentation**: Cloud Platform network policy documentation (referenced in ticket)
- **Default**: Deny-all communication between namespaces unless explicitly allowed

## Environment Layout Questions to Answer

### 1. **Namespace Structure Discovery**
**In `cloud-platform-environments` repository, find**:
```bash
# Look for these namespace directories:
namespaces/live.cloud-platform.service.justice.gov.uk/laa-manage-your-civil-cases-staging/
namespaces/live.cloud-platform.service.justice.gov.uk/laa-civil-case-api-staging/
namespaces/live.cloud-platform.service.justice.gov.uk/laa-civil-case-api-production/
```

**Questions**:
- Does CCA have a separate staging environment?
- Are staging environments in different namespaces than production?
- What are the exact namespace names?

### 2. **Current Network Policy Analysis**
**Files to examine**:
- `networkpolicies.yaml` in each namespace directory
- Look for egress/ingress rules between MCC and CCA namespaces

**Expected Policy Structure**:
```yaml
# In MCC staging namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-to-cca-staging
  namespace: laa-manage-your-civil-cases-staging
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: laa-civil-case-api-staging  # Not production!
```

## Debugging Decision Tree

### Network Test Results → Next Steps

#### ✅ **If Network Connectivity Works**
→ **Issue**: Authentication/JWT configuration
→ **Focus on**: Application configuration, secrets, API credentials

#### ❌ **If Network Connectivity Fails**
→ **Issue**: Network policy configuration  
→ **Focus on**: Kubernetes network policies, namespace labels, DNS resolution

#### 🔍 **If DNS Resolution Fails**
→ **Issue**: Service discovery or namespace targeting
→ **Check**: Service names, namespace names, cluster DNS

## Key Tools and Access Requirements

### 1. **Essential Tools**
- **Lens**: Kubernetes IDE for visual pod management
- **kubectl**: Command-line Kubernetes client
- **Cloud Platform CLI**: MOJ-specific tooling (if available)

### 2. **Access Requirements**
- MOJ Cloud Platform account
- RBAC permissions for staging namespaces
- kubeconfig for the cluster
- VPN access (if required for Cloud Platform)

### 3. **Lens Configuration**
```yaml
# Add Cloud Platform cluster to Lens
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: https://api.live.cloud-platform.service.justice.gov.uk
  name: live.cloud-platform.service.justice.gov.uk
```

## Technologies Involved

### 1. **Kubernetes Network Policies** 
- **What**: Kubernetes-native way to control traffic flow between pods/namespaces
- **Where**: `cloud-platform-environments` repository  
- **Purpose**: Allow/deny network communication between different application namespaces
- **Critical**: Must explicitly allow staging-to-staging communication

### 2. **Cloud Platform (Ministry of Justice)**
- **What**: MOJ's Kubernetes-based hosting platform
- **Documentation**: Cloud Platform network policy documentation (referenced in ticket)
- **Default**: Deny-all communication between namespaces unless explicitly allowed
- **Environment Structure**: Separate namespaces for staging/production per service

### 3. **JWT Authentication**
- **What**: JSON Web Token-based API authentication
- **Issue**: "Missing API credentials for JWT authentication" error
- **Purpose**: Secure communication between MCC and CCA services
- **Note**: Only investigate if network connectivity test passes

## Codebase Areas to Examine (After Network Test)

### 1. **Network Policy Configuration**
**Location**: `cloud-platform-environments` repository
**Files to examine**:
- PR #35593: Network policy updates
- PR #35605: Additional network policy changes  
- PR #34853: Related network policy files

**What to look for**:
```yaml
# Example network policy structure
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  namespace: laa-manage-your-civil-cases-staging
spec:
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: laa-civil-case-api-production # or staging
```

### 2. **MCC Application Configuration**
**Repository**: `laa-manage-your-civil-cases`

#### A. **Deployment Configuration**
**Files to examine**:
- `.github/workflows/deploy.yml`
- `scripts/deploy.sh`

**What to look for**:
- Environment variable configuration
- Secret mounting/injection
- API endpoint configuration
- JWT credential setup

#### B. **Application Configuration Files**
**Look for**:
- `config/` directory
- Environment-specific config files
- API client configuration
- Authentication setup

#### C. **Kubernetes Manifests** 
**Look for**:
- `helm_deploy/` or `deploy/` directories
- `values.yaml` files for different environments
- Secret definitions
- ConfigMap definitions

### 3. **API Client Implementation**
**Files to examine in MCC codebase**:

```typescript
// Look for files containing:
- API client initialization
- JWT token handling
- Environment-specific API URLs
- Authentication middleware
```

**Potential locations**:
- `src/services/` or `lib/services/`
- `src/api/` or `api/`
- `src/config/` or `config/`
- Look for CCA or "civil case" references

### 4. **Environment Variables & Secrets**
**What to trace**:

```bash
# In deploy scripts, look for:
API_URL
JWT_SECRET
CCA_API_KEY
AUTH_TOKEN
CLIENT_ID
CLIENT_SECRET
```

**GitHub Actions Secrets to verify**:
- Check repository Settings > Secrets and variables > Actions
- Look for staging-specific secrets
- Compare with UAT/production secret names

## Debugging Path

### 1. **Network Connectivity**
```bash
# From MCC staging pod, test:
curl -v http://cca-service.laa-civil-case-api-production.svc.cluster.local/health
```

### 2. **Secret Availability**
```bash
# Check if secrets are mounted in staging pods
kubectl exec -n laa-manage-your-civil-cases-staging [pod-name] -- env | grep -i api
```

### 3. **Configuration Comparison**
Compare these between UAT (working) and Staging (broken):
- Environment variables
- Secret values (not content, but existence)
- Network policy rules
- API endpoint URLs

## Key Questions to Investigate

1. **Are the network policies correctly applied?**
   - Check if staging namespace can reach CCA namespace
   - Verify policy syntax and selectors

2. **Are JWT credentials properly configured for staging?**
   - Compare staging vs UAT secret configuration
   - Check if staging has different JWT issuer/audience requirements

3. **Is the API endpoint correct for staging?**
   - Staging might need different CCA endpoint than UAT
   - Check environment-specific configuration

4. **Are GitHub Actions secrets correctly named for staging?**
   - Staging deployment might expect different secret names
   - Check deploy script environment variable mapping

## Next Steps (Revised Priority Order)

### **Phase 1: Network Connectivity Verification** 🚀
1. **Set up Lens and kubectl access** to Cloud Platform
2. **Shell into MCC staging pod** via Lens
3. **Run network connectivity tests** to CCA staging service
4. **Document results** - this determines the investigation path

### **Phase 2A: If Network Fails** (Network Policy Issue)
1. **Examine namespace structure** in cloud-platform-environments
2. **Review current network policies** between MCC and CCA staging
3. **Compare with UAT network policies** (working configuration)
4. **Update network policies** to allow staging-to-staging communication

### **Phase 2B: If Network Works** (Authentication Issue)
1. **Compare staging vs UAT configuration** in MCC repository
2. **Trace JWT authentication flow** in the application code
3. **Verify secret injection** in deployment scripts
4. **Check GitHub Actions secrets** for staging environment

## Access Setup Guide

### **Getting Cloud Platform Access**
1. Request access to MOJ Cloud Platform
2. Configure kubectl with Cloud Platform credentials
3. Install and configure Lens with the kubeconfig
4. Verify access to staging namespaces

### **Lens Navigation Path**
```
Lens → Clusters → live.cloud-platform.service.justice.gov.uk 
     → Namespaces → laa-manage-your-civil-cases-staging
     → Pods → [select MCC pod] → Shell
```

## Files Priority Order

1. `scripts/deploy.sh` - How secrets are injected
2. `.github/workflows/deploy.yml` - GitHub Actions secret mapping
3. Network policy YAML files in cloud-platform-environments
4. Application configuration files for API client setup
5. Kubernetes manifests for staging environment

## Problem Context

**Current Issue**: 
- MCC Staging cannot access CCA API
- Error: "Missing API credentials for JWT authentication"
- UAT environment works correctly
- Network policies have been updated but issue persists

**Related PRs**:
- https://github.com/ministryofjustice/cloud-platform-environments/pull/35593/files
- https://github.com/ministryofjustice/cloud-platform-environments/pull/35605
- https://github.com/ministryofjustice/cloud-platform-environments/pull/34853/files

**Test URL**: https://manage-your-civil-cases-staging.cloud-platform.service.justice.gov.uk/

This should give you a comprehensive map of where to look in the codebase to understand and resolve the staging CCA access issue.
