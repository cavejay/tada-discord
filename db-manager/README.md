# tada-discord's db-manager

Docker container for management of the tada-discord database.

---

## What does this do?

- When run with a single file in `/opt/db-manager/restore`:
  - determine if the currently db currently pointed to is empty/in-use and skip the restore if in-use
  - db-manager will restore the configured tada database to that file
  - that file will be moved to `/opt/db-manager/restore-complete`
- All other times, this container will create a backup file to `/opt/db-manager/backups` at 0000 UTC or $BACKUP_CRON

## How can I use this?

s
