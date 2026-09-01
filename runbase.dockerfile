   # runbase.dockerfile
   # The Sandbox image for this Repository. Runbase builds and pushes it to
   # the Vercel Container Registry on every push that touches this file.

   FROM vercel/sandbox/universal:latest

   # Vercel Sandbox ignores ENTRYPOINT and CMD. The worker starts the agent
   # with its own commands after boot, so this image needs no start step.

   # System packages the agent's code needs. git already ships with the
   # base image, so the clone step works without changes here. ok
   RUN apt-get update \
       && apt-get install -y --no-install-recommends \
         curl \
         jq \
         ripgrep \
       && rm -rf /var/lib/apt/lists/*

   # Optional: pin the tool versions your code expects.
   # RUN npm install -g pnpm@9
   # RUN pip install --no-cache-dir ruff
