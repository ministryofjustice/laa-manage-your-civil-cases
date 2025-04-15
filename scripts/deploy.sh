#!/bin/bash

ENVIRONMENT=$1
# Convert the branch name into a string that can be turned into a valid URL
  BRANCH_RELEASE_NAME=$(echo $GITHUB_REF_NAME | tr '[:upper:]' '[:lower:]' | sed 's:^\w*\/::' | tr -s ' _/[]().' '-' | cut -c1-18 | sed 's/-$//')

deploy_branch() {
# Set the deployment host, this will add the prefix of the branch name e.g el-257-deploy-with-circleci or just main
  RELEASE_HOST="$BRANCH_RELEASE_NAME-mcc-uat.cloud-platform.service.justice.gov.uk"
# Set the ingress name, needs release name, namespace and -green suffix
  IDENTIFIER="$BRANCH_RELEASE_NAME-laa-manage-your-civil-cases-$K8S_NAMESPACE-green"
  echo "Deploying commit: $GITHUB_SHA under release name: '$BRANCH_RELEASE_NAME'..."


  echo "IDENTIFIER: $IDENTIFIER"

  helm upgrade $BRANCH_RELEASE_NAME ./deploy/laa-manage-your-civil-cases/. \
                --install --wait \
                --namespace=${K8S_NAMESPACE} \
                --values ./deploy/laa-manage-your-civil-cases/values/$ENVIRONMENT.yaml \
                --set image.repository="$REGISTRY/$REPOSITORY" \
                --set image.tag="$IMAGE_TAG" \
                --set ingress.annotations."external-dns\.alpha\.kubernetes\.io/set-identifier"="$IDENTIFIER" \
                --set ingress.hosts[0].host="$RELEASE_HOST"
}

deploy_main() {
  helm upgrade manage-civil-cases ./deploy/laa-manage-your-civil-cases/. \
                          --install --wait \
                          --namespace=${K8S_NAMESPACE} \
                          --values ./deploy/laa-manage-your-civil-cases/values/$ENVIRONMENT.yaml \
                          --set image.repository="$REGISTRY/$REPOSITORY" \
                          --set image.tag="$IMAGE_TAG"
}


if [[ "$GITHUB_REF_NAME" == "main" ]]; then
  deploy_main
else
  deploy_branch
  if [ $? -eq 0 ]; then
    echo "Deploy succeeded"
  else
    # If a previous `helm upgrade` was cancelled this could have got the release stuck in
    # a "pending-upgrade" state (c.f. https://stackoverflow.com/a/65135726). If so, this
    # can generally be fixed with a `helm rollback`, so we try that here.
    echo "Deploy failed. Attempting rollback"
    helm rollback $BRANCH_RELEASE_NAME
    if [ $? -eq 0 ]; then
      echo "Rollback succeeded. Retrying deploy"
      deploy_branch
    else
      echo "Rollback failed. Consider manually running 'helm delete $BRANCH_RELEASE_NAME'"
      exit 1
    fi
  fi
fi
