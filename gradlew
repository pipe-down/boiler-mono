#!/usr/bin/env sh
if command -v gradle >/dev/null 2>&1; then
  exec gradle "$@"
else
  echo "Gradle not found. In IntelliJ: 'Generate Gradle Wrapper' (루트) 또는 로컬 Gradle 설치 후 재실행."
  exit 1
fi
