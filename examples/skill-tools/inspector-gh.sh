#!/bin/sh
set -eu

case "$1" in
  --version) echo 'gh version (fixture)'; exit 0 ;;
  auth) test "$2" = status; exit ;;
  api) ;;
  *) exit 1 ;;
esac

endpoint=${2%%\?*}
case " $* " in
  *' --method '*) case " $* " in *' --method GET '*) ;; *) exit 1 ;; esac ;;
esac
case "$endpoint" in
  graphql) echo '{"data":{"repository":{"viewerCanSeeIssueFields":true,"viewerPermission":"ADMIN","issueFields":{"totalCount":0,"nodes":[],"pageInfo":{"hasNextPage":false}}}}}' ;;
  /repos/acme/widgets) echo '{"full_name":"acme/widgets","owner":{"login":"acme","type":"Organization"}}' ;;
  /repos/acme/widgets/issues/7) echo '{"id":77,"number":7,"title":"fixture parent","state":"open","body":"inspect the packaged command"}' ;;
  /repos/acme/widgets/issues/7/parent) echo '404 not found' >&2; exit 1 ;;
  /repos/acme/widgets/issue-types|/repos/acme/widgets/labels|/repos/acme/widgets/issues|/repos/acme/widgets/issues/7/*) echo '[]' ;;
  *) echo "unexpected fixture endpoint: $endpoint" >&2; exit 1 ;;
esac
