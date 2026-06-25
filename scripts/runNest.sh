cd ./backend
lsof -ti :3010 | xargs -r kill -9
pnpm exec nest start --watch --no-shell