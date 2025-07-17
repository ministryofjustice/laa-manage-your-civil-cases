#!/bin/bash

ENVIRONMENT=$1
# Convert the branch name into a string that can be turned into a valid URL
  BRANCH_RELEASE_NAME=$(echo "$GITHUB_REF_NAME" | tr '[:upper:]' '[:lower:]' | sed 's:^\w*\/::' | tr -s ' _/[]().' '-' | cut -c1-18 | sed 's/-$//')

deploy_branch() {
# Set the deployment host, this will add the prefix of the branch name e.g el-257-deploy-with-circleci or just main
  RELEASE_HOST="$BRANCH_RELEASE_NAME-mcc-uat.cloud-platform.service.justice.gov.uk"
# Set the ingress name, needs release name, namespace and -green suffix
  IDENTIFIER="$BRANCH_RELEASE_NAME-laa-manage-your-civil-cases-$K8S_NAMESPACE-green"
  echo "Deploying commit: $GITHUB_SHA under release name: '$BRANCH_RELEASE_NAME'..."

  helm upgrade "$BRANCH_RELEASE_NAME" ./deploy/laa-manage-your-civil-cases/. \
                --install --wait \
                --namespace="${K8S_NAMESPACE}" \
                --values ./deploy/laa-manage-your-civil-cases/values/"$ENVIRONMENT".yaml \
                --set image.repository="$REGISTRY/$REPOSITORY" \
                --set image.tag="$IMAGE_TAG" \
                --set ingress.annotations."external-dns\.alpha\.kubernetes\.io/set-identifier"="$IDENTIFIER" \
                --set ingress.hosts[0].host="$RELEASE_HOST" \
                --set env.SERVICE_NAME="$SERVICE_NAME" \
                --set env.SERVICE_PHASE="$SERVICE_PHASE" \
                --set env.DEPARTMENT_NAME="$DEPARTMENT_NAME" \
                --set env.DEPARTMENT_URL="$DEPARTMENT_URL" \
                --set env.CONTACT_EMAIL="$CONTACT_EMAIL" \
                --set env.CONTACT_PHONE="$CONTACT_PHONE" \
                --set env.SERVICE_URL="$SERVICE_URL" \
                --set env.SESSION_SECRET="$SESSION_SECRET" \
                --set env.SESSION_NAME="$SESSION_NAME" \
                --set env.RATELIMIT_HEADERS_ENABLED="$RATELIMIT_HEADERS_ENABLED" \
                --set env.RATELIMIT_STORAGE_URI="$RATELIMIT_STORAGE_URI" \
                --set env.RATE_LIMIT_MAX="$RATE_LIMIT_MAX" \
                --set env.RATE_WINDOW_MS="$RATE_WINDOW_MS" \
                --set env.API_URL="$API_URL" \
                --set env.API_PREFIX="$API_PREFIX" \
                --set env.API_TIMEOUT="$API_TIMEOUT" \
                --set env.API_RETRIES="$API_RETRIES" \
                --set env.API_USERNAME="$API_USERNAME" \
                --set env.API_PASSWORD="$API_PASSWORD" \
                --set env.API_CLIENT_ID="$API_CLIENT_ID" \
                --set env.API_CLIENT_SECRET="$API_CLIENT_SECRET" \
                --set env.NODE_ENV="$NODE_ENV"
}

deploy_main() {  
  helm upgrade manage-civil-cases ./deploy/laa-manage-your-civil-cases/. \
                          --install --wait \
                          --namespace="${K8S_NAMESPACE}" \
                          --values ./deploy/laa-manage-your-civil-cases/values/"$ENVIRONMENT".yaml \
                          --set image.repository="$REGISTRY/$REPOSITORY" \
                          --set image.tag="$IMAGE_TAG" \
                          --set env.SERVICE_NAME="$SERVICE_NAME" \
                          --set env.SERVICE_PHASE="$SERVICE_PHASE" \
                          --set env.DEPARTMENT_NAME="$DEPARTMENT_NAME" \
                          --set env.DEPARTMENT_URL="$DEPARTMENT_URL" \
                          --set env.CONTACT_EMAIL="$CONTACT_EMAIL" \
                          --set env.CONTACT_PHONE="$CONTACT_PHONE" \
                          --set env.SERVICE_URL="$SERVICE_URL" \
                          --set env.SESSION_SECRET="$SESSION_SECRET" \
                          --set env.SESSION_NAME="$SESSION_NAME" \
                          --set env.RATELIMIT_HEADERS_ENABLED="$RATELIMIT_HEADERS_ENABLED" \
                          --set env.RATELIMIT_STORAGE_URI="$RATELIMIT_STORAGE_URI" \
                          --set env.RATE_LIMIT_MAX="$RATE_LIMIT_MAX" \
                          --set env.RATE_WINDOW_MS="$RATE_WINDOW_MS" \
                          --set env.API_URL="$API_URL" \
                          --set env.API_PREFIX="$API_PREFIX" \
                          --set env.API_TIMEOUT="$API_TIMEOUT" \
                          --set env.API_RETRIES="$API_RETRIES" \
                          --set env.API_USERNAME="$API_USERNAME" \
                          --set env.API_PASSWORD="$API_PASSWORD" \
                          --set env.API_CLIENT_ID="$API_CLIENT_ID" \
                          --set env.API_CLIENT_SECRET="$API_CLIENT_SECRET" \
                          --set env.NODE_ENV="$NODE_ENV"
}

if [[ "$GITHUB_REF_NAME" == "main" ]]; then
  deploy_main
else
  if deploy_branch; then
    echo "Deploy succeeded"
  else
    echo "Deploy failed. Attempting rollback"
    if helm rollback "$BRANCH_RELEASE_NAME"; then
      echo "Rollback succeeded. Retrying deploy"
      deploy_branch
    else
      echo "Rollback failed. Consider manually running 'helm delete $BRANCH_RELEASE_NAME'"
      exit 1
    fi
  fi
fi
