#!/bin/sh
exec cloudflared tunnel --no-autoupdate run --token "$TUNNEL_TOKEN"
