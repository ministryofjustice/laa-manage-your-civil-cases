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
                --set env.SESSION_SECRET="$SESSION_SECRET" \
                --set env.SESSION_ENCRYPTION_KEY="$SESSION_ENCRYPTION_KEY" \
                --set env.API_CLIENT_ID="$API_CLIENT_ID" \
                --set env.API_CLIENT_SECRET="$API_CLIENT_SECRET"
}

deploy_main() {  
  helm upgrade manage-civil-cases ./deploy/laa-manage-your-civil-cases/. \
                          --install --wait \
                          --namespace="${K8S_NAMESPACE}" \
                          --values ./deploy/laa-manage-your-civil-cases/values/"$ENVIRONMENT".yaml \
                          --set image.repository="$REGISTRY/$REPOSITORY" \
                          --set image.tag="$IMAGE_TAG" \
                          --set env.SESSION_SECRET="$SESSION_SECRET" \
                          --set env.SESSION_ENCRYPTION_KEY="$SESSION_ENCRYPTION_KEY" \
                          --set env.API_CLIENT_ID="$API_CLIENT_ID" \
                          --set env.API_CLIENT_SECRET="$API_CLIENT_SECRET"
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
