# Leia Template-Sensitive Shell Fixture

This fixture proves that the supported Leia release preserves valid shell syntax that its generated JavaScript harness once consumed or rejected.

## Testing

```bash
# should preserve literal `backticks`
printf '%s\n' 'literal `backticks`' | grep -F 'literal `backticks`'

# should preserve braced shell expansions
VAR=braced
test "${VAR}" = braced

# should preserve command substitutions
test "$(printf '%s' substitution)" = substitution

# should preserve shell octal escapes
printf '\033' | od -An -t x1 | tr -d ' \n' | grep -Fx '1b'

# should preserve numeric backreferences
printf '%s\n' abc | sed -E 's/(a)/\1/' | grep -Fx abc
```
