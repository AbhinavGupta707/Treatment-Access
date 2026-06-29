# Studio Indication Checklist

Live target capture was not performed in this lane. When the local RPA project
can be created, author the XAML workflow with real UiPath UI Automation
activities and these `TODO Indicate` display names. Do not replace UI actions
with log-only stubs.

## Required UIA Activity Shape

Use one `NApplicationCard` for the mock payer portal browser instance unless the
portal spawns a genuinely different process.

Inside the card, include these activities in order:

1. `TODO Indicate - Use Application/Browser (Mock Payer Portal)`
2. `TODO Indicate - Type Member ID`
3. `TODO Indicate - Type Medication`
4. `TODO Indicate - Type Diagnosis`
5. `TODO Indicate - Click Submit Prior Authorization`
6. `TODO Indicate - Read Confirmation ID`

If the mock portal lane adds authentication, prepend these activities inside the
same application card:

1. `TODO Indicate - Type Synthetic Portal Username`
2. `TODO Indicate - Type Synthetic Portal Password`
3. `TODO Indicate - Click Login`

## Portal Target Contract

Expected visible targets:

- Prior authorization form.
- Member ID input.
- Medication input.
- Diagnosis input.
- Submit button.
- Confirmation region containing the confirmation ID.

The implementation must use UiPath Object Repository target capture or Studio
Indicate. Selectors must not be guessed from DOM, CSS, Playwright, Selenium, or
raw browser scripts.

## Post-Capture Validation

After indication is complete, run:

```bash
uip rpa analyzer-rules list --project-dir "uipath/robots/PayerPortalFallback" --output json
uip rpa validate --file-path "Main.xaml" --project-dir "uipath/robots/PayerPortalFallback" --output json
uip rpa build "uipath/robots/PayerPortalFallback" --log-level Warn --output json
```

Do not run `uip rpa run`, `uip rpa debug start`, or any Orchestrator job until
the orchestrator explicitly approves live smoke against the synthetic portal.
