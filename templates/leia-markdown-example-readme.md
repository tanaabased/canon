# EXAMPLE NAME Example

<!-- replace this starter prose with the real flow and its evidence limits. link adjacent exclusions to existing examples, tests, or upstream owners; state missing owners instead of inventing destinations. equivalent headings are fine; omit empty sections. distinguish executed checks from manual, future, or still-unrelocated coverage. keep fixture files or named input directories beside the README without a generic local fixtures wrapper. -->

When asked to install into an empty target, prepare the target, run the public installer, and verify that it leaves an executable and config file in the expected locations.

## What belongs here

- One installation into an isolated target and checks for the resulting executable and config file.

## What does not belong here

- Repeat reconciliation, invoking the installed executable, and teardown. This generic starter has no product-specific owners; replace these exclusions with the real concerns and links before adopting it.

## Notes

- The executable checks establish file presence and executable permission, not config validity or successful use of the installed product.

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
