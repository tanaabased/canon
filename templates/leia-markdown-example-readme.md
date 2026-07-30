# EXAMPLE NAME Example

Use this starter when a repo needs a Leia-backed scenario that doubles as both executable coverage and durable example documentation.

Keep the scenario focused on one user-visible flow. Put scenario-owned fixture files or named input directories directly beside this README without a generic local `fixtures/` wrapper.

## Setup

```bash
# should prepare the minimal example prerequisites
test -n "$TMPDIR"
mkdir -p "$TMPDIR/home"

# should run the real prepared entrypoint with the scenario inputs
CI=1 NONINTERACTIVE=1 \
EXAMPLE_MODE=enabled \
script-under-test.sh \
  --target "$TMPDIR/home" \
  --mode example
```

## Testing

```bash
# should create the installed executable in the target directory
test -x "$TMPDIR/home/bin/script-under-test.sh"

# should install the expected config file
test -f "$TMPDIR/home/etc/script-under-test.conf"
```
