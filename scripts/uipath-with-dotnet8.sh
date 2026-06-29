#!/usr/bin/env sh
set -eu

if [ -d "/opt/homebrew/opt/dotnet@8/libexec" ]; then
  DOTNET_ROOT="/opt/homebrew/opt/dotnet@8/libexec"
elif [ -d "/usr/local/share/dotnet" ]; then
  DOTNET_ROOT="/usr/local/share/dotnet"
else
  echo "Unable to locate a .NET install. Install .NET 8 before running UiPath RPA build/pack commands." >&2
  exit 1
fi

export DOTNET_ROOT
export PATH="$DOTNET_ROOT:$PATH"

exec "$@"
